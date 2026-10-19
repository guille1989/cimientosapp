import type { ZodError } from "zod";
import { translate, type Locale } from "./i18n";
export function validationMessage(error: ZodError, locale: Locale) {
  const t = <T>(message:T) => translate(locale,message);
  const details = error.issues.slice(0,3).map(issue=>{
    const field = issue.path.map(p=>t(String(p))).join(" · ");
    let message = t(issue.message);
    if (issue.path.at(-1) === "idempotencyKey") return t("idempotencyKey") + ": " + t("La referencia de la solicitud no es válida. Actualiza la página y vuelve a intentarlo.");
    if(message===issue.message && issue.code!=="custom") {
      if(issue.code==="too_small") message=translate(locale,issue.origin==="string"?"Introduce al menos {value0} caracteres.":"El valor mínimo es {value0}.",{value0:String(issue.minimum)});
      else if(issue.code==="too_big") message=translate(locale,"El valor máximo es {value0}.",{value0:String(issue.maximum)});
      else if(issue.code==="invalid_format") message=t("Introduce un correo válido.");
      else if(issue.code==="invalid_value") message=t("Elige una de las opciones disponibles.");
      else message=t("Valor no válido.");
    }
    return (field?field+": ":"")+message;
  }).join("; ");
  return translate(locale,"Revisa el formulario: {value0}",{value0:details});
}

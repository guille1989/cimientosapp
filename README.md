# Cimiento

MVP local y navegable de financiación participativa inmobiliaria para inversores, promotores y administradores. Conserva la landing original en `dist/` y su imagen arquitectónica; la aplicación nueva utiliza Next.js con App Router, TypeScript, Tailwind CSS 4, componentes accesibles de Radix, Lucide, Prisma y SQLite.

**Entorno de demostración. Los proyectos, rentabilidades y movimientos mostrados son ficticios.**

No hay pagos, inversiones, identificación, verificaciones KYC, certificaciones técnicas ni comunicaciones externas reales. Cimiento no se presenta como entidad autorizada o supervisada por la CNMV. La rentabilidad y los plazos no están garantizados; puede perderse parte o todo el capital. No existe garantía de depósitos ni liquidez garantizada.

## Instalación y ejecución

Requisitos: Node.js 20.9 o superior (verificado con Node 24), npm y conexión a internet para descargar dependencias y el motor de Prisma. No se necesita un servicio de base de datos.

Desde esta carpeta:

```powershell
npm install
npm run db:setup
npm run dev
```

Abre <http://127.0.0.1:3000>. El servidor se enlaza únicamente a la interfaz local.

`db:setup` copia `.env.example` a `.env` si falta, prepara el archivo SQLite, genera el cliente Prisma, aplica las migraciones y ejecuta el seed idempotente. El seed conserva los cambios existentes y no borra operaciones. Las nuevas instalaciones obtienen los proyectos y cuentas de ejemplo. No se necesita un secreto para utilizar esta demostración local.

Comandos separados:

```powershell
npm run db:migrate
npm run db:seed
npm run typecheck
npm test
npm run build
npm start
```

Detén `npm run dev` antes de construir o ejecutar la versión de producción, para no compartir archivos de `.next` entre dos servidores. `npm start` sirve el build en la misma dirección local. No publiques este MVP como servicio de inversión real.

En Windows, Prisma 6 puede devolver `Schema engine error` si aún no existe el archivo SQLite: `scripts/ensure-db.mjs`, incluido en los comandos de preparación, crea el archivo vacío sin borrar una base existente. Si npm requiere aprobar scripts de instalación, revisa los paquetes indicados por npm; `prisma generate` descarga y prepara el motor durante `db:setup`.

## Despliegue en Vercel

El repositorio incluye configuración de Next.js y Node 24 para Vercel, un build que genera Prisma y aplica migraciones PostgreSQL, y carga opcional de datos ficticios. SQLite se conserva para uso local. Consulta [VERCEL.md](VERCEL.md) y la plantilla de variables [.env.vercel.example](.env.vercel.example) antes de importar el proyecto. El despliegue requiere una base PostgreSQL y sus dos cadenas de conexión; no publica ni contrata servicios automáticamente.

## Cuentas de demostración

Contraseña común: **`Demo123!`**.

| Rol | Correo | Punto de entrada |
| --- | --- | --- |
| Inversor aprobado | `inversor@cimiento.demo` | `/inversor` |
| Promotor | `promotor@cimiento.demo` | `/promotor` |
| Administrador | `admin@cimiento.demo` | `/admin` |

En desarrollo aparece un selector de rol. El cliente y la API lo desactivan en producción. Las mismas cuentas pueden probarse mediante `/acceso` en el build de producción. El registro admite perfiles ficticios de inversor o promotor; no permite crear administradores. Utiliza correos inventados terminados en `@cimiento.demo`, nombres inventados y las identidades de ejemplo, sin documentos ni información reales.

## Rutas

| Área | Rutas |
| --- | --- |
| Pública | `/`, `/proyectos`, `/proyectos/[slug]`, `/como-funciona`, `/riesgos`, `/preguntas-frecuentes` |
| Cuenta | `/acceso`, `/registro`, `/onboarding` |
| Inversor | `/inversor`, `/inversor/cartera`, `/inversor/movimientos`, `/inversor/documentos`, `/inversor/notificaciones`, `/inversor/perfil` |
| Promotor | `/promotor`, `/promotor/solicitud`, `/promotor/proyectos`, `/promotor/hitos` |
| Administración | `/admin`, `/admin/proyectos`, `/admin/usuarios`, `/admin/hitos`, `/admin/distribuciones`, `/admin/incidencias`, `/admin/auditoria` |
| API local | `GET /api/state`, `POST /api/actions`, `GET /api/documents/[id]`, `GET /api/export` |

La solicitud del promotor se guarda por pasos como borrador y se envía a revisión. Un administrador puede consultar el expediente, modificar datos y documentación, evaluar los diez factores de riesgo, aprobar, solicitar información, publicar o cancelar dejando una justificación. Los avances e incidencias aparecen en el proyecto. Los hitos requieren evidencia ficticia, certificación simulada y aprobación administrativa para registrar un desembolso.

## Recorrido de inversión

1. Accede con la cuenta de inversor o crea una nueva y completa los diez pasos del onboarding.
2. Explora y filtra los proyectos. **Patio Chamberí** está inicialmente abierto.
3. Consulta sus pestañas, documentación e hitos. Simula 100 €, 500 €, 1.000 € o un importe personalizado en euros enteros.
4. Revisa las cuatro aceptaciones individuales y confirma en el proveedor de pagos **simulado**.
5. Consulta el compromiso en `/inversor/cartera`; puedes cancelarlo mientras la reflexión siga activa.
6. El periodo configurable es de 96 horas por defecto. El administrador dispone de una herramienta identificada para finalizarlo expresamente en la demostración. No altera el reloj real.

La capacidad disponible se valida en el servidor y se reserva atómicamente: dos compromisos simultáneos no pueden sobrepasar el objetivo. Al cancelar se libera la capacidad y se registra el movimiento. Al expirar la reflexión pasa a confirmado; cuando se alcanza la financiación pasa a invertido. Si vence la fecha de financiación sin alcanzar el objetivo, se cancelan y reembolsan los compromisos ficticios. La liquidación de estados se ejecuta al consultar los datos, sin un servicio de tareas programadas externo. El capital desembolsado requiere un tratamiento de incidencias y recuperación, no una cancelación automática.

Los gráficos y métricas de cartera se calculan a partir de compromisos, devoluciones y distribuciones del usuario. Los importes globales iniciales de financiación y número de inversores incluyen agregados ficticios de escenario; no representan un libro completo de cientos de usuarios. Las distribuciones nuevas se reparten sobre los compromisos efectivamente registrados y su saldo pendiente, sin superar el capital disponible.

## Arquitectura

- `app/`: rutas, layouts con control de sesión y rol en el servidor, páginas y manejadores HTTP.
- `components/`: navegación, portales, formularios, tablas, estados, simulador, barras, gráficos CSS accesibles, documentos, línea temporal y diálogos Radix con control de foco.
- `lib/types.ts`: contratos de la aplicación y estados.
- `lib/domain.ts`: reglas puras de inversión, reflexión, estimación, filtros, progreso de obra y puntuación de riesgo.
- `lib/services.ts`: validación Zod, transacciones, autorización y persistencia de las operaciones.
- `lib/auth.ts`: proveedor de identidad de demostración, sesiones opacas, contraseñas derivadas con scrypt, cookies HTTP-only y protección de origen y abuso.
- `lib/providers.ts`: interfaces/adaptadores de demostración para los servicios externos que deberán sustituirse antes de producción.
- `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`: modelo, migraciones SQL y datos iniciales.
- `tests/`: reglas de dominio, API y recorridos de navegador Playwright.

Los importes persistidos se guardan como céntimos enteros; las interfaces se expresan en euros. Las fechas se intercambian en ISO y se presentan en español. Los datos privados nunca se incluyen en el estado público. La API exige rol y propiedad de cada entidad; ocultar una pantalla no es la barrera de seguridad. Ningún secreto de servidor se expone en el cliente.

Los documentos descargados son archivos de texto generados e identificados como ficticios, sin validez contractual, técnica o fiscal. No se permiten rutas arbitrarias ni cargas de documentos personales. La exportación CSV solo incluye movimientos del usuario y respeta sus filtros. No hay envíos de correo, llamadas a entidades de pagos o verificaciones de identidad.

## Modelo de datos

| Entidad | Función |
| --- | --- |
| `User`, `Session` | Cuenta por rol y sesión de demostración |
| `InvestorProfile`, `PromoterProfile` | Perfil, borrador de onboarding y empresa ficticia |
| `SuitabilityAssessment` | Respuestas, resultado del test, adecuación y aceptación expresa |
| `Project`, `ProjectFinancials` | Expediente, estados, calendario, estructura financiera y capacidad |
| `ProjectRiskAssessment` | Diez factores explicables y decisión humana justificada |
| `ProjectMilestone` | Evidencia, certificación, aprobación y desembolso ficticio |
| `ProjectDocument`, `ProjectUpdate` | Documentación generada y diario de obra |
| `InvestmentCommitment` | Reserva, reflexión, estado, capital devuelto e interés recibido |
| `Transaction`, `Distribution` | Movimientos y distribuciones simuladas |
| `Notification`, `AuditEvent` | Avisos internos y registro de cambios con valores anteriores/posteriores |

Roles, estados de proyecto, onboarding, compromisos y movimientos se definen mediante enums. SQLite facilita la ejecución local. Para PostgreSQL se deberá cambiar el proveedor y la URL, generar y revisar migraciones específicas de PostgreSQL, trasladar los datos y verificar las garantías de concurrencia y el aislamiento de las transacciones. No reutilices directamente el SQL SQLite en PostgreSQL.

## Variables de entorno

| Variable | Valor local | Uso |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | SQLite relativo a `prisma/` |
| `DEMO_MODE` | `true` | Habilita exclusivamente los adaptadores ficticios; la API falla si no está activado |
| `REFLECTION_HOURS` | `96` | Periodo de reflexión configurable, entre 1 y 168 horas, solo una regla de demostración |
| `APP_ORIGIN` | Opcional | Origen explícito para comprobar solicitudes cuando exista un proxy confiable |
| `TRUST_PROXY` | Opcional, desactivado | Solo con `true` y un proxy confiable se utiliza su IP reenviada para los límites de solicitudes |
| `CIMIENTO_START_SERVER` | Opcional, `true` | Permite a Playwright iniciar `npm run dev` automáticamente |

El periodo de reflexión y el test son supuestos del prototipo; no constituyen una implementación jurídica o regulatoria válida para operar.

## Pruebas y verificación

```powershell
npm run typecheck
npm test
# Con la aplicación ya ejecutándose en 127.0.0.1:3000:
npm run test:e2e
npm run build
```

Playwright usa Google Chrome instalado (`channel: chrome`). Si no está instalado, instala Chrome o adapta `playwright.config.ts` a un navegador disponible. Para que las pruebas arranquen su propio servidor en PowerShell: `$env:CIMIENTO_START_SERVER='true'; npm run test:e2e`. No ejecutes varios Playwright simultáneamente compartiendo la misma carpeta de resultados.

Para repetir la revisión de todas las pantallas con el servidor iniciado: `node scripts/verify-ui.mjs`. Genera capturas y `output/qa/ui-verification.json`, y comprueba consola y desbordamientos en 1440, 768 y 390 píxeles.

Verificación realizada el 17 de octubre de 2026: TypeScript y build de producción correctos, 11 pruebas de dominio y 14 pruebas de API/navegador superadas, migración y seed desde una base vacía y 38 comprobaciones de pantallas sin errores de consola ni desbordamientos. Estas 38 comprobaciones también se han repetido sobre el servidor de producción con las tres cuentas. La base entregada contiene el escenario inicial limpio; el historial local de las pruebas anteriores se conserva en `output/qa/verified-test-data.db`.

Las pruebas de dominio cubren mínimo de 100 €, porcentaje financiado, capacidad máxima, cancelación durante reflexión, transición del compromiso, permisos, cálculo bruto, filtros, progreso ponderado de hitos y riesgo explicable. Las pruebas de API verifican permisos, privacidad, documentos, CSV, origen, validación del onboarding, titularidad, solicitudes, revisión, desembolsos, final de reflexión, all-or-nothing, idempotencia y concurrencia.

El navegador prueba el recorrido completo **explorar → simular → aceptar riesgos → confirmar → cartera → cancelar**, el onboarding con guardado de borrador y aceptación expresa, los filtros/lista del mercado, las pestañas con teclado, los documentos, la galería, las páginas móviles, la solicitud del promotor y la revisión/publicación por un administrador. Las pruebas escriben datos ficticios adicionales en la base local; no deben ejecutarse contra datos que deban conservarse como escenario inmutable.

## Alcance y limitaciones

- Producto operativo de demostración: deuda inmobiliaria en euros y España, mínimo 100 €, todo o nada y desembolsos por hitos. Ninguna operación mueve dinero real.
- Onboarding y puntuaciones orientativas simuladas. Un perfil posiblemente inadecuado requiere revisión manual y no puede invertir sin aceptación expresa y aprobación ficticia.
- Interés simple bruto, comisión de inversor de demostración de 0 €, sin cálculo de impuestos ni asesoramiento fiscal.
- Agregados de escenarios iniciales, imágenes arquitectónicas ilustrativas y documentos ficticios. No son proyectos ofertados al público ni comprobaciones reales de promotores.
- Sesiones locales de demostración, protección básica y límites de solicitudes en memoria. No reemplazan IAM de producción, MFA, recuperación de acceso, monitorización distribuida, copias de seguridad ni una auditoría de seguridad.
- Notificaciones internas persistentes; sus preferencias se guardan. No hay email ni push externos.
- Sin publicación ni sincronización de la aplicación con servicios de hosting. `.openai/hosting.json` y `dist/` son la landing anterior y se conservan como trabajo previo; no configuran el despliegue del servidor Next.js.

Identificadas como **Próximamente**: aportaciones periódicas, reinversión automática, carteras diversificadas, equity, rentas, tablón secundario, app móvil, expansión europea y otras monedas. No se promete liquidez en el futuro tablón. Sin blockchain, criptomonedas ni tokenización.

## Antes de operar una plataforma real

Serían necesarios el análisis jurídico y regulatorio y las autorizaciones aplicables, proveedores autorizados de pagos/custodia y KYC/AML, identidad y seguridad de producción, contratos y documentación revisados por profesionales, evaluación real de promotores y garantías, certificaciones técnicas independientes, fiscalidad, protección de datos, conciliación contable, gestión real de impagos/recuperaciones, auditoría, observabilidad, tareas programadas, backups y recuperación ante incidentes. Las interfaces de demostración deben sustituirse por esos servicios; este repositorio no es suficiente para captar fondos ni ofrecer inversiones reales.


## Español e inglés

La aplicación incluye internacionalización `es` y `en` con el selector de idioma de la cabecera, también disponible en móvil. La preferencia se conserva durante un año en la cookie `cimiento_locale` y se aplica en el servidor a la primera carga, al idioma del HTML y a los metadatos. Español es el valor predeterminado. Las rutas y la sesión se conservan al cambiar de idioma.

- Catálogos revisados: `messages/es.json` y `messages/en.json`. Los mensajes originales en español son sus identificadores estables.
- Cliente: `I18nProvider`, `useI18n()`, `t()`, `formatMoney()` y `formatDate()`. La traducción se realiza en React; no hay traducción del DOM ni un servicio externo.
- Servidor: `getServerLocale()` y `requestLocale()`. Las API aceptan la cookie o el encabezado validado `x-cimiento-locale: es|en`.
- Se traducen páginas públicas, los tres portales, formularios, navegación, accesibilidad, estados, validaciones, mensajes, notificaciones del sistema, documentación y CSV. El contenido inicial ficticio dispone de traducciones, incluidos hitos, informes y riesgos.
- Formatos: `es-ES` y `en-GB`, siempre en euros y con fechas del mercado español (`Europe/Madrid`). Los CSV conservan fechas ISO para interoperabilidad y localizan sus cabeceras, descripciones y separador decimal.
- Los plurales utilizan `Intl.PluralRules`. Las interpolaciones se validan mediante pruebas.
- Los nombres propios, identificadores, números, respuestas internas del onboarding y texto libre escrito por usuarios se conservan. Los formularios no reescriben datos guardados al cambiar de idioma; el texto libre nuevo requiere traducción editorial si debe publicarse en varios idiomas. No se promete traducción automática.

Para añadir una traducción, incorpora el mensaje y su equivalente a ambos catálogos y utiliza `t("Mensaje original")` para textos visibles. No traduzcas valores de formularios, rutas, IDs ni estados internos. Para mensajes con variables utiliza `t("Hola, {value0}.", {value0: nombre})`.

Pruebas: `npm test` comprueba catálogos, interpolaciones, formatos, idioma válido y mensajes heredados. `npx playwright test tests/i18n.spec.ts` comprueba persistencia y metadatos, inversión y cancelación en inglés, documentos, CSV, errores y roles. `node scripts/verify-i18n.mjs` recorre 80 combinaciones de pantalla, idioma y tamaño, comprueba la consola y genera capturas e informe en `output/qa-i18n/`.


## Confirmación de inversiones y reintentos

La acción `invest` requiere una `idempotencyKey` UUID por intención de inversión. La clave se vincula al usuario, proyecto e importe. Repetir esa misma solicitud devuelve el compromiso existente y su estado actual; no añade otro movimiento, notificación ni evento de creación. Cambiar el proyecto o importe con una clave ya utilizada devuelve HTTP 409. Una inversión nueva e intencionada utiliza una clave nueva.

La clave y el importe pendientes se conservan en `sessionStorage` por usuario/proyecto. Si se pierde la respuesta, se pueden recuperar desde «Revisar solicitud pendiente», incluso tras recargar o cuando el primer intento haya completado la financiación. El usuario vuelve a revisar y aceptar las advertencias. La interfaz muestra el estado y la fecha de reflexión del compromiso recuperado. Al recibir una confirmación válida, se elimina la referencia pendiente.

La recuperación local dura lo que conserva el navegador el almacenamiento de esa pestaña; no es una sincronización entre dispositivos. Si el almacenamiento está bloqueado, no se envía una confirmación nueva sin poder conservar su referencia. Los errores inciertos mantienen la clave; los rechazos definitivos de validación liberan esa intención. El servidor comprueba siempre la sesión y el rol. Una clave de otro usuario no permite acceder a su compromiso.

La migración `20261019160000_commitment_idempotency` añade una columna opcional y una restricción única por usuario/clave, conservando los compromisos históricos. Existen migraciones independientes para SQLite y PostgreSQL. El build de Vercel la aplica automáticamente al desplegar esta versión; no requiere nuevas variables de entorno.

`tests/investment-reliability.spec.ts` prueba concurrencia, reutilización incompatible, separación entre usuarios y registro → onboarding → confirmación con respuesta perdida → recarga → recuperación → cartera → cancelación, en español y en inglés. El recorrido inglés también se prueba en móvil. Utiliza bases dedicadas: las pruebas crean y eliminan sus propios proyectos y usuarios.

Una ejecución rápida de todos los escenarios puede alcanzar el límite de solicitudes de la demo. Si aparece HTTP 429, respeta su ventana de un minuto o ejecuta los grupos con un servidor de pruebas recién iniciado entre ellos; no reduzcas la protección para pasar las pruebas.

La garantía de no duplicar aquí se refiere al registro transaccional de operaciones ficticias. Un proveedor de pagos real necesitará idempotencia propia, eventos persistentes, conciliación y recuperación de fallos antes de procesar dinero.

## Ficha de proyecto: inversión y seguimiento

El simulador y el panel de captación se muestran únicamente en préstamos con estado `FUNDING`, plazo de financiación vigente y capital pendiente suficiente para la inversión mínima. La misma comprobación se comparte entre la ficha y el formulario. El servidor sigue validando cada compromiso de forma independiente.

Los demás estados muestran un panel de seguimiento: estado del proyecto, progreso declarado de obra, próximo hito por fecha prevista, última actualización y accesos a las pestañas de calendario y novedades. Los proyectos devueltos o cancelados conservan su historial y no presentan un próximo hito como una operación pendiente. Los retrasos y la recuperación incluyen advertencias específicas.

Los inversores con compromisos en ese proyecto ven además su propia posición, los estados de sus compromisos, capital pendiente de devolución, devoluciones e intereses recibidos. Los compromisos cancelados o reembolsados no se suman al capital activo ni a las devoluciones del préstamo. El tipo objetivo se conserva como condición de la participación, identificado como no garantizado. Los visitantes y otros roles ven únicamente la información del proyecto.

Si existe una solicitud pendiente de comprobar, sigue disponible su recuperación con el importe original, incluso cuando el primer intento haya completado la financiación. En ese caso no se vuelve a mostrar un formulario para iniciar otra inversión. No se añaden variables de entorno, dependencias ni migraciones con este ajuste.

`tests/project-followup.spec.ts` comprueba los estados de la ficha, disponibilidad real del simulador, navegación por teclado, posición propia sin cancelaciones ni datos ajenos, información incompleta y presentación en escritorio, tablet y móvil, con español e inglés. Sus variantes de estado utilizan respuestas controladas de `/api/state`; la recuperación y cancelación se verifican además contra la API y base local dedicadas mediante `tests/investment-reliability.spec.ts`.

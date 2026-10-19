import {test,expect} from "@playwright/test";

test("idioma persistente, metadatos, navegación y retorno al español",async({page})=>{
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang","es");
  await page.getByRole("combobox",{name:"Idioma",exact:true}).selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang","en");
  await expect(page.getByRole("heading",{level:1})).toContainText("Invest in");
  await expect(page.getByText("Demonstration environment. All projects, returns and transactions shown are fictional.",{exact:true})).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang","en");
  await expect(page).toHaveTitle(/Invest in/);
  const initialHTML=await (await page.request.get("/")).text();
  expect(initialHTML).toContain('lang="en"');
  expect(initialHTML).toContain("Invest in");
  await page.goto("/como-funciona");
  await expect(page).toHaveTitle(/How it works/);
  await expect(page.getByText("Selection and assessment",{exact:true})).toBeVisible();
  await page.getByRole("combobox",{name:"Language",exact:true}).selectOption("es");
  await expect(page.locator("html")).toHaveAttribute("lang","es");
  await expect(page.getByText("Selección y análisis",{exact:true})).toBeVisible();
});

test("inversión completa en inglés y documentos y CSV localizados",async({page,context,baseURL})=>{
  await context.addCookies([{name:"cimiento_locale",value:"en",url:baseURL!}]);
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/acceso");
  await page.getByLabel("Email address",{exact:true}).fill("inversor@cimiento.demo");
  await page.getByLabel("Password",{exact:true}).fill("Demo123!");
  await page.getByRole("button",{name:"Sign in",exact:true}).click();
  await expect(page).toHaveURL(/\/inversor$/);
  await expect(page.getByRole("heading",{level:1})).toContainText("Hello, Alex.");
  await page.goto("/proyectos/patio-chamberi");
  await expect(page.getByText("Patio Chamberí is a fictional residential refurbishment and construction project",{exact:false})).toBeVisible();
  const amount=page.getByLabel("Custom amount (€)",{exact:true});
  await amount.fill("99");
  await expect(page.locator("#investment-validation")).toContainText("The minimum investment is");
  await amount.fill("100");
  await page.getByRole("button",{name:"Invest · demonstration",exact:true}).click();
  const review=page.getByRole("dialog",{name:"Review your commitment",exact:true});
  await expect(review.getByRole("button",{name:"Continue to simulated provider"})).toBeDisabled();
  for(const message of [
    "I understand that I could lose some or all of my capital.",
    "I accept that delays and defaults may occur and that liquidity is not guaranteed.",
    "I understand that the target return and timeline are not guaranteed.",
    "I have reviewed the fictional documents and the conditions of this demonstration.",
  ]) await review.getByLabel(message,{exact:true}).check();
  await review.getByRole("button",{name:"Continue to simulated provider"}).click();
  const provider=page.getByRole("dialog",{name:"Simulated payment provider",exact:true});
  await provider.getByLabel("I only authorise recording this fictional transaction. I understand that no real payment is made.",{exact:true}).check();
  await provider.getByRole("button",{name:"Confirm fictional commitment",exact:true}).click();
  const success=page.getByRole("dialog",{name:"Commitment created",exact:true});
  await expect(success).toBeVisible();
  await success.getByRole("link",{name:"View my portfolio",exact:true}).click();
  const row=page.locator("tbody tr").first();
  await expect(row).toContainText("In reflection");
  await row.getByRole("button",{name:"Cancel",exact:true}).click();
  await page.getByRole("dialog").getByRole("button",{name:"Confirm cancellation",exact:true}).click();
  await expect(row).toContainText("Cancelled");
  const doc=await page.request.get("/api/documents/p-madrid-doc1");
  expect(doc.headers()["content-language"]).toBe("en");
  expect(await doc.text()).toContain("Document generated exclusively for demonstration.");
  const csv=await page.request.get("/api/export");
  expect(csv.headers()["content-language"]).toBe("en");
  expect(await csv.text()).toContain("Date;Project;Type;Amount EUR;Description");
  expect(errors).toEqual([]);
});

test("tres roles y formularios ingleses, errores del servidor y móvil",async({page,context,baseURL})=>{
  await context.addCookies([{name:"cimiento_locale",value:"en",url:baseURL!}]);
  const invalid=await page.request.post("/api/actions",{data:{action:"login",payload:{email:"inversor@cimiento.demo",password:"incorrect"}}});
  expect(invalid.status()).toBe(401);expect((await invalid.json()).message).toBe("The email or password is incorrect.");
  const validation=await page.request.post("/api/actions",{data:{action:"register",payload:{email:"not-an-email",password:"x",name:"",role:"INVESTOR"}}});
  expect(validation.status()).toBe(400);expect((await validation.json()).message).toContain("Check the form");
  for(const [role,route,heading] of [
    ["promotor","/promotor/solicitud","Capital to build."],
    ["admin","/admin/proyectos","Project pipeline"],
    ["inversor","/inversor/perfil","My profile"],
  ]){
    const login=await page.request.post("/api/actions",{data:{action:"login",payload:{email:role+"@cimiento.demo",password:"Demo123!"}}});
    expect(login.ok()).toBeTruthy();
    await page.goto(route);await expect(page.getByRole("heading",{level:1})).toHaveText(heading);
    if(role==="promotor"){
      await page.getByRole("button",{name:"Continue",exact:true}).click();
      await expect(page.locator("#app-licenses")).toHaveValue("En tramitación");
      await expect(page.locator("#app-licenses option:checked")).toHaveText("In progress");
      await page.locator("#app-licenses").selectOption("Concedidas");
      await page.getByRole("combobox",{name:"Language",exact:true}).selectOption("es");
      await expect(page.locator("#app-licenses")).toHaveValue("Concedidas");
      await page.getByRole("combobox",{name:"Idioma",exact:true}).selectOption("en");
      await expect(page.locator("#app-licenses")).toHaveValue("Concedidas");
    }
    if(role==="inversor"){
      const country=page.getByRole("combobox",{name:"Fictional tax residence",exact:true});
      await expect(country).toHaveValue("España");
      await country.selectOption("Francia");
      await page.getByRole("combobox",{name:"Language",exact:true}).selectOption("es");
      await expect(page.getByRole("combobox",{name:"Residencia fiscal ficticia",exact:true})).toHaveValue("Francia");
      await page.getByRole("combobox",{name:"Idioma",exact:true}).selectOption("en");
      await expect(country).toHaveValue("Francia");
    }
    await page.setViewportSize({width:390,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route).toBeTruthy();
    await expect(page.getByRole("combobox",{name:"Language",exact:true})).toBeVisible();
    await page.setViewportSize({width:1280,height:900});
  }
});

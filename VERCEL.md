# Desplegar la demostración en Vercel

El repositorio está preparado para Next.js en Vercel y PostgreSQL persistente. El archivo SQLite sigue siendo la base local. Vercel no proporciona el almacenamiento compartido persistente que necesita ese archivo: [documentación oficial](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel).

## Configuración del proyecto

Importa el repositorio que contiene esta carpeta, con estos ajustes:

| Ajuste | Valor |
| --- | --- |
| Root Directory | La carpeta que contiene `package.json` y `vercel.json`; `.` si es la raíz del repositorio |
| Framework Preset | Next.js |
| Node.js | 24.x, fijado en `package.json` |
| Install Command | `npm ci` |
| Build Command | `npm run vercel-build` |
| Output Directory | Valor predeterminado de Next.js, sin override |

`vercel.json` ya fija framework, instalación y build. No selecciones `dist/`: contiene la landing anterior. Las rutas de la aplicación necesitan servidor y no utilizan un export estático.

## Base de datos y variables

Conecta una base PostgreSQL desde Storage/Marketplace o utiliza una PostgreSQL existente dedicada a esta demostración. Crea las variables siguientes en **Settings → Environment Variables**, antes del primer despliegue. `.env.vercel.example` contiene una plantilla sin credenciales.

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL de ejecución, preferiblemente con pooling |
| `DIRECT_URL` | URL PostgreSQL directa para migraciones y seed; debe apuntar a la misma base y esquema |
| `DEMO_MODE` | `true` |
| `REFLECTION_HOURS` | `96` |
| `SEED_DEMO_DATA` | `true` para cargar los proyectos y cuentas; después puede ser `false` |
| `TRUST_PROXY` | `false`, o sin definir |
| `APP_ORIGIN` | Opcional: origen HTTPS fijo de producción, sin barra final |

Utiliza las cadenas de conexión completas del proveedor, con contraseña codificada y TLS según sus instrucciones. Si la integración proporciona nombres como `POSTGRES_PRISMA_URL` o `POSTGRES_URL_NON_POOLING`, copia sus valores a `DATABASE_URL` y `DIRECT_URL` respectivamente. No añadas `NEXT_PUBLIC_` a ninguna cadena de conexión. Si tu proveedor ofrece una única conexión PostgreSQL directa, puede utilizarse en ambas variables; configura el pooling antes de aumentar el tráfico.

En un proveedor con PgBouncer utiliza la conexión agrupada para la app y la directa para migraciones, siguiendo sus parámetros para Prisma 6. La plantilla limita la conexión de cada instancia con `connection_limit=1`; conserva los parámetros específicos del proveedor. El despliegue regenera el cliente Prisma para evitar reutilizar uno de SQLite o uno desactualizado en la caché de Vercel. [Prisma 6 y Vercel](https://docs.prisma.io/docs/orm/v6/prisma-client/deployment/serverless/deploy-to-vercel).

Al crear un Preview, configura una base o rama de pruebas distinta mediante las variables de **Preview**. No compartas la base de Production: el build aplica migraciones y puede cargar datos ficticios. `DATABASE_URL` y `DIRECT_URL` deben pertenecer al mismo entorno.

Puedes omitir `APP_ORIGIN`: el servidor reconoce el dominio de cada despliegue HTTPS. Si la defines para un dominio personalizado, limítala a **Production**; no copies ese origen a las previews. No se aceptan orígenes reenviados arbitrariamente.

## Qué ejecuta el build

1. Valida PostgreSQL, las variables y `DEMO_MODE=true` antes de realizar cambios.
2. Sincroniza `prisma/postgresql/schema.prisma` desde el modelo local.
3. Genera el cliente Prisma para PostgreSQL.
4. Ejecuta `prisma migrate deploy` con el historial PostgreSQL independiente.
5. Ejecuta el seed ficticio si `SEED_DEMO_DATA=true`.
6. Compila Next.js con webpack.

Un error en una migración o en el seed detiene el build. El seed es idempotente: no borra proyectos ni movimientos existentes. El despliegue inicia una base ficticia nueva; no copia automáticamente los movimientos de `prisma/dev.db`.

El build necesita conectividad a `DIRECT_URL`, además de las credenciales de ejecución. Una URL de ejemplo no basta. No uses `prisma db push` ni las migraciones SQLite contra PostgreSQL. Al cambiar el modelo, ejecuta `npm run db:sync:postgres` y genera/revisa una migración PostgreSQL nueva antes de subir cambios; no edites una migración ya aplicada.

Para preparar esa base desde un terminal local (con las variables PostgreSQL ya exportadas):

```powershell
npm run db:deploy:postgres
```

Para generar solo el cliente PostgreSQL:

```powershell
npm run db:generate:postgres
```

El cliente generado es compartido por los dos entornos. Para volver a SQLite local, detén el servidor, elimina de esa sesión las variables PostgreSQL exportadas (DATABASE_URL y DIRECT_URL) para volver a utilizar tu .env local, y ejecuta `npm run db:setup` o `npm run build`, que vuelven a generar el cliente SQLite. No ejecutes simultáneamente dos servidores locales con clientes de proveedores distintos en este checkout.

## Comprobar el primer despliegue

Abre `/proyectos`, cambia español/inglés y prueba `/acceso` con las tres cuentas ficticias (`inversor@cimiento.demo`, `promotor@cimiento.demo`, `admin@cimiento.demo`; contraseña `Demo123!`). El selector rápido de roles de desarrollo no aparece en Vercel. Comprueba la creación y cancelación de un compromiso, y que continúe en la cartera tras recargar.

Esta configuración publica una demostración con cuentas conocidas y administración ficticia. Si necesitas limitar su acceso, activa Deployment Protection en Vercel antes de compartirla. Mantiene los avisos de demostración y proveedores simulados; no habilita pagos ni KYC reales. El limitador actual vive en memoria de cada instancia y no es una protección distribuida de producción.

La preparación local no crea recursos cloud ni publica la web. La conexión a tu PostgreSQL alojada y el despliegue se realizan cuando importas el proyecto en tu cuenta de Vercel.

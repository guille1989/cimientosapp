# Verificación de Cimiento — 17 de octubre de 2026

Resultado: aplicación local funcional con la identidad visual original conservada. Sin publicación ni conexiones a pagos o KYC reales.

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Correcto |
| `npm test` | 11/11 pruebas de dominio |
| `npx playwright test --workers=1 --output output/qa-final` | 14/14 pruebas de API y navegador, 28,2 segundos |
| Migración y seed desde un SQLite vacío | Correctos |
| `npm run build` | Correcto: compilación, TypeScript y generación de las 19 páginas estáticas |
| Ejecución con `next start` | Correcta |
| Acceso a los tres roles en producción | Correcto |
| `node scripts/verify-ui.mjs` sobre producción | 38 comprobaciones, 0 errores de consola y 0 desbordamientos |
| Preservación de `dist/` y `.openai/` | Sin cambios |

Los recorridos prueban el mínimo de inversión, capacidad, cancelación y reflexión; adecuación y aceptación expresa; privacidad y permisos; all-or-nothing; solicitudes del promotor; evaluación humana y publicación administrativa; documentación y CSV; control de desembolsos; concurrencia; filtros y vista de lista; pestañas con teclado y cierre de diálogos con Escape; y navegación móvil.

La revisión visual cubre las páginas públicas y todas las secciones de los tres roles. Escritorio: 1440 píxeles. También se revisan los paneles y sus formularios/tablas en móvil de 390 píxeles y tablet de 768 píxeles. Las tablas extensas utilizan desplazamiento dentro de su contenedor.

Las capturas y el informe están en `output/qa/`, una carpeta local ignorada por Git. Los datos generados durante las pruebas se han conservado en `output/qa/verified-test-data.db`; la base activa se ha recreado desde la migración y el seed, con las tres cuentas y ocho proyectos públicos ficticios, dos de ellos exclusivamente como modalidades futuras.

Los proveedores, fondos, documentos, evaluaciones, certificaciones y movimientos son de demostración. Esta verificación no es una auditoría de seguridad, financiera, jurídica o regulatoria ni autoriza operar con dinero real.


## Internacionalización — 19 de octubre de 2026

Español e inglés disponibles en la navegación pública y en los tres portales. El selector conserva la ruta, la sesión y los valores de formularios. La cookie de preferencia se aplica al HTML inicial, a los metadatos y a los mensajes del servidor. Incluye fechas, euros, documentación ficticia y CSV localizados. Los nombres propios y el texto libre de los usuarios se conservan.

| Comprobación | Resultado |
| --- | --- |
| Migración y seed en dos SQLite de prueba independientes | Correctos |
| `npm run typecheck` | Correcto |
| `npm test` | 14/14: dominio, catálogos, interpolaciones y formatos |
| Playwright completo en desarrollo | 17/17 en 26,8 segundos |
| `npm run build` | Correcto: webpack, TypeScript y generación de rutas |
| `next start` y pruebas específicas de i18n | 3/3 en 3,3 segundos |
| `node scripts/verify-i18n.mjs` en producción | 80 combinaciones; 0 errores de consola o desbordamientos; 0 mensajes pendientes detectados |

La prueba en inglés completa inversión, aceptación individual de riesgos, proveedor simulado, cartera y cancelación. También verifica persistencia tras recargar, HTML y metadatos del servidor, documentos y CSV, errores, acceso a inversor/promotor/administrador y conservación de países y licencias al cambiar de idioma. Las pantallas se revisan en escritorio, móvil y tablet.

Los datos de esta verificación están en `prisma/i18n-test.db` y `prisma/i18n-production-test.db`, ignorados por Git. Las capturas y el informe de pantallas están en `output/qa-i18n/`. La verificación final utiliza estas bases independientes y no reinicializa `prisma/dev.db`.

La caché persistente de Turbopack en desarrollo se ha desactivado tras detectar referencias obsoletas en la caché local. El build de producción utiliza webpack. Las carpetas de artefactos `output/` y `tmp/` se excluyen de TypeScript para evitar compilar copias de fuentes y tipos generados archivados.


## Preparación para Vercel — 19 de octubre de 2026

Configuración de Next.js y Node 24, instalación reproducible con npm ci, build específico, PostgreSQL con migraciones propias y variables documentadas en VERCEL.md. La aplicación local conserva SQLite y sus datos. No se ha conectado una base alojada ni creado un despliegue cloud.

| Comprobación | Resultado |
| --- | --- |
| Esquema PostgreSQL y generación de SQL desde el modelo | Válidos |
| Migración inicial y seed en Prisma Postgres local (prisma dev/PGlite) | Correctos |
| npm run vercel-build con esa base | Correcto: generación, migración, seed y build Next.js |
| Segunda ejecución de db:deploy:postgres | Sin migraciones pendientes; seed correcto |
| npm test | 17/17 |
| npm run typecheck | Correcto |
| API/navegador con next start y PostgreSQL local | 16/17 en la primera suite; 3/3 en la repetición del grupo de gestión |
| Build local con SQLite tras restaurar el cliente | Correcto |

La primera suite de navegador en producción alcanzó el límite de 20 intentos de autenticación por minuto desde la misma instancia: el inicio de sesión del caso administrativo recibió HTTP 429. Tras finalizar ese periodo se repitió el grupo de promotor/administración y pasaron sus tres pruebas, sin reducir la protección. Se han verificado todos los casos, incluidos inversión/cancelación, concurrencia, permisos, ciclo all-or-nothing, idiomas, solicitudes y publicación ficticia.

La base local de prueba de Prisma dev usa pgBouncer=true en la conexión de ejecución para evitar colisiones de sentencias preparadas en su proxy PGlite. Las cadenas del proveedor alojado deberán seguir sus propias instrucciones de pooling para Prisma 6; no se han probado credenciales cloud.

Las capturas y trazas están en output/qa-vercel-postgres y output/qa-vercel-management. Para completar el despliegue faltan la base PostgreSQL alojada y las variables de su entorno en Vercel; no pueden reemplazarse por la URL file: de desarrollo. La plantilla excluye datos locales, credenciales y artefactos del envío por CLI.


## Recorrido del inversor y confirmación idempotente — 19 de octubre de 2026

Cada intención de inversión lleva una referencia UUID obligatoria. La restricción única por usuario y referencia, junto con la transacción de inversión, evita duplicar compromiso, movimiento y auditoría. Los reintentos devuelven el mismo compromiso y su estado actual, incluso después de financiar por completo el proyecto o cancelar el compromiso. Una referencia ya utilizada no admite cambiar proyecto ni importe.

La interfaz conserva la referencia en el almacenamiento de la pestaña, recupera solicitudes tras una respuesta perdida y recarga, muestra el estado y la fecha de reflexión reales del compromiso y ofrece volver a acceder si la sesión ha expirado. Incluye mensajes en español e inglés y una presentación del aviso pendiente adaptada a móvil. La recuperación no se comparte entre dispositivos ni sobrevive a la eliminación del almacenamiento de la pestaña.

| Comprobación | Resultado |
| --- | --- |
| Migración SQLite sobre la base local existente | Correcta; copia previa en output/qa-investor/dev-before-idempotency.db |
| Comparación antes/después: usuarios, proyectos, compromisos, movimientos y suma financiada | Sin cambios |
| Migración PostgreSQL desde el esquema anterior con datos semilla ya cargados | Correcta, mediante Prisma Postgres local (prisma dev/PGlite) |
| npm test | 17/17 |
| Regresión API/navegador, cinco archivos anteriores | 17/17 en 26,0 segundos |
| Pruebas nuevas en SQLite | 4/4; también repetidas junto al grupo de gestión: 7/7 |
| Pruebas nuevas con PostgreSQL local y next start | 4/4 en 18,0 segundos |
| Build local con SQLite | Correcto |
| npm run vercel-build con PostgreSQL local | Correcto |

Las pruebas nuevas verifican tres solicitudes simultáneas con la misma referencia, reintentos cuando el proyecto ya está financiado, repetición después de cancelar, inversión intencional con referencia nueva, rechazo de contenido incompatible, separación entre usuarios y validación de referencias. El navegador usa una cuenta nueva, completa el onboarding y guarda/reanuda su borrador; después pierde deliberadamente la respuesta de una inversión aceptada, recarga, recupera la misma operación y la cancela. El recorrido se ejecuta en español y en inglés, este último en móvil, sin desbordamiento horizontal ni errores JavaScript no controlados.

Una ejecución conjunta rápida alcanzó el límite de solicitudes de la demo en una operación administrativa y devolvió HTTP 429. Se verificó esa causa en la traza y se repitieron los grupos con la ventana restablecida, sin reducir el límite. Los resultados finales anteriores corresponden a grupos separados.

Los escenarios utilizan prisma/investor-flow-test.db y una instancia PostgreSQL local dedicada. Las capturas y trazas están en output/qa-investor-validated/, output/qa-investor-regression/ y output/qa-investor-postgres/. No se han usado credenciales ni modificado la base alojada de Neon.

El despliegue existente de Vercel no incorpora estos cambios hasta publicar una versión nueva. Su build aplicará la migración PostgreSQL automáticamente. Todas las operaciones continúan siendo ficticias.

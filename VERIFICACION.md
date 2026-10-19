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

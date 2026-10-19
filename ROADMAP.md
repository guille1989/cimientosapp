# Roadmap de Cimiento: del prototipo al primer MVP validado

Propuesta basada en el estado del repositorio al 19 de octubre de 2026.

## Objetivo de la siguiente entrega

Lanzar un piloto privado en España con personas invitadas, los tres roles y el recorrido completo de inversión ficticia. Medir comprensión, facilidad de uso e interés de inversores y promotores. Las cuentas, documentos y operaciones deben seguir identificando qué datos son de prueba.

La operación con dinero real es un hito posterior, condicionado por el encaje regulatorio, los proveedores y la capacidad operativa. El piloto privado no permite eludir esos requisitos.

Alcance mantenido: préstamos inmobiliarios por proyecto, euros, mínimo de 100 €, financiación todo o nada y seguimiento por hitos. Equity, rentas, mercado secundario, app móvil, otras monedas y expansión internacional continúan fuera de esta entrega.

## Punto de partida

| Capacidad | Estado conocido |
| --- | --- |
| Páginas públicas, mercado, detalle y simulador | Implementados en la demostración |
| Inversor, promotor y administrador | Implementados con permisos y cuentas ficticias |
| Compromiso, reflexión, cancelación y cartera | Implementados y probados con operaciones ficticias |
| Onboarding, documentos, hitos y movimientos | Simulados |
| Español e inglés | Implementados |
| Despliegue en Vercel | Completado, confirmado por el usuario |
| Neon alojado | Creado y conectado; queda verificar la persistencia y los recorridos en la versión alojada |
| Autenticación, pagos y KYC de producción | Pendientes; los adaptadores actuales son de demostración |
| Observabilidad, recuperación operativa y validación con usuarios | Pendientes de completar |

Las pruebas existentes son una base de verificación técnica, no evidencia de demanda ni una auditoría de seguridad o de cumplimiento.

## Plan de ejecución

Las duraciones son estimaciones de trabajo técnico para una persona de desarrollo con apoyo de producto. No son plazos de autorización, contratación de proveedores ni una promesa de fecha de lanzamiento.

| Orden | Bloque | Estimación | Responsable principal | Condición para cerrarlo |
| --- | --- | --- | --- | --- |
| 1 | Validar y proteger la demo alojada | 1–2 días | Desarrollo | Datos persistentes, tres roles comprobados y acceso controlado |
| 2 | Concretar el producto y validar necesidades | 3–5 días, en paralelo | Negocio/producto | Entrevistas, propuesta de valor, modelo económico y métricas acordados |
| 3 | Preparar cuentas para personas invitadas | 4–7 días | Desarrollo | Identidad mediante proveedor, recuperación de acceso y administración sin credenciales públicas |
| 4 | Completar la operativa y fiabilidad del piloto | 5–8 días | Desarrollo/operaciones | Seguimiento, notificaciones, conciliación ficticia, restauración y casos de fallo verificados |
| 5 | Ejecutar el piloto y corregir los bloqueos | 1 semana | Producto/desarrollo | Recorridos observados, resultados medidos y fallos críticos resueltos |
| En paralelo desde el inicio | Definir la vía para operar con dinero real | Dependencia externa, sin estimación cerrada | Negocio y asesoría especializada | Responsabilidades, autorizaciones y proveedores identificados y validados |

Horizonte orientativo del primer piloto validado: unas 4–6 semanas con ese equipo y alcance, sujeto a disponibilidad de participantes y proveedores de identidad. Ajustar la planificación tras los dos primeros días.

### 1. Validar la versión alojada y disponer de un entorno estable

- [x] Despliegue en Vercel completado, confirmado por el usuario.
- Verificar acceso a los tres roles, inversión ficticia, cancelación, descarga de documentos y cambio de idioma en la versión alojada.
- Confirmar persistencia después de recargar y después de un nuevo despliegue.
- Separar bases y variables de Production y Preview. Las pruebas automáticas deben usar una base dedicada.
- Aplicar control de acceso a la demostración mientras existan las cuentas conocidas y su administrador ficticio.
- Configurar dominio, avisos de demostración visibles y canal de contacto para el piloto.
- Probar copia de seguridad/restauración y documentar cómo revertir código y tratar una migración de base de datos; revertir código por sí solo no revierte una migración.

Aceptación: una persona invitada completa el flujo alojado y sus datos siguen disponibles tras recargar, sin acceso a cuentas ajenas.

### 2. Validar el producto antes de ampliar funciones

- Entrevistar inicialmente a 5 potenciales inversores y 2–3 promotores.
- Validar qué información necesitan para decidir, qué dudas genera el riesgo y qué obstáculos encuentran al solicitar financiación.
- Concretar el perfil de promotor, los criterios de admisión y quién revisa cada expediente.
- Documentar quién pagaría, por qué concepto, cuándo y con qué costes operativos; no activar cobros en esta fase.
- Priorizar las mejoras por frecuencia y gravedad de los problemas observados.
- Definir métricas del piloto y un guion común de prueba.

Aceptación: una lista priorizada de necesidades y supuestos por validar, con evidencia de entrevistas. No contar saldos ni compromisos ficticios como captación real.

### 3. Preparar identidad y acceso para el piloto

- Elegir e integrar un proveedor de autenticación; mantenerlo separado del proveedor de KYC.
- Añadir invitación/alta, verificación de correo, recuperación de acceso, cierre de sesiones y desactivación de cuentas.
- Mantener el rol y las autorizaciones bajo control del servidor; el registro público no crea administradores.
- Exigir MFA a la administración y retirar las cuentas y contraseñas de ejemplo del entorno con usuarios reales.
- Separar los datos semilla de pruebas de los datos del piloto y desactivar la recarga del seed de demostración en ese entorno.
- Mantener explícitamente simuladas las identidades financieras, verificaciones y operaciones que aún no sean reales.
- Revisar privacidad, finalidad de los datos y textos de consentimiento antes de recoger información personal; limitar los datos al mínimo necesario.

Aceptación: un participante invitado puede acceder y recuperar su cuenta; los cambios de rol y el acceso a información ajena se rechazan en el servidor.

### 4. Completar la operativa y fiabilidad

- Revisar las tareas diarias del administrador: expediente, información pendiente, decisión justificada, publicación y suspensión.
- Añadir persistencia de versiones de documentos y aceptaciones. Si se incorporan archivos, usar almacenamiento privado y enlaces de acceso temporal, con validación y permisos.
- Incorporar avisos de eventos importantes y seguimiento de entrega. Mantener las comunicaciones de inversión como ficticias mientras lo sea la operación.
- Convertir los vencimientos de reflexión y financiación en tareas programadas e idempotentes; actualmente el ciclo también depende de consultar la plataforma.
- Implementar un registro de trabajos pendientes, reintentos y deduplicación para tareas y futuras integraciones.
- Verificar concurrencia, cancelación repetida, financiación incompleta, retrasos e intentos de acceso indebido con PostgreSQL.
- Incorporar monitorización, registros sin secretos, alertas de errores y límites de abuso compartidos entre instancias.
- Ejecutar pruebas de extremo a extremo en CI con PostgreSQL independiente y comprobaciones de móvil, teclado e idiomas.
- Revisar las dependencias y corregir vulnerabilidades aplicables sin actualizaciones forzadas sin verificar.
- Definir soporte, gestión de incidencias y responsables de cada decisión.

Aceptación: cada evento tiene un resultado rastreable, los reintentos no duplican efectos y se ha demostrado cómo restaurar el servicio.

### 5. Piloto privado y decisión de continuidad

Propuesta de cohorte: 10–20 potenciales inversores, 2–3 promotores y al menos una persona responsable de análisis/administración. Siguen sin procesarse pagos reales.

Recorridos obligatorios:

1. Inversor: alta/invitación, onboarding simulado, análisis del proyecto, compromiso ficticio, cartera y cancelación.
2. Promotor: solicitud, documentación ficticia, respuesta a preguntas, actualización y petición de validación de un hito.
3. Administrador: revisión, decisión justificada, publicación, validación de un hito e incidencia ficticia.

Objetivos iniciales propuestos, pendientes de acordar con negocio:

- Al menos el 80 % de participantes completa su recorrido principal sin ayuda.
- Ningún defecto crítico permite ver datos ajenos, superar el objetivo o duplicar una operación.
- Los participantes comprenden que los rendimientos no están garantizados y que la prueba no mueve dinero.
- Se identifican al menos tres promotores interesados en continuar la evaluación, sin confundir interés con admisión o financiación.
- Se registran abandonos y motivos, solicitudes de soporte y mejoras priorizadas.

Cerrar con una decisión documentada: continuar, ajustar el producto o volver a validar supuestos antes de invertir en nuevas funciones.

## Vía paralela para un MVP con dinero real

Iniciar esta evaluación desde el primer bloque, antes de comprometer un calendario comercial.

1. Definir con asesoría especializada qué entidad presta cada servicio y el encaje de Cimiento en el marco aplicable. Evaluar autorización propia o una colaboración con un proveedor autorizado únicamente si la estructura es jurídicamente válida; un acuerdo comercial no sustituye por sí solo las obligaciones aplicables.
2. Seleccionar proveedores autorizados para los servicios de pago y las verificaciones que correspondan, identificando el flujo de fondos y sus responsabilidades.
3. Revisar contratos, documentación informativa, advertencias, protección del inversor, clasificación/evaluación y periodos aplicables. El test y las 96 horas del prototipo no acreditan cumplimiento.
4. Definir análisis de promotores y proyectos, comprobación de licencias/garantías y certificación independiente de hitos.
5. Integrar primero sandboxes: eventos autenticados, webhooks persistentes, reintentos, deduplicación, conciliación, reembolsos, desembolsos y devoluciones.
6. Completar privacidad, seguridad, continuidad, contabilidad, gestión de reclamaciones y procesos de incidencias, impago y recuperación.
7. Realizar una revisión independiente de seguridad y validar todos los requisitos antes de habilitar dinero real.

Las interfaces de pago actuales están tipadas expresamente como simuladas y no representan un sistema de pagos listo para producción. Su sustitución requiere revisar el modelo de eventos, estados y conciliación, además de conectar una API.

Referencias oficiales para orientar esa evaluación:

- [CNMV: marco de proveedores de servicios de financiación participativa](https://www.cnmv.es/portal/gpage?id=Reg_Direc_Financion_Participativa&lang=es).
- [ESMA: autorización de servicios de pago y uso de proveedores terceros autorizados](https://www.esma.europa.eu/publications-data/questions-answers/802).

No fijar una fecha de operaciones reales hasta confirmar estas dependencias. El resultado del piloto privado valida producto y operativa de prueba, no concede habilitación regulatoria.

## Próximas cinco tareas

1. Verificar los recorridos de inversor, promotor y administrador en la versión alojada.
2. Comprobar persistencia y restringir el acceso a las cuentas de demostración.
3. Documentar los objetivos y preparar las entrevistas iniciales.
4. Abrir la evaluación regulatoria y de proveedores con responsables definidos.
5. Elegir el proveedor de identidad y concretar el backlog del piloto a partir del feedback.


## Avance del recorrido del inversor

- [x] Referencia de solicitud obligatoria, validada y vinculada al usuario, proyecto e importe.
- [x] Restricción de base de datos y recuperación del mismo compromiso ante reintentos.
- [x] Recuperación en la misma pestaña tras perder la respuesta y recargar, incluso con el proyecto ya financiado.
- [x] Prueba integrada con un inversor nuevo: registro, onboarding, documentación, confirmación ficticia, recuperación, cartera y cancelación.
- [x] Verificación en español e inglés, móvil, SQLite y PostgreSQL local; migraciones sin borrar registros previos.
- [ ] Publicar estos cambios mediante un nuevo despliegue y repetir la comprobación sobre su URL alojada.
- [ ] Preparar identidad de producción, invitaciones y demás condiciones del piloto según los bloques del plan.

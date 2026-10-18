# Proyecto Nosotros

Aplicación web para que dos personas respondan por separado un cuestionario de compatibilidad, acuerdos y proyecto de vida. El informe compartido se desbloquea cuando ambos terminan.

## Estado recuperado

El repositorio remoto original estaba vacío. Esta versión reconstruye la aplicación a partir del paquete y la especificación conservados en el historial: cuestionario, modo privado para dos celulares, autenticación anónima con Firebase, Firestore y reglas que ocultan las respuestas hasta que ambos finalicen.

Además incorpora:

- modo de prueba completo en un solo dispositivo, sin configurar servicios;
- guardado automático y recuperación de progreso;
- preguntas privadas de bienestar que nunca se sincronizan;
- informe por categorías, afinidades, diferencias y acuerdos;
- interfaz responsive, navegación por teclado y vista imprimible;
- lógica de cálculo separada y comprobable.

## Probar localmente

Sirve esta carpeta con cualquier servidor estático. Por ejemplo:

```bash
python3 -m http.server 4173
```

Abre `http://localhost:4173` y elige **Probar en este dispositivo**. Las dos personas responderán por turnos en el mismo navegador.

## Activar invitaciones entre celulares

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Registra una aplicación web y copia su configuración pública a `firebase-config.js`.
3. En Authentication, habilita el proveedor **Anonymous**.
4. Crea Cloud Firestore en modo producción.
5. Publica el contenido de `firestore.rules` en Firestore Rules.
6. En Authentication > Settings > Authorized domains, agrega el dominio de GitHub Pages si Firebase lo solicita.
7. Publica estos archivos en la raíz de GitHub Pages.

La configuración web de Firebase no es una contraseña. La protección depende de las reglas de Firestore; publícalas antes de compartir una invitación. Nunca subas cuentas de servicio ni credenciales administrativas.

## Privacidad y límites

- El enlace de invitación contiene un identificador aleatorio de 192 bits. Compártelo en privado: la primera persona que lo abra puede ocupar el segundo lugar.
- La identidad es anónima y queda vinculada al navegador. Borrar sus datos puede hacer perder el acceso.
- Las respuestas de bienestar personal (`privateRatings`) solo se guardan localmente; `cloud.js` no las envía a Firestore.
- Las demás respuestas pueden ser leídas por ambos miembros únicamente cuando `done0` y `done1` son verdaderos.
- El informe es una herramienta de conversación, no un diagnóstico psicológico ni una garantía de compatibilidad.

## Archivos

- `index.html`: estructura principal.
- `styles.css`: diseño responsive e impresión.
- `logic.js`: preguntas y cálculo del informe.
- `app.js`: flujo, persistencia local y presentación.
- `cloud.js`: autenticación anónima y sincronización.
- `firebase-config.js`: configuración pública pendiente.
- `firestore.rules`: control de acceso de la base de datos.

# Feature Specification: Pantalla de Registro de KynWallet

**Feature Branch**: `feature/registro-eduardo-vidal`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "Necesito construir la pantalla de Registro para la billetera virtual,
con el objetivo de permitir que nuevos usuarios se registren a la aplicación de manera sencilla.
El diseño de referencia se encuentra en Figma:
https://www.figma.com/design/6xNmoI41kvegTfeFfgGgcs/Billetera-Virtual---Prototipos--copia-?node-id=31-2.
Formulario con nombre completo, correo electrónico, contraseña y confirmar contraseña; casilla de
aceptación de términos y condiciones; botón "Crear cuenta" que valide todos los campos antes de
enviar; botones de Google y Apple que muestren alert "Próximamente"; enlace "¿Ya tienes cuenta?
Inicia sesión" hacia /login; registro exitoso que redirige a /login con mensaje de éxito;
validaciones inline (correo válido, contraseña mínimo 8 caracteres, contraseñas coinciden, todos
los campos obligatorios); responsive: desktop (2 paneles) y mobile (solo formulario). El alcance
se limita a una demostración funcional del registro, sin servicios backend ni base de datos.
Genera historias de usuario y criterios de aceptación, respetando la Constitution del proyecto."

**Diseño de referencia**: Figma, frame `04 · Registro` (nodo `31:2`, 1440 × 1024, escritorio).
Se compone de:

- **Panel de marca** (izquierda, mismo estilo que `01 · Login`): logo KynWallet, titular
  "Comienza tu camino financiero.", texto de apoyo "Crea tu cuenta en minutos y empieza a enviar,
  recibir y administrar tu dinero desde cualquier lugar." y la tarjeta ilustrativa "Kyn Card".
- **Panel de formulario** (derecha), en este orden: título "Crea tu cuenta"; subtítulo "Completa
  tus datos para comenzar"; campo "Nombre completo" (ejemplo "Ej: Diego Martínez"); campo "Correo
  electrónico" (ejemplo "tucorreo@ejemplo.com"); campo "Contraseña" con control de visibilidad;
  campo "Confirmar contraseña" con control de visibilidad; casilla "Acepto los términos y
  condiciones" (con "términos y condiciones" como enlace); botón principal "Crear cuenta";
  separador "o regístrate con"; botones "Google" y "Apple"; pie "¿Ya tienes cuenta? Inicia
  sesión" (con "Inicia sesión" como enlace).

El archivo no contiene una versión móvil del registro; la composición móvil se deriva de este
frame (ver Assumptions).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear una cuenta con datos válidos (Priority: P1)

Como persona nueva en la billetera virtual, quiero completar el formulario de registro con mis
datos y aceptar los términos, para crear mi cuenta y ser dirigida al inicio de sesión.

**Why this priority**: es el propósito central de la pantalla; sin este flujo no existe valor
demostrable.

**Independent Test**: se completan los cuatro campos con datos válidos, se marca la casilla de
términos, se presiona "Crear cuenta" y se verifica que se llega a `/login` con el mensaje de éxito.

**Acceptance Scenarios**:

1. **Given** la pantalla de registro cargada, **When** el usuario ingresa nombre completo, correo
   válido, contraseña de al menos 8 caracteres, la misma contraseña en "Confirmar contraseña",
   marca "Acepto los términos y condiciones" y presiona "Crear cuenta", **Then** el sistema lo
   lleva a `/login` y muestra el mensaje de éxito "Cuenta creada con éxito. Ya puedes iniciar
   sesión."
2. **Given** el usuario envió el formulario con datos válidos, **When** el registro simulado está
   en curso, **Then** el botón "Crear cuenta" muestra un estado de carga, queda deshabilitado y no
   admite envíos adicionales.
3. **Given** el usuario está en cualquier campo de texto, **When** presiona la tecla Enter,
   **Then** el formulario se envía igual que al presionar "Crear cuenta".
4. **Given** el usuario escribe espacios al inicio o final del nombre o del correo, **When** envía
   datos válidos, **Then** el registro se completa y esos espacios periféricos se ignoran.
5. **Given** la pantalla `/login` mostrada tras un registro exitoso, **When** el usuario la
   recarga o navega a otra pantalla y vuelve, **Then** el mensaje de éxito ya no aparece y no se
   conserva ningún dato del registro.

---

### User Story 2 - Recibir retroalimentación inmediata sobre los datos (Priority: P1)

Como usuario, quiero que cada campo me indique al momento si tiene un error, para corregirlo antes
de crear la cuenta.

**Why this priority**: el requerimiento exige validaciones inline y que el botón valide todos los
campos antes de enviar; sin ellas el formulario permitiría registros inválidos.

**Independent Test**: se envía el formulario vacío y luego con un correo mal formado, una
contraseña corta y una confirmación distinta, y se verifica el mensaje junto a cada campo.

**Acceptance Scenarios**:

1. **Given** el formulario vacío, **When** el usuario presiona "Crear cuenta", **Then** se muestran
   mensajes de campo obligatorio junto a "Nombre completo", "Correo electrónico", "Contraseña" y
   "Confirmar contraseña", y un mensaje junto a la casilla de términos; no se completa el registro
   y el foco se mueve al primer campo con error.
2. **Given** un correo sin formato válido (por ejemplo, "usuario@" o "usuario.com"), **When** el
   usuario sale del campo o envía el formulario, **Then** se muestra "Ingresa un correo
   electrónico válido".
3. **Given** una contraseña con menos de 8 caracteres, **When** el usuario sale del campo o envía
   el formulario, **Then** se muestra "La contraseña debe tener al menos 8 caracteres".
4. **Given** una contraseña válida y una confirmación distinta, **When** el usuario sale del campo
   de confirmación o envía el formulario, **Then** se muestra "Las contraseñas no coinciden".
5. **Given** la confirmación coincidía y el usuario modifica después la contraseña, **When** ambas
   dejan de ser iguales, **Then** se muestra "Las contraseñas no coinciden" en la confirmación.
6. **Given** un campo con mensaje de validación, **When** el usuario corrige el valor, **Then** el
   mensaje de ese campo desaparece.
7. **Given** un campo con error, **When** es leído por un lector de pantalla, **Then** se anuncia
   el mensaje de error asociado a ese campo.
8. **Given** el formulario con errores, **When** el usuario presiona "Crear cuenta", **Then** el
   registro no se completa y se conservan los valores ya escritos (las contraseñas también).

---

### User Story 3 - Aceptar los términos y condiciones (Priority: P1)

Como usuario, quiero indicar que acepto los términos y condiciones, y que el sistema no me deje
registrarme sin hacerlo.

**Why this priority**: es un requisito explícito del formulario y condiciona la creación de la
cuenta.

**Independent Test**: se completan los demás campos con datos válidos sin marcar la casilla, se
presiona "Crear cuenta" y se verifica que el registro no avanza hasta marcarla.

**Acceptance Scenarios**:

1. **Given** todos los campos válidos y la casilla de términos sin marcar, **When** el usuario
   presiona "Crear cuenta", **Then** se muestra "Debes aceptar los términos y condiciones", no se
   completa el registro y el foco se mueve a la casilla.
2. **Given** el mensaje de términos visible, **When** el usuario marca la casilla, **Then** el
   mensaje desaparece.
3. **Given** el enlace "términos y condiciones" dentro de la etiqueta de la casilla, **When** el
   usuario lo activa, **Then** se muestra el aviso "Función no disponible en esta demostración",
   la casilla no cambia de estado y se conservan los datos ingresados.
4. **Given** la casilla, **When** el usuario la opera solo con teclado, **Then** puede alcanzarla,
   marcarla y su estado es anunciado por tecnologías de asistencia.

---

### User Story 4 - Ir a iniciar sesión si ya tengo cuenta (Priority: P2)

Como usuario que ya tiene cuenta, quiero un enlace claro hacia el inicio de sesión, para no quedar
atrapado en el registro.

**Why this priority**: conecta el registro con el resto del flujo de acceso, pero el registro es
demostrable sin ella.

**Independent Test**: se activa "Inicia sesión" en el pie del formulario y se verifica que se
llega a `/login`.

**Acceptance Scenarios**:

1. **Given** la pantalla de registro, **When** el usuario activa "Inicia sesión" en "¿Ya tienes
   cuenta? Inicia sesión", **Then** se navega a `/login` sin mensaje de éxito.
2. **Given** la pantalla de inicio de sesión, **When** el usuario activa "Regístrate", **Then**
   se navega a `/register` con el formulario vacío.
3. **Given** el enlace, **When** el usuario lo opera solo con teclado, **Then** puede alcanzarlo
   y activarlo con foco visible.

---

### User Story 5 - Usar el registro en escritorio y en móvil (Priority: P2)

Como usuario, quiero que la pantalla se adapte a mi dispositivo, para registrarme cómodamente
desde un computador o un teléfono.

**Why this priority**: es un requisito explícito, pero el flujo de registro (P1) es demostrable
en un solo tamaño de pantalla.

**Independent Test**: se muestra la pantalla en un ancho de escritorio y en uno móvil y se
verifica la composición de cada uno.

**Acceptance Scenarios**:

1. **Given** un ancho de escritorio, **When** se muestra la pantalla, **Then** aparecen dos
   paneles: el panel de marca a la izquierda y el panel con el formulario a la derecha, como en
   el diseño de referencia.
2. **Given** un ancho de móvil, **When** se muestra la pantalla, **Then** aparece solo el
   formulario (sin panel de marca), con el logo de KynWallet visible.
3. **Given** cualquier ancho desde 320 px, **When** el usuario completa el formulario, **Then**
   todos los controles son alcanzables y utilizables sin desplazamiento horizontal.
4. **Given** el cambio de tamaño de la ventana, **When** cruza el punto de cambio entre escritorio
   y móvil, **Then** los datos ya escritos en el formulario se conservan.

---

### User Story 6 - Mostrar u ocultar las contraseñas (Priority: P3)

Como usuario, quiero poder ver temporalmente lo que escribí en los campos de contraseña, para
confirmar que los ingresé correctamente.

**Why this priority**: mejora de conveniencia presente en el diseño (ambos campos de contraseña
tienen control de visibilidad), no imprescindible para registrarse.

**Independent Test**: se escribe una contraseña, se activa el control de visibilidad y se verifica
que el texto se muestra; se vuelve a activar y se oculta.

**Acceptance Scenarios**:

1. **Given** una contraseña oculta, **When** el usuario activa el control de visibilidad del campo,
   **Then** el texto se muestra legible y el control indica "Ocultar contraseña".
2. **Given** la contraseña visible, **When** el usuario vuelve a activar el control, **Then** se
   oculta y el control indica "Mostrar contraseña".
3. **Given** los dos campos de contraseña, **When** el usuario cambia la visibilidad de uno,
   **Then** el otro no cambia (cada campo tiene su propio control).
4. **Given** el control de visibilidad, **When** el usuario lo opera solo con teclado, **Then**
   puede alcanzarlo y activarlo, y su estado es anunciado por tecnologías de asistencia.

---

### User Story 7 - Registro con Google y Apple no disponible (Priority: P3)

Como usuario, quiero que los botones "Google" y "Apple" bajo "o regístrate con" me informen que
aún no funcionan, para no pensar que la pantalla falló.

**Why this priority**: garantiza fidelidad al diseño sin ampliar el alcance funcional (YAGNI).

**Independent Test**: se activa cada botón y se verifica que se muestra "Próximamente".

**Acceptance Scenarios**:

1. **Given** la pantalla de registro, **When** el usuario activa el botón "Google", **Then** se
   muestra una alerta con el texto "Próximamente" y los datos ingresados se conservan.
2. **Given** la pantalla de registro, **When** el usuario activa el botón "Apple", **Then** se
   muestra una alerta con el texto "Próximamente" y los datos ingresados se conservan.
3. **Given** la alerta mostrada, **When** el usuario la cierra o continúa, **Then** la pantalla
   permanece en `/register` sin cambios.

---

### Edge Cases

- El usuario presiona "Crear cuenta" varias veces seguidas: solo se procesa un envío.
- Nombre con solo espacios: se trata como vacío (campo obligatorio).
- Nombre con menos de 2 o más de 100 caracteres: se rechaza con mensaje de validación.
- Correo con más de 254 caracteres o contraseña con más de 128: se rechaza con mensaje de
  validación y no se completa el registro.
- La contraseña contiene espacios: se respetan tal cual, sin recortarlos.
- El usuario pega texto en los campos: se acepta y se valida igual que el texto escrito.
- El usuario navega directamente a `/login` o `/register` escribiendo la dirección: cada pantalla
  se muestra correctamente.
- El usuario abre `/login` sin haberse registrado: no aparece el mensaje de éxito.
- El usuario recarga `/register` a medias: el formulario vuelve vacío (no se conserva nada).
- Fallo inesperado durante el registro: se muestra un mensaje comprensible sin detalles técnicos y
  los datos escritos se conservan.
- Una dirección distinta de `/login` y `/register` (incluida `/`): se muestra el inicio de sesión
  y la dirección pasa a `/login`, sin agregar una entrada al historial del navegador.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La pantalla DEBE reproducir la estructura, textos y jerarquía visual del frame
  `04 · Registro` de Figma (nodo `31:2`) descritos en "Diseño de referencia", aplicando el sistema
  de diseño corporativo cuando exista y siendo coherente con la pantalla de inicio de sesión.
- **FR-002**: La pantalla DEBE estar disponible en la ruta `/register` y la de inicio de sesión
  en `/login`, ambas accesibles escribiendo la dirección directamente.
- **FR-003**: El formulario DEBE incluir los campos "Nombre completo", "Correo electrónico",
  "Contraseña" y "Confirmar contraseña", todos obligatorios, con los textos de ejemplo del diseño.
- **FR-004**: El sistema DEBE validar que el nombre completo, una vez recortados los espacios
  periféricos, tenga entre 2 y 100 caracteres.
- **FR-005**: El sistema DEBE validar que el correo sea obligatorio, tenga formato de correo
  válido y no exceda 254 caracteres.
- **FR-006**: El sistema DEBE validar que la contraseña sea obligatoria y tenga entre 8 y 128
  caracteres.
- **FR-007**: El sistema DEBE validar que "Confirmar contraseña" sea obligatoria y coincida
  exactamente con la contraseña, reevaluándolo cuando cambie cualquiera de las dos.
- **FR-008**: El formulario DEBE incluir la casilla "Acepto los términos y condiciones", que DEBE
  estar marcada para completar el registro.
- **FR-009**: El sistema DEBE mostrar los mensajes de validación junto al campo correspondiente,
  al salir del campo y al intentar enviar, y DEBE ocultarlos cuando el valor se corrija.
- **FR-010**: Al presionar "Crear cuenta", el sistema DEBE validar todos los campos y la casilla
  antes de procesar; si hay errores NO DEBE completar el registro, DEBE mostrar todos los errores
  a la vez y DEBE mover el foco al primer elemento con error.
- **FR-011**: El registro DEBE ser una simulación del lado del cliente, sin servicios backend ni
  base de datos, con una espera breve (aprox. 1 segundo) e indicador de carga durante la cual el
  envío queda deshabilitado.
- **FR-012**: Ante un registro exitoso, el sistema DEBE redirigir a `/login` y mostrar allí un
  mensaje de éxito visible y anunciado automáticamente por tecnologías de asistencia; el mensaje
  DEBE mostrarse una sola vez.
- **FR-013**: El sistema NO DEBE registrar ni mostrar contraseñas en mensajes, registros de
  diagnóstico, URL ni almacenamiento del navegador, ni transmitir datos personales (nombre,
  correo) en la URL de redirección (Constitución, reglas 5.3 y 5.4).
- **FR-014**: Los campos "Contraseña" y "Confirmar contraseña" DEBEN ocultar los caracteres por
  defecto y ofrecer, cada uno, un control accesible para mostrarlos u ocultarlos.
- **FR-015**: Los botones "Google" y "Apple" DEBEN mostrarse bajo el separador "o regístrate con"
  según el diseño y, al activarse, mostrar la alerta nativa del navegador con el texto
  "Próximamente" sin alterar el formulario.
- **FR-016**: El enlace "Inicia sesión" del pie "¿Ya tienes cuenta? Inicia sesión" DEBE llevar a
  `/login`; el enlace "Regístrate" de la pantalla de inicio de sesión DEBE llevar a `/register`.
- **FR-017**: El enlace "términos y condiciones" de la casilla DEBE, al activarse, informar
  "Función no disponible en esta demostración" sin cambiar el estado de la casilla.
- **FR-018**: El formulario DEBE poder enviarse con la tecla Enter y operarse completamente con
  teclado, con orden de foco lógico (el del diseño) y foco visible.
- **FR-019**: La pantalla DEBE cumplir WCAG 2.1 nivel AA: etiquetas asociadas a cada campo,
  errores anunciados por tecnologías de asistencia, mensajes de resultado anunciados de forma
  automática y contraste suficiente (Constitución, regla 8.4).
- **FR-020**: En anchos de escritorio la pantalla DEBE mostrar dos paneles (marca y formulario);
  en anchos móviles DEBE mostrar solo el formulario con el logo visible; DEBE ser utilizable
  desde 320 px sin desplazamiento horizontal y conservar los datos al cambiar de tamaño.
- **FR-021**: Los errores inesperados DEBEN mostrarse con un mensaje comprensible para el usuario,
  sin revelar detalles técnicos.
- **FR-022**: Los elementos, reglas de validación y mensajes compartidos con el inicio de sesión
  (panel de marca, formato de correo, longitud de contraseña, control de visibilidad, botones
  sociales, avisos) DEBEN tener una única fuente (Constitución, reglas 4.1 y 8.5).
- **FR-023**: El sistema DEBE registrar de forma estructurada y trazable cada intento de registro
  y su resultado (exitoso, rechazado por validación o fallido, con la causa técnica del fallo), sin
  incluir nombre, correo ni contraseña (Constitución, reglas 5.5 y 8.7).

### Key Entities

- **Solicitud de registro**: datos ingresados en el formulario (nombre completo, correo,
  contraseña, confirmación de contraseña y aceptación de términos) y su resultado: error de
  validación, fallo inesperado o registro exitoso. No se persiste en ningún momento.
- **Aviso de registro exitoso**: mensaje de un solo uso que acompaña la llegada a `/login` tras
  registrarse; no contiene datos personales ni contraseñas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario con datos válidos completa el registro en menos de 60 segundos desde que
  la pantalla se muestra.
- **SC-002**: Tras presionar "Crear cuenta" con datos válidos, el usuario llega a `/login` con el
  mensaje de éxito en un máximo de 3 segundos.
- **SC-003**: El 100 % de los escenarios de aceptación de las historias P1 y P2 se verifican
  mediante pruebas automatizadas que pasan; los de composición visual de la User Story 5
  (escenarios 1 a 3) se verifican con pruebas en un navegador real a 1440, 375 y 320 px.
- **SC-004**: El 90 % de los participantes de una prueba de usabilidad completa el registro en el
  primer intento sin asistencia.
- **SC-005**: Cada regla de validación (obligatorio, correo válido, contraseña mínima,
  coincidencia, términos) muestra su mensaje junto al campo correcto en el 100 % de los casos de
  prueba.
- **SC-006**: La pantalla no presenta incumplimientos WCAG 2.1 AA en una auditoría automatizada de
  accesibilidad y es operable solo con teclado.
- **SC-007**: La revisión visual frente al frame `04 · Registro` no detecta diferencias en textos,
  orden de elementos ni jerarquía visual en escritorio.
- **SC-008**: El análisis de secretos no detecta credenciales en el código fuente versionado.

## Assumptions

- Desviaciones del frame `04 · Registro` aprobadas por Eduardo Gabriel Vidal como responsable de
  diseño (2026-10-19): el panel de marca usa el logo, el degradado y la tarjeta "Kyn Card" del
  login; el control de visibilidad usa el ícono del login; los colores que no alcanzan WCAG 2.1
  AA se corrigen en el formulario. Google y Apple usan la alerta nativa del navegador. Detalle en
  `research.md` (R3, R8, R13).
- El texto blanco del panel de marca (login y registro) no alcanza WCAG 2.1 AA sobre el
  degradado; queda bajo una excepción temporal a la Constitución (regla 9.1), aprobada el
  2026-10-20 y con vencimiento el 2027-01-17 (`research.md`, R13). FR-019 y SC-006 aplican a todo
  lo demás.
- La demostración es exclusivamente del lado del cliente: no hay backend, base de datos ni
  persistencia. La cuenta "creada" no se guarda, por lo que **no** puede usarse después para
  iniciar sesión; el inicio de sesión sigue funcionando solo con las cuentas de demostración de
  `001-login-billetera`.
- No se verifica si el correo ya está registrado ni se envía correo de confirmación; ambos quedan
  fuera del alcance.
- Esta funcionalidad modifica `001-login-billetera`: el enlace "Regístrate" deja de mostrar
  "Función no disponible en esta demostración" y pasa a navegar a `/register`, y la pantalla de
  inicio de sesión debe poder mostrar el aviso de registro exitoso.
- La alerta de los botones de Google y Apple es el cuadro de alerta nativo del navegador con el
  texto "Próximamente", tal como se pidió.
- El diseño no muestra estados de error, carga ni éxito; sus textos ("Las contraseñas no
  coinciden", "Debes aceptar los términos y condiciones", "Cuenta creada con éxito. Ya puedes
  iniciar sesión.", etc.) y su estilo se alinean con los de la pantalla de inicio de sesión.
- Las reglas de longitud del nombre (2 a 100 caracteres) son un supuesto razonable; la política de
  contraseña (8 a 128) aplica solo a formato, sin reglas de complejidad adicionales.
- Los términos y condiciones no tienen contenido en esta demostración; su enlace solo informa que
  no está disponible.
- El archivo de Figma solo contiene el registro en escritorio (1440 × 1024). La versión móvil se
  deriva de él (solo el panel de formulario, con el logo arriba), con el mismo punto de cambio
  que la pantalla de inicio de sesión.
- El idioma de la interfaz es español.
- No existen BRD ni ARD para esta funcionalidad; si se incorporan, esta especificación DEBE
  alinearse con ellos (Constitución, Principio VI).

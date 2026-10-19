# Research: Pantalla de Registro de KynWallet

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-10-19

Este registro parte del proyecto existente de `001-login-billetera` (React 19 + TypeScript + Vite
8, Clean Architecture ligera, Vitest). Las decisiones de esa funcionalidad siguen vigentes salvo
que aquí se indique lo contrario; en particular, el contraste (R3), el diseño responsivo (R10) y
los recursos gráficos (R11) de [001/research.md](../001-login-billetera/research.md).

**Registro de decisiones**: en este proyecto, `research.md` cumple la función de ADR (Constitución
8.3). Cada sección R# registra contexto, decisión, justificación y alternativas descartadas; no se
crean archivos ADR separados.

## R1. Pila tecnológica

- **Decision**: reutilizar la pila existente sin agregar dependencias: React 19, TypeScript 5
  (`strict`), Vite 8, CSS Modules con los tokens de `src/ui/styles/tokens.css`, Vitest 5 + React
  Testing Library + `user-event` + `axe-core`.
- **Rationale**: es lo que pidió el usuario y lo que ya está aprobado y auditado (Constitución
  7.1–7.4). Agregar dependencias exigiría justificarlas frente a lo existente (7.4, 4.2).
- **Alternatives considered**: librería de formularios (React Hook Form, Formik) — rechazada:
  cuatro campos y una casilla no justifican la dependencia, y el patrón reducer + validación de
  dominio ya existe en el login.

## R2. Lectura del diseño de Figma

- **Fuente**: archivo `6xNmoI41kvegTfeFfgGgcs` ("Billetera Virtual - Prototipos (copia)"), frame
  `04 · Registro`, nodo `31:2`, leído con `get_design_context`, `get_metadata` y
  `get_screenshot`. `get_variable_defs` no devuelve variables: los colores están como valores
  literales en el diseño.
- **Valores del panel de formulario** (idénticos al login, ya presentes en `tokens.css`): título
  30px Bold `#16182c`; subtítulo 16px Regular `#8a8ba8`; etiquetas 14px Medium `#3d3f5c`; campos
  400×52px, borde 1.5px `#d7d9e6`, radio 12px, placeholder 15px `#a9abc2`; casilla 20px radio 6px;
  enlaces 14px SemiBold `#ef5226`; botón principal `#ff6b3d` 400×52px, texto 16px SemiBold
  blanco; separador 13px `#8a8ba8` con líneas `#d7d9e6`; botones sociales 192×48px borde
  `#d7d9e6`, texto 15px SemiBold `#16182c`; pie 14px.
- **Valores del panel de marca**: 620px de ancho; titular 44px Bold, line-height 1.08, en dos
  líneas ("Comienza tu" / "camino financiero."); texto de apoyo 17px, line-height 1.5,
  `rgba(255,255,255,.85)`; tarjeta "Kyn Card" con los mismos colores, tamaño y textos que la del
  login, pero con diferencias menores de estilo (ver R3).
- **Espaciado vertical del formulario** (de las coordenadas del frame): título → subtítulo 6px,
  subtítulo → primer campo 21px, entre campos 16px (etiqueta→campo 7px), último campo →
  casilla 18px, casilla → botón 16px, botón → separador 20px, separador → sociales 22px,
  sociales → pie 20px. El login usa un `gap` de 22px; el registro necesita uno menor (16px) para
  respetar el diseño, por lo que el espaciado se define en la hoja de estilos del formulario de
  registro, no en los componentes compartidos.
- **Decision**: traducir el código de referencia (Tailwind con posiciones absolutas) a CSS
  Modules con flexbox, reutilizando los tokens y componentes existentes. No se instala Tailwind.

## R3. Diferencias entre los frames de Login y Registro

Al comparar `04 · Registro` con `01 · Login` aparecen cinco diferencias que no son de contenido.
Todas se resuelven usando lo del login (aprobado por Eduardo Gabriel Vidal como responsable de
diseño, 2026-10-19):

| Elemento | Login (`2:2`, implementado) | Registro (`31:2`) | Decisión |
|---|---|---|---|
| Degradado del panel de marca | `121.19deg, #ff8a65 0% → #ef5226 70.71%` | `70.73deg, #ff8a65 31.70% → #ef5226 83.46%` | **Usar el del login** (`--brand-gradient`) |
| Marca del logo | Cápsula blanca 20×44 con círculo `#ef5226` | Elipse blanca 10×28 + círculo blanco al 55 % 14×14 | **Usar el del login** (`logo-mark.svg`) |
| Icono del ojo | Contorno `#8a8ca8` 1.5px | Elipse rellena `#a9abc2` al 50 % | **Usar el del login** (`eye.svg`) |
| Icono de botones sociales | Círculo `#8a8ca8` | Círculo `#d7d9e6` | **Usar el del login** (`social-placeholder.svg`) |
| Tarjeta "Kyn Card" | Chip liso; número a 99px y vencimiento a 298px del borde de la tarjeta | Chip con línea horizontal `rgba(22,24,44,.15)` de 4px; número a 104px y vencimiento a 312px | **Usar el estilo del login** (sin cambios en `BrandPanel`) |

- **Rationale**:
  - Una sola marca, un solo degradado, una sola tarjeta y un solo set de iconos para ambas
    pantallas: cumple 4.1 y 8.5, y el panel de marca no necesita variantes.
  - El ojo relleno al 50 % tiene un contraste de ~1.5:1 sobre blanco (color efectivo `#d4d5e0`),
    por debajo de los 3:1 que exige WCAG 1.4.11 para componentes de interfaz (Constitución 8.4);
    el del login ya cumple.
  - Los iconos sociales son marcadores de posición decorativos (`alt=""`).
- **Consequence**: no se descarga ningún activo del frame de registro; todos los SVG ya existen
  en `src/ui/assets/`.

## R4. Navegación entre `/login` y `/register`

- **Decision**: navegación propia mínima sobre la History API, en `src/ui/navigation/`: un hook
  `useNavigation()` que expone la ruta actual y `navigate(path)` (`history.pushState` + escucha de
  `popstate`). `App` elige la pantalla según la ruta. `/` y cualquier ruta desconocida se
  reemplazan por `/login` (`history.replaceState`).
- **Rationale**: dos rutas fijas, sin parámetros, sin rutas anidadas ni carga diferida. Unas 40
  líneas probadas cubren el requisito (KISS, YAGNI, Constitución 4.2–4.3, 7.4). El servidor de
  desarrollo y `vite preview` ya sirven `index.html` para cualquier ruta (`appType: 'spa'`), por
  lo que la entrada directa a `/register` funciona sin configuración.
- **Alternatives considered**: React Router 7 — maduro y con licencia MIT, pero agrega una
  dependencia de tamaño considerable para dos rutas; queda como evolución natural si la
  aplicación crece (registrar la decisión en este documento en ese momento). Rutas con hash (`#/register`)
  — rechazadas: el requisito pide `/login` explícitamente.
- **Note**: un despliegue en un servidor estático deberá redirigir las rutas desconocidas a
  `index.html`; se documenta en el README.

## R5. Mensaje de éxito en `/login` (aviso de un solo uso)

- **Decision**: el aviso viaja en el estado en memoria de `App`, no en la URL ni en el
  almacenamiento: `RegisterForm` llama `onRegistered()`, `App` guarda `flash = 'registered'` y
  navega a `/login`; `LoginForm` recibe el aviso como prop y lo muestra con `Alert`. Cualquier
  navegación posterior limpia el aviso; una recarga lo pierde por diseño.
- **Rationale**: cumple FR-012 (una sola vez) y FR-013 (sin datos en la URL) y el escenario US1-5
  (al recargar no aparece). `history.state` se descartó porque sobrevive a la recarga.
- **Alternatives considered**: parámetro `?registered=1` (sobrevive a la recarga, ensucia la
  URL); `sessionStorage` (persiste datos del flujo, innecesario).

## R6. Registro simulado

- **Decision**: puerto `RegistrationGateway` en `application/ports/` y adaptador
  `SimulatedRegistrationGateway` en `infrastructure/`, que espera ~1s (configurable para pruebas)
  y responde `{ kind: 'success' }` sin guardar nada. El caso de uso `createRegister`:
  1. ejecuta `validateRegistration` y, si hay errores, devuelve `{ kind: 'invalid', errors }` sin
     llamar al gateway (validación en el límite de la aplicación, Constitución 5.1);
  2. normaliza nombre y correo y llama al gateway;
  3. convierte cualquier excepción en `{ kind: 'unavailable' }`, registrándola (R14);
  4. registra el resultado de cada intento (R14).
- **Defensa en profundidad**: la UI sigue validando antes de enviar (respuesta inmediata, FR-009);
  la validación del caso de uso protege a cualquier otro consumidor futuro. Ambas usan la misma
  función de dominio, así que no hay reglas duplicadas (4.1).
- **Rationale**: replica el patrón del login (`AuthGateway` / `InMemoryAuthGateway`), que cumple
  Clean Architecture (3.1–3.4) e inversión de dependencias (2.5). Cuando exista un backend, solo
  cambia el adaptador.
- **Alternatives considered**: simular dentro del hook de UI — rechazado: mezcla la regla de
  negocio con la presentación (3.3) y no permite probar el fallo inesperado.
- **Note**: no se valida si el correo ya existe ni se reutilizan las cuentas de
  `VITE_DEMO_USERS` (fuera de alcance según la spec). El registro no necesita configuración
  externa ni credenciales.

## R7. Validación

- **Decision**: nueva función de dominio `validateRegistration` en `domain/registration.ts`, que
  reutiliza las reglas de correo y contraseña de `domain/validation.ts` (se exportan las
  funciones `validateEmail` y `validatePassword`, hoy privadas). Reglas nuevas: nombre (recortado)
  de 2 a 100 caracteres; confirmación obligatoria e igual a la contraseña; términos aceptados.
- **Mensajes nuevos** en `domain/messages.ts` (fuente única):

  | Clave | Texto |
  |---|---|
  | `FULL_NAME_REQUIRED` | Ingresa tu nombre completo |
  | `FULL_NAME_TOO_SHORT` | El nombre debe tener al menos 2 caracteres |
  | `FULL_NAME_TOO_LONG` | El nombre no puede superar 100 caracteres |
  | `CONFIRM_PASSWORD_REQUIRED` | Confirma tu contraseña |
  | `PASSWORDS_DO_NOT_MATCH` | Las contraseñas no coinciden |
  | `TERMS_REQUIRED` | Debes aceptar los términos y condiciones |
  | `REGISTRATION_SUCCESS` | Cuenta creada con éxito. Ya puedes iniciar sesión. |
  | `REGISTRATION_UNAVAILABLE` | No pudimos crear tu cuenta. Intenta más tarde. |
  | `COMING_SOON` | Próximamente |

  Se reutilizan `EMAIL_REQUIRED`, `EMAIL_INVALID`, `PASSWORD_REQUIRED`, `PASSWORD_TOO_SHORT`,
  `PASSWORD_TOO_LONG` y `FEATURE_UNAVAILABLE`.
- **Momento**: igual que en el login (FR-009): los errores se muestran al salir de un campo
  tocado y al enviar; se recalculan en cada cambio. La confirmación se reevalúa cuando cambia la
  contraseña (US2-5), siempre que la confirmación ya esté tocada.

## R8. Alerta "Próximamente" de Google y Apple

- **Decision**: `window.alert('Próximamente')`, como pide el requisito 4 del usuario y FR-015.
- **Diseño**: la llamada no se hace directo desde el componente, sino por una función `alert`
  inyectada en `RegisterForm` (prop opcional `onComingSoon`, por defecto
  `(message) => window.alert(message)`). Así el formulario no depende del objeto global
  (Constitución 2.5) y las pruebas verifican el mensaje con un doble en vez de interceptar
  `window`. jsdom no implementa `window.alert`, por lo que la prueba de integración de `App` lo
  reemplaza con `vi.spyOn(window, 'alert').mockImplementation(() => {})`.
- **Accesibilidad**: el cuadro nativo es modal, recibe el foco y lo anuncian los lectores de
  pantalla; al cerrarlo, el foco vuelve al botón que lo abrió. No hay requisito WCAG que lo
  impida.
- **Corrección**: una versión anterior de este plan proponía un aviso en la página por
  coherencia con el login. Se descartó: el requisito pedía "alert" de forma explícita y la
  coherencia con otra pantalla no justifica apartarse de él.

## R9. Casilla de términos con enlace

- **Decision**: extender `Checkbox` con tres props opcionales: `error` (mensaje asociado con
  `aria-describedby` y `aria-invalid`), `ref` (para mover el foco, US3-1) y `addon` (contenido
  interactivo que se muestra junto a la etiqueta, **fuera** del elemento `<label>`). El nombre
  accesible de la casilla se compone con `aria-labelledby` (etiqueta + addon): "Acepto los
  términos y condiciones". El enlace "términos y condiciones" es un `Button` variante `link` que
  muestra "Función no disponible en esta demostración".
- **Rationale**: un `<button>` dentro de `<label>` es contenido no permitido (el botón es un
  elemento etiquetable) y su clic marcaría la casilla, lo que contradice US3-3. Las props nuevas
  son opcionales: el uso actual en el login no cambia (Constitución 2.2).
- **Alternatives considered**: `<a href="#">` dentro de la etiqueta — enlace sin destino real
  (antipatrón de accesibilidad); dos textos separados sin `aria-labelledby` — la casilla quedaría
  con el nombre incompleto "Acepto los".

## R10. Composición de pantallas y responsive

- **Decision**: convertir `LoginScreen` en un layout compartido `AuthLayout`
  (`src/ui/layout/AuthLayout/`) que recibe el contenido del panel de marca y el formulario.
  `BrandPanel` recibe `title` y `subtitle`; logo, degradado y tarjeta son los mismos (R3).
  Los puntos de corte de 001 (R10) se mantienen: por debajo de 960px el panel de marca se reduce
  a una cabecera con el logo y solo se ve el formulario; desde 960px, dos columnas.
- **Rationale**: ambas pantallas comparten distribución, panel y comportamiento responsive; un
  solo layout evita duplicar CSS (4.1) y cumple FR-020 por construcción.
- **Note**: es un refactor del login; sus pruebas existentes deben seguir pasando sin cambios
  de comportamiento (Constitución 1.2).

## R11. Accesibilidad y cambio de pantalla

- **Decision**: al cambiar de ruta, `App` actualiza `document.title` ("Crear cuenta · KynWallet"
  / "Iniciar sesión · KynWallet") y mueve el foco al título `h1` de la pantalla nueva
  (`tabIndex={-1}`). El aviso de éxito usa `role="status"`, por lo que se anuncia sin mover el
  foco.
- **Rationale**: en una SPA el cambio de vista no se anuncia solo; título y foco cubren WCAG
  2.4.2 y 2.4.3.

## R12. Pruebas

- **Decision**: TDD con la configuración existente (umbral de cobertura 80 %). Niveles:
  - Unitarias: `validateRegistration`, `registerReducer`, `createRegister` (incluidos
    validación y eventos registrados), `SimulatedRegistrationGateway` (temporizadores falsos),
    `ConsoleJsonLogger`, `useNavigation`.
  - Componentes: `Checkbox` (props nuevas), `RegisterForm` (escenarios de US1–US3, US6, US7).
  - Integración: `App` (rutas `/login` ↔ `/register`, aviso de éxito de un solo uso, entrada
    directa por URL) y auditoría `axe-core` de la pantalla de registro vacía, con errores y del
    login con el aviso.
  - Cada caso se nombra con el ID del escenario o requisito (`US2-4`, `FR-012`) por trazabilidad
    (9.2).
- **Responsive**: jsdom no aplica media queries; la composición escritorio/móvil (US5-1 a US5-3)
  se verifica con pruebas en navegador real (R15) a 1440, 375 y 320px.

## R13. Contraste de color (WCAG 2.1 AA)

Aprobado por Eduardo Gabriel Vidal como responsable de diseño (2026-10-19): corregir todo lo
necesario para cumplir AA. Los colores
literales del frame de registro son los mismos del login, así que se aplican los tokens
accesibles ya existentes (001, research R3) y se verifica cada elemento de la pantalla nueva:

| Elemento del registro | Figma | Ratio | Requisito | Se usa | Ratio final |
|---|---|---|---|---|---|
| Texto del botón "Crear cuenta" | blanco / `#ff6b3d` | 2.83:1 | 4.5:1 | fondo `--brand-700` `#d04721` (hover `--brand-800`) | 4.56:1 |
| Enlaces "términos y condiciones", "Inicia sesión" | `#ef5226` | 3.56:1 | 4.5:1 | `--brand-700` | 4.56:1 |
| Subtítulo, separador "o regístrate con", "¿Ya tienes cuenta?" | `#8a8ba8` | 3.31:1 | 4.5:1 | `--neutral-600` `#73748b` | 4.57:1 |
| Placeholders | `#a9abc2` | 2.26:1 | 4.5:1 | `--neutral-600` | 4.57:1 |
| Bordes de campos, casilla y botones sociales | `#d7d9e6` | 1.40:1 | 3:1 (1.4.11) | `--neutral-border` `#92949c` | 3.03:1 |
| Ícono del ojo | ver R3 | ~1.5:1 | 3:1 (1.4.11) | `eye.svg` del login (`#8a8ca8`) | 3.28:1 |
| Mensajes de error | — | — | 4.5:1 | `--danger-600` `#c62828` | 5.62:1 |
| Etiquetas y "Acepto los" | `#3d3f5c` | 10.17:1 | 4.5:1 | sin cambio | 10.17:1 |
| Título "Crea tu cuenta", texto de botones sociales | `#16182c` | 17.48:1 | 4.5:1 | sin cambio | 17.48:1 |
| Foco | — | — | 3:1 | `--focus-ring` (anillo `#16182c` sobre blanco) | 17.48:1 |

- **Panel de marca**: el texto es blanco sobre un degradado de `#ff8a65` a `#ef5226`. El titular
  (44px Bold) es texto grande y requiere 3:1: cumple sobre `#ef5226` (3.56:1), pero no sobre
  `#ff8a65` (2.31:1). El texto de apoyo (17px) requiere 4.5:1 y no cumple en ningún punto del
  degradado.
  - **Decisión inicial (descartada)**: una capa `--brand-scrim` de 35 % de negro detrás del texto
    (≥ 5.05:1 medido). Se implementó y se retiró el 2026-10-20: forma una franja oscura visible
    sobre el panel que el responsable de diseño rechazó.
  - **Alternativas evaluadas sin franja**: texto oscuro `#16182c` sobre el degradado actual
    (4.92:1 a 7.56:1) y degradado oscurecido de `#d04721` a `#b03b1b` con texto blanco (4.56:1 a
    6.02:1). Ambas cumplen AA y quedaron disponibles para la corrección definitiva.
  - **Decision**: el panel de marca (login y registro) conserva el texto blanco sobre el
    degradado de Figma bajo una **excepción temporal a la regla 8.4** (Constitución 9.1),
    aprobada por Eduardo Gabriel Vidal el 2026-10-20, con vencimiento el **2027-01-17**. Antes de
    esa fecha diseño debe adoptar una de las alternativas que cumplen (o una nueva) y retirar la
    excepción. El resto de la pantalla cumple AA (tabla anterior).
- **Exentos**: el texto "KynWallet" es un logotipo y la tarjeta "Kyn Card" es una ilustración
  decorativa (`aria-hidden`); WCAG 1.4.3 exime de contraste al texto que forma parte de un
  logotipo y al texto incidental de imágenes decorativas; no forman parte de la excepción.
- **Verification**: el helper `expectNoA11yViolations` desactiva la regla de contraste de axe
  porque jsdom no calcula estilos (heredado de 001); el contraste se verifica midiendo los tokens
  y, en la validación manual, sobre capturas del navegador.
- **Scope note**: el panel de marca es compartido; la excepción cubre el panel en login y registro.

## R14. Registro de eventos (Constitución 5.5 y 8.7)

La Constitución exige que los componentes emitan logs estructurados y métricas (8.7), que las
excepciones no se silencien y que los eventos relevantes de seguridad se registren de forma
estructurada y trazable (5.5), sin exponer datos sensibles (5.4). El alta de una cuenta es un
evento relevante de seguridad.

- **Decision**: puerto `Logger` en `application/ports/Logger.ts` con dos métodos,
  `info(entry)` y `error(entry)`, donde `entry` es
  `{ event: string; attemptId: string; [campo: string]: string | number | boolean | string[] }`.
  El caso de uso `createRegister` recibe el logger por inyección junto al gateway y registra:

  | Evento | Nivel | Campos | Cuándo |
  |---|---|---|---|
  | `registration.succeeded` | info | `attemptId`, `durationMs` | El gateway respondió `success` |
  | `registration.rejected` | info | `attemptId`, `invalidFields` (solo nombres de campo) | `validateRegistration` devolvió errores |
  | `registration.failed` | error | `attemptId`, `durationMs`, `errorName` | El gateway rechazó la promesa |

  - `attemptId`: identificador único por intento, que hace trazable cada intento de punta a
    punta. Lo genera `newAttemptId()` (`src/application/attemptId.ts`, compartido con el login):
    usa `crypto.randomUUID()` y, en contextos no seguros (HTTP fuera de `localhost`, donde esa
    función no existe), un respaldo con fecha y aleatorio. Sin el respaldo, abrir la demo por HTTP
    desde otra máquina colgaba el registro (hallazgo U1 de `/speckit-analyze`, corregido el
    2026-10-20). Es inyectable para pruebas.
  - `errorName`: solo `error.name` (p. ej. `TypeError`); nunca `error.message` ni la pila, que
    podrían contener datos ingresados.
  - **Nunca** se registran nombre, correo ni contraseña, ni los valores de los campos inválidos.
- **Adaptador**: `infrastructure/ConsoleJsonLogger.ts` escribe una línea JSON por evento
  (`{ timestamp, level, app: 'kynwallet-web', ...entry }`) con `console.info` / `console.error`.
  Es el único archivo exento de la regla ESLint `no-console` (override puntual en
  `eslint.config.js`).
- **Métricas**: en una demo solo-cliente no hay recolector de métricas. Los eventos llevan los
  datos para derivarlas (conteo por resultado y `durationMs`), de modo que un futuro adaptador
  (p. ej., hacia un servicio de observabilidad) pueda emitirlas sin tocar el caso de uso.
- **Rationale**: un puerto mantiene el dominio y el caso de uso libres de infraestructura (3.2,
  3.4) y permite verificar en pruebas qué se registra y qué no.
- **Alternatives considered**: `console.*` directo en el caso de uso — viola 3.2 y no es
  verificable sin espiar globales; librería de logging (pino, loglevel) — dependencia innecesaria
  para escribir JSON en consola (7.4).
- **Login (001, T073, completada el 2026-10-20)**: `createAuthenticate` usa el mismo puerto,
  adaptador y generador de `attemptId`, y registra `auth.succeeded` (info), `auth.rejected` (info,
  `reason: 'invalid-credentials'`) y `auth.failed` (error, `reason: 'unavailable'` si el gateway
  responde no disponible o `errorName` si lanza). Nunca registra correo, contraseña ni el nombre
  del titular.

## R15. Pruebas en navegador real (Playwright)

- **Contexto**: jsdom no calcula diseño ni posiciones. El defecto T058 (desfase del panel de
  marca) solo podía reproducirse en un navegador, y la regla 1.3 exige una prueba que lo
  reproduzca. Lo mismo pasaba con la composición responsive (US5-1 a US5-3) y la alerta nativa.
- **Decision**: `@playwright/test` 1.64.1 como dependencia de desarrollo, con versión exacta, solo
  con Chromium. Las pruebas viven en `e2e/*.spec.ts`; `playwright.config.ts` levanta Vite en el
  puerto 4174. Se ejecutan con `npm run test:e2e` y forman parte de `npm run verify` (regla 9.4).
  Vitest queda limitado a `src/**/*.test.{ts,tsx}`.
- **Cobertura**: alineación del panel de marca en login y registro a 1440 × 1024/800/700/600 y
  panel fijo al desplazar (T058); dos paneles en escritorio; solo formulario y sin scroll
  horizontal a 375 y 320px; datos conservados al cambiar de tamaño; alerta nativa
  "Próximamente"; registro completo con aviso de un solo uso y evento `registration.succeeded` sin
  datos personales.
- **Rationale (7.1, 7.4)**: Apache-2.0, mantenimiento activo de Microsoft, 0 vulnerabilidades con
  `npm audit`. Es la única herramienta del proyecto que ejecuta un navegador real. Se eligió
  1.64.1 en lugar de 1.63.0 (la única con más de dos semanas publicada) por ser la última
  versión estable con correcciones, publicada el 2026-10-14.
- **Alternatives considered**: mantener la verificación manual (no cumple 1.3 para T058);
  Cypress (licencia y servicio comercial asociados, más peso); WebdriverIO (más configuración
  para el mismo resultado).
- **Requisito de entorno**: la primera vez hay que descargar el navegador con
  `npx playwright install chromium` (~100 MB, no se versiona).


---

description: "Task list for 002-registro-billetera"
---

# Tasks: Pantalla de Registro de KynWallet

**Input**: Design documents from `/specs/002-registro-billetera/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-register.md,
contracts/registration-gateway.md, quickstart.md

**Tests**: OBLIGATORIAS. La Constitución (Principio I, TDD) exige escribir cada prueba antes del
código y verla fallar. En cada fase, las tareas de prueba van primero.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US7)
- Rutas relativas a la raíz del repositorio. Las pruebas viven junto al código (`*.test.ts(x)`).
- Trazabilidad (Constitución 9.2): cada `it(...)` DEBE empezar con el ID del escenario o
  requisito que verifica, p. ej. `it('US2-5: vuelve a validar la confirmación…')`.
- Textos visibles: siempre desde `src/domain/messages.ts`, nunca literales repetidos (Constitución 4.1).
- Registro de eventos (FR-023, research.md R14): ningún log puede contener nombre, correo,
  contraseña ni `error.message`. `console` solo se permite en `ConsoleJsonLogger.ts`.
- Diseño: valores de research.md R2; logo, degradado, tarjeta e iconos del login (research.md R3);
  colores accesibles de research.md R13. No se descarga ningún activo de Figma.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar que la base de 001 está sana antes de modificarla

- [X] T001 Verificar que la rama activa es `feature/registro-eduardo-vidal`, ejecutar `npm install` y `npm run verify` en la raíz, y confirmar que todo pasa antes de tocar código (línea base para la regla 1.2 de la Constitución: los refactores no deben romper pruebas existentes)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Dominio, caso de uso, adaptador, navegación y layout compartido que usan todas las historias

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests (escribir primero y verlas fallar)

- [X] T002 [P] Escribir `src/domain/registration.test.ts` para `validateRegistration` según data-model.md: devuelve `{}` con datos válidos; `fullName` "Obligatorio; recortado, de 2 a 100 caracteres" (vacío y solo espacios → `FULL_NAME_REQUIRED`, 1 carácter → `FULL_NAME_TOO_SHORT`, 101 → `FULL_NAME_TOO_LONG`, `"  Ana  "` es válido); `email` "Obligatorio; formato de correo; ≤ 254 caracteres; se recorta" (`EMAIL_REQUIRED`, `EMAIL_INVALID` para `usuario@` y `usuario.com`); `password` "Obligatorio; de 8 a 128 caracteres; no se recorta" (`PASSWORD_REQUIRED`, `PASSWORD_TOO_SHORT` con 7, `PASSWORD_TOO_LONG` con 129, `" 1234567"` de 8 caracteres con espacio es válido); `confirmPassword` "Obligatorio; igual a password, carácter por carácter" (vacío → `CONFIRM_PASSWORD_REQUIRED`, distinto → `PASSWORDS_DO_NOT_MATCH`, `"Clave123 "` ≠ `"Clave123"`); `acceptedTerms` "Debe ser true" (`false` → `TERMS_REQUIRED`); con todo vacío devuelve los cinco errores a la vez
- [X] T003 [P] Escribir `src/application/register.test.ts` para `createRegister({ gateway, logger, newAttemptId, now })` según contracts/registration-gateway.md, con un gateway falso, `createLoggerSpy()` de `src/test/loggerSpy.ts`, `newAttemptId = () => 'attempt-1'` y un `now` controlado: (a) con datos válidos entrega al gateway `{ fullName, email, password }` con nombre recortado, correo con `normalizeEmail` y contraseña sin cambios, sin `confirmPassword` ni `acceptedTerms`, y devuelve `{ kind: 'success' }`; (b) U1/FR-010 con datos inválidos devuelve `{ kind: 'invalid', errors }` (igual a `validateRegistration(data)`) y **no** llama al gateway; (c) si el gateway rechaza, devuelve `{ kind: 'unavailable' }`; (d) FR-023 registra exactamente un evento por intento: `info` `registration.succeeded` con `attemptId: 'attempt-1'` y `durationMs`; `info` `registration.rejected` con `invalidFields` = nombres de campo con error; `error` `registration.failed` con `durationMs` y `errorName` = `error.name`; (e) FR-013 ningún evento registrado contiene, serializado con `JSON.stringify`, el nombre, el correo, la contraseña ni el `message` del error lanzado (usar valores distintivos, p. ej. `'Zoe Secreta'`, `'zoe@secreto.test'`, `'ClaveSecreta123'`, `new TypeError('detalle interno zoe@secreto.test')`)
- [X] T004 [P] Escribir `src/infrastructure/SimulatedRegistrationGateway.test.ts` con `vi.useFakeTimers()`: no resuelve antes de `delayMs`, resuelve `{ kind: 'success' }` después; el valor por defecto es 1000 ms; `{ delayMs: 0 }` resuelve de inmediato; no escribe en `localStorage`/`sessionStorage` (espiar `Storage.prototype.setItem`)
- [X] T005 [P] Escribir `src/infrastructure/ConsoleJsonLogger.test.ts` espiando `console.info` y `console.error`: `info(entry)` escribe en `console.info` **una** cadena JSON parseable con `timestamp` (ISO-8601, con una fecha fija vía `vi.setSystemTime`), `level: 'info'`, `app: 'kynwallet-web'` y todos los campos de `entry`; `error(entry)` hace lo mismo con `console.error` y `level: 'error'`; restaurar los espías
- [X] T006 [P] Escribir `src/ui/navigation/useNavigation.test.ts` (con `renderHook`): con `location.pathname` `/register` devuelve `route: '/register'`; con `/` o `/otra` devuelve `/login` y llama `history.replaceState` (sin entrada nueva); `navigate('/register')` hace `pushState` y actualiza `route`; un evento `popstate` actualiza `route`; elimina el listener al desmontar. Restaurar la URL con `history.replaceState(null, '', '/')` en `afterEach`

### Implementation

- [X] T007 Agregar a `src/domain/messages.ts` las claves de research.md R7 con su texto exacto: `FULL_NAME_REQUIRED: 'Ingresa tu nombre completo'`, `FULL_NAME_TOO_SHORT: 'El nombre debe tener al menos 2 caracteres'`, `FULL_NAME_TOO_LONG: 'El nombre no puede superar 100 caracteres'`, `CONFIRM_PASSWORD_REQUIRED: 'Confirma tu contraseña'`, `PASSWORDS_DO_NOT_MATCH: 'Las contraseñas no coinciden'`, `TERMS_REQUIRED: 'Debes aceptar los términos y condiciones'`, `REGISTRATION_SUCCESS: 'Cuenta creada con éxito. Ya puedes iniciar sesión.'`, `REGISTRATION_UNAVAILABLE: 'No pudimos crear tu cuenta. Intenta más tarde.'`, `COMING_SOON: 'Próximamente'`
- [X] T008 Exportar `validateEmail` y `validatePassword` en `src/domain/validation.ts` (hoy privadas), sin cambiar su comportamiento; `src/domain/validation.test.ts` debe seguir pasando
- [X] T009 Crear `src/domain/registration.ts` con los tipos `RegistrationData` (`fullName`, `email`, `password`, `confirmPassword: string`; `acceptedTerms: boolean`), `RegistrationErrors = Partial<Record<keyof RegistrationData, string>>`, `NewAccount` (`fullName`, `email`, `password`), `RegistrationResult = { kind: 'success' } | { kind: 'invalid'; errors: RegistrationErrors } | { kind: 'unavailable' }`, las constantes `FULL_NAME_MIN_LENGTH = 2` y `FULL_NAME_MAX_LENGTH = 100`, y la función pura `validateRegistration(data)`, que reutiliza `validateEmail`/`validatePassword` y evalúa por campo en el orden obligatorio → mínimo → máximo/formato; la confirmación solo informa `PASSWORDS_DO_NOT_MATCH` si no está vacía (hace pasar T002; depende de T007, T008)
- [X] T010 [P] Crear el puerto `src/application/ports/Logger.ts` con `LogEntry = { event: string; attemptId: string; [field: string]: string | number | boolean | string[] }` y `interface Logger { info(entry: LogEntry): void; error(entry: LogEntry): void }`, y `src/test/loggerSpy.ts` con `createLoggerSpy()`, que devuelve un `Logger` con `info` y `error` como `vi.fn()` y un arreglo `entries` con `{ level, ...entry }` en orden (research.md R14)
- [X] T011 Crear el puerto `src/application/ports/RegistrationGateway.ts` con `register(account: NewAccount): Promise<RegistrationResult>` y el caso de uso `src/application/register.ts` con `export type Register = (data: RegistrationData) => Promise<RegistrationResult>` y `createRegister({ gateway, logger, newAttemptId = () => crypto.randomUUID(), now = () => performance.now() })`, que sigue la tabla de pasos de contracts/registration-gateway.md: valida con `validateRegistration` (si hay errores, registra `registration.rejected` con `invalidFields: Object.keys(errors)` y devuelve `{ kind: 'invalid', errors }`), normaliza a `NewAccount`, llama al gateway dentro de `try`, registra `registration.succeeded` o, en el `catch`, `registration.failed` con `errorName: error instanceof Error ? error.name : 'UnknownError'`, siempre con el mismo `attemptId` y `durationMs: Math.round(now() - inicio)` (hace pasar T003; depende de T009 y T010)
- [X] T012 Crear `src/infrastructure/SimulatedRegistrationGateway.ts`, que implementa `RegistrationGateway` con constructor `({ delayMs = 1000 } = {})`, espera y responde `{ kind: 'success' }` sin guardar ni registrar nada (mismo patrón que `InMemoryAuthGateway`; hace pasar T004; depende de T011)
- [X] T013 Crear `src/infrastructure/ConsoleJsonLogger.ts`, que implementa `Logger` con `info` → `console.info(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', app: 'kynwallet-web', ...entry }))` y el equivalente con `console.error`; agregar en `eslint.config.js` un bloque `{ files: ['src/infrastructure/ConsoleJsonLogger.ts'], rules: { 'no-console': 'off' } }`, sin relajar la regla en el resto del código (hace pasar T005; depende de T010)
- [X] T014 [P] Crear `src/test/registerStub.ts`, que replica `src/test/authStub.ts` para `Register`: `createRegisterStub(result = { kind: 'success' })` con `register: vi.fn`, `defer()` y `release()`
- [X] T015 [P] Crear `src/ui/navigation/useNavigation.ts`, que exporta `type Route = '/login' | '/register'` y el hook `useNavigation(): { route: Route; navigate(route: Route): void }` sobre la History API, según research.md R4 y data-model.md (hace pasar T006)
- [X] T016 Mover `src/ui/features/login/LoginScreen.tsx` y `LoginScreen.module.css` a `src/ui/layout/AuthLayout/AuthLayout.tsx` y `AuthLayout.module.css`, renombrando el componente a `AuthLayout` con props `{ brandTitle: ReactNode; brandSubtitle: string; children: ReactNode }`, que pasa a `BrandPanel`; actualizar el import en `src/App.tsx`. Sin cambios de estilo (research.md R10)
- [X] T017 Cambiar `src/ui/layout/BrandPanel/BrandPanel.tsx` para que reciba `title: ReactNode` y `subtitle: string` en lugar de los textos fijos; logo (`logo-mark.svg`), degradado (`--brand-gradient`) y tarjeta "Kyn Card" quedan como están (research.md R3). En `src/App.tsx`, pasar los textos actuales del login (`Tu dinero,<br />sin fronteras.` y "Envía, recibe y paga en segundos. Una billetera pensada para tu día a día.")
- [X] T018 Ejecutar `npm test` y confirmar que todas las pruebas de 001 siguen en verde tras T016–T017 (Constitución 1.2)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Crear una cuenta con datos válidos (Priority: P1) 🎯 MVP

**Goal**: Completar el formulario válido, crear la cuenta simulada y llegar a `/login` con el aviso de éxito de un solo uso.

**Independent Test**: Completar los cuatro campos con datos válidos, marcar la casilla, presionar "Crear cuenta" y verificar `/login` con "Cuenta creada con éxito. Ya puedes iniciar sesión.".

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T019 [P] [US1] Escribir `src/ui/features/register/registerReducer.test.ts` para las acciones `change`, `toggleTerms`, `submit` y `result` según la tabla de data-model.md: `submit` sin errores pasa a `submitting` y limpia `notice` y `failure`; `submit` ignorado si ya está `submitting`; `submit` con errores sigue en `editing` y marca todo como tocado; `result(unavailable)` → `failed`, `failure = true` y conserva **todos** los valores (incluidas las contraseñas); `result(invalid)` → `editing`, todos los campos tocados y `fieldErrors` igual a `errors`, conservando los valores
- [X] T020 [P] [US1] Escribir `src/ui/features/register/RegisterForm.test.tsx` (render con `createRegisterStub` y `onRegistered = vi.fn()`) con: US1-1 datos válidos + casilla + "Crear cuenta" → `register` recibe los datos y se llama `onRegistered` una vez; US1-2 con `defer()`: el botón muestra "Creando cuenta…", tiene `aria-busy=true`, está deshabilitado y un segundo clic no vuelve a llamar `register`; US1-3 Enter en "Nombre completo" envía el formulario; US1-4 espacios periféricos en nombre y correo no impiden el registro; FR-003 se muestran título `heading` nivel 1 "Crea tu cuenta", subtítulo "Completa tus datos para comenzar", los cuatro campos con los placeholders "Ej: Diego Martínez", "tucorreo@ejemplo.com", "••••••••" y los `autocomplete` `name`, `email`, `new-password`, `new-password` de contracts/ui-register.md
- [X] T021 [P] [US1] Ampliar `src/App.test.tsx` con `describe('App · rutas y registro')`. Pasar `register={createRegisterStub().register}` también en los casos existentes y fijar la URL con `history.replaceState` en `beforeEach`. Casos: FR-002 con `/register` se muestra "Crea tu cuenta" y `document.title` es "Crear cuenta · KynWallet"; US1-1 registro completo → URL `/login`, `heading` "Bienvenido de nuevo" y `status` con `REGISTRATION_SUCCESS`; FR-013 la URL tras el registro es exactamente `/login`, sin query ni hash; US1-5 tras el aviso, navegar a `/register` y volver a `/login` ya no lo muestra; R11 tras navegar, el foco está en el `h1` de la pantalla nueva
- [X] T022 [P] [US1] Ampliar `src/ui/features/login/LoginForm.test.tsx`: con la prop `successNotice="…"` se muestra un `status` con ese texto; sin la prop no hay aviso

### Implementation for User Story 1

- [X] T023 [US1] Crear `src/ui/features/register/registerReducer.ts` con `RegisterFormState`, `initialRegisterState` y las acciones `change`, `blur`, `toggleTerms`, `showNotice`, `submit` y `result` de data-model.md. Los errores visibles son solo los de campos tocados, calculados con `validateRegistration` (patrón de `loginReducer.ts`); si cambia `password` y `confirmPassword` está tocado, recalcular su error; `result` maneja `unavailable` e `invalid` según la tabla de data-model.md (hace pasar T019)
- [X] T024 [US1] Crear `src/ui/features/register/useRegisterForm.ts` con `(register: Register, onRegistered: () => void)`, `useReducer(registerReducer)`, guardas `inFlight` y `mounted` como `useLoginForm.ts`, y `submit()`, que devuelve los errores y, si no hay, llama a `register(state.values)`; con `success` llama `onRegistered()` y con `unavailable` o `invalid` despacha `result` (depende de T023)
- [X] T025 [US1] Crear `src/ui/features/register/RegisterForm.tsx` con props `{ register: Register; onRegistered: () => void; onNavigateLogin: () => void; onComingSoon?: (message: string) => void }`, que compone en el orden del frame `04 · Registro`: `h1` "Crea tu cuenta" (`tabIndex={-1}`), subtítulo, `TextField` "Nombre completo", `TextField` "Correo electrónico" (`type=email`), `PasswordField` "Contraseña", `PasswordField` "Confirmar contraseña", `Checkbox` "Acepto los términos y condiciones" (provisional: etiqueta de texto simple; el enlace llega en US3), `Button` submit "Crear cuenta" con `loadingLabel="Creando cuenta…"`, `Divider` "o regístrate con", `SocialButton` Google y Apple, pie "¿Ya tienes cuenta?" + `Button variant="link"` "Inicia sesión"; `form noValidate`. Mostrar `Alert tone="error"` con `REGISTRATION_UNAVAILABLE` si `failure` (hace pasar T020; depende de T024)
- [X] T026 [P] [US1] Crear `src/ui/features/register/RegisterForm.module.css` con los espacios de research.md R2: `.form` en columna con `gap: 16px`; `.heading` con `gap: 6px` y separación de 21px hasta el primer campo; título 30px/700 `--neutral-900`; subtítulo 16px `--neutral-600`; 18px entre el último campo y la casilla; 20px botón → separador; 22px separador → sociales; 20px sociales → pie; `.social` en grilla de dos columnas con `gap: 16px`; pie centrado 14px `--neutral-600`. Sin anchos fijos (el ancho máximo de 400px lo da `AuthLayout`)
- [X] T027 [US1] Agregar la prop opcional `successNotice?: string` a `src/ui/features/login/LoginForm.tsx`, que se muestra con `<Alert tone="info">` encima del título, y poner `tabIndex={-1}` en su `h1` (hace pasar T022)
- [X] T028 [US1] Reescribir `src/App.tsx` con props `{ authenticate: Authenticate; register: Register }`: usar `useNavigation()`; estado `flash: 'registered' | null`; `goTo(route)` limpia `flash` y navega; `/register` renderiza `AuthLayout` con titular "Comienza tu<br />camino financiero." y texto "Crea tu cuenta en minutos y empieza a enviar, recibir y administrar tu dinero desde cualquier lugar." más `RegisterForm`, cuyo `onRegistered` hace `navigate('/login')` y luego `setFlash('registered')`; `/login` renderiza el login actual con `successNotice={flash ? MESSAGES.REGISTRATION_SUCCESS : undefined}`; en un `useEffect` sobre `route`, fijar `document.title` ("Crear cuenta · KynWallet" / "Iniciar sesión · KynWallet") y mover el foco al `h1` de la pantalla (hace pasar T021; depende de T015, T016, T025, T027)
- [X] T029 [US1] Inyectar el caso de uso en `src/main.tsx`: `const register = createRegister({ gateway: new SimulatedRegistrationGateway(), logger: new ConsoleJsonLogger() });` y `<App authenticate={authenticate} register={register} />` (raíz de composición, Constitución 2.5)

**Checkpoint**: User Story 1 completa: el registro feliz funciona de punta a punta (quickstart pasos 11–12)

---

## Phase 4: User Story 2 - Retroalimentación inmediata sobre los datos (Priority: P1)

**Goal**: Validación inline de los cuatro campos, mensajes accesibles y foco en el primer error.

**Independent Test**: Enviar vacío y luego con correo mal formado, contraseña corta y confirmación distinta; verificar el mensaje junto a cada campo.

### Tests for User Story 2 ⚠️

- [X] T030 [P] [US2] Ampliar `src/ui/features/register/registerReducer.test.ts`: `blur` marca el campo como tocado y muestra su error; `change` en un campo no tocado no muestra error; US2-5 con `password` y `confirmPassword` iguales y tocados, cambiar `password` produce `PASSWORDS_DO_NOT_MATCH` en `confirmPassword`; corregir un valor elimina su error (US2-6)
- [X] T031 [P] [US2] Ampliar `src/ui/features/register/RegisterForm.test.tsx` con `describe('US2')`: US2-1 enviar vacío muestra los cuatro mensajes de campo obligatorio, no llama `register` y el foco queda en "Nombre completo"; US2-2 `usuario@` + tab → descripción accesible "Ingresa un correo electrónico válido"; US2-3 `1234567` + tab → "La contraseña debe tener al menos 8 caracteres"; US2-4 confirmación distinta + tab → "Las contraseñas no coinciden"; US2-5 igualar y luego cambiar la contraseña muestra el error en la confirmación; US2-6 corregir elimina el mensaje; US2-7 cada campo con error tiene `aria-invalid=true` y `toHaveAccessibleDescription(mensaje)`; US2-8 enviar con errores conserva todos los valores, contraseñas incluidas; con nombre válido y correo inválido el foco va al correo (orden de contracts/ui-register.md); FR-021 con `createRegisterStub({ kind: 'unavailable' })` se muestra `alert` "No pudimos crear tu cuenta. Intenta más tarde." y los valores se conservan; al editar un campo el `alert` desaparece; caso límite: pegar (`user.paste`) un correo inválido en el campo y salir muestra el mismo error que al escribirlo; caso límite/FR-013: con `vi.spyOn(Storage.prototype, 'setItem')`, completar y enviar un registro válido no escribe nada en `localStorage` ni `sessionStorage`

### Implementation for User Story 2

- [X] T032 [US2] Conectar en `src/ui/features/register/RegisterForm.tsx` el `onBlur` de cada campo con `blur(field)` y `error={state.fieldErrors[field]}`; crear `ref`s para los cuatro campos y, en `handleSubmit`, enfocar el primero con error en el orden nombre → correo → contraseña → confirmación (los términos se suman en US3) (hace pasar T031)
- [X] T033 [US2] Ajustar `src/ui/features/register/registerReducer.ts` si T030 falla en algún caso (recalcular la confirmación al cambiar la contraseña; `change` en estado `failed` vuelve a `editing` y limpia `failure`)

**Checkpoint**: User Stories 1 y 2 funcionan; quickstart pasos 2–6

---

## Phase 5: User Story 3 - Aceptar los términos y condiciones (Priority: P1)

**Goal**: La casilla es obligatoria, accesible y su enlace informa que no está disponible sin marcarla.

**Independent Test**: Completar todo válido sin marcar la casilla, enviar y verificar el mensaje y el foco; activar el enlace y verificar el aviso.

### Tests for User Story 3 ⚠️

- [X] T034 [P] [US3] Ampliar `src/ui/components/Checkbox/Checkbox.test.tsx` (los casos existentes deben seguir pasando): con `error` la casilla tiene `aria-invalid=true` y descripción accesible igual al mensaje; con `addon={<button>términos y condiciones</button>}` y `label="Acepto los"` el nombre accesible es "Acepto los términos y condiciones"; hacer clic en el addon **no** cambia `checked`; la prop `ref` apunta al `input`
- [X] T035 [P] [US3] Ampliar `src/ui/features/register/RegisterForm.test.tsx` con `describe('US3')`: US3-1 todo válido sin casilla → "Debes aceptar los términos y condiciones", `register` no se llama y el foco queda en el `checkbox` "Acepto los términos y condiciones"; US2-1 (parte de términos) con el formulario completamente vacío, al enviar también se muestra "Debes aceptar los términos y condiciones" junto a la casilla; US3-2 marcar la casilla elimina el mensaje; US3-3 el `button` "términos y condiciones" muestra `status` "Función no disponible en esta demostración", la casilla no cambia y los valores se conservan; US3-4 la casilla se marca con la barra espaciadora

### Implementation for User Story 3

- [X] T036 [US3] Extender `src/ui/components/Checkbox/Checkbox.tsx` con props opcionales `error?: string`, `addon?: ReactNode` y `ref?: Ref<HTMLInputElement>` según research.md R9: el `addon` se renderiza en un `span` con id propio **fuera** del `<label>`; si hay `addon`, el `input` usa `aria-labelledby="{labelId} {addonId}"`; si hay `error`, se agregan `aria-invalid`, `aria-describedby` y un `<p>` con el estilo de error de `TextField`. Agregar en `Checkbox.module.css` la clase de error (`--danger-600`, 13px), el borde `--danger-600` cuando es inválido y el contenedor en columna. Sin cambios visibles para el login (hace pasar T034)
- [X] T037 [US3] En `src/ui/features/register/RegisterForm.tsx`, reemplazar la casilla provisional por `Checkbox label="Acepto los"` con `addon={<Button variant="link" onClick={() => showNotice(MESSAGES.FEATURE_UNAVAILABLE)}>términos y condiciones</Button>}`, `error={state.fieldErrors.acceptedTerms}`, `ref` y `onChange={toggleTerms}`; agregar `blur('acceptedTerms')` al perder el foco; en `handleSubmit`, enfocar la casilla si es el primer error; mostrar `state.notice` con `<Alert tone="info">` debajo de los botones sociales (hace pasar T035)

**Checkpoint**: Las tres historias P1 completas; quickstart pasos 7–8. MVP listo

---

## Phase 6: User Story 4 - Ir a iniciar sesión si ya tengo cuenta (Priority: P2)

**Goal**: Navegación entre `/register` y `/login` en ambos sentidos, incluidos Atrás y Adelante del navegador.

**Independent Test**: Activar "Inicia sesión" desde el registro y "Regístrate" desde el login; verificar la URL y la pantalla.

### Tests for User Story 4 ⚠️

- [X] T038 [P] [US4] Actualizar `src/ui/features/login/LoginForm.test.tsx`: quitar `'Regístrate'` del `it.each` de US5-1 de 001 (ya no muestra el aviso) y agregar `it('US4-2: "Regístrate" llama a onNavigateRegister')` con la nueva prop `onNavigateRegister = vi.fn()`; el test de orden de tabulación FR-014 se mantiene
- [X] T039 [P] [US4] Ampliar `src/ui/features/register/RegisterForm.test.tsx`: US4-1 el `button` "Inicia sesión" llama `onNavigateLogin` y no llama `register`
- [X] T040 [P] [US4] Ampliar `src/App.test.tsx`: US4-1 desde `/register`, "Inicia sesión" lleva a `/login` sin aviso de éxito; US4-2 desde `/login`, "Regístrate" lleva a `/register` con el formulario vacío; Atrás del navegador (`history.back()` + `await` del evento `popstate`) vuelve a la pantalla anterior; FR-002 con la URL inicial `/` se muestra el login y la URL queda en `/login`

### Implementation for User Story 4

- [X] T041 [US4] En `src/ui/features/login/LoginForm.tsx`, agregar la prop `onNavigateRegister: () => void` y usarla en el `onClick` del botón "Regístrate" en lugar de `notAvailable` (hace pasar T038)
- [X] T042 [US4] En `src/ui/features/register/RegisterForm.tsx`, conectar el botón "Inicia sesión" a `onNavigateLogin`, y en `src/App.tsx` pasar `onNavigateLogin={() => goTo('/login')}` y `onNavigateRegister={() => goTo('/register')}` (hace pasar T039, T040)

**Checkpoint**: Flujo de acceso conectado en ambos sentidos; quickstart pasos 13–14

---

## Phase 7: User Story 5 - Usar el registro en escritorio y en móvil (Priority: P2)

**Goal**: Dos paneles en escritorio; solo formulario con el logo en móvil; sin scroll horizontal desde 320px.

**Independent Test**: Ver la pantalla a 1440px y a 320px y comparar con el contrato.

### Tests for User Story 5 ⚠️

- [X] T043 [P] [US5] Ampliar `src/App.test.tsx`: US5-4 con datos escritos en `/register`, disparar `window.dispatchEvent(new Event('resize'))` y verificar que los valores se conservan (el diseño responsive es solo CSS y no desmonta el formulario). La composición por ancho no se puede verificar en jsdom (research.md R12): se valida manualmente en T045

### Implementation for User Story 5

- [X] T044 [US5] Revisar `src/ui/features/register/RegisterForm.module.css` y `src/ui/layout/AuthLayout/AuthLayout.module.css` para que, por debajo de 480px, la grilla `.social` siga en dos columnas sin desbordar (`minmax(0, 1fr)`) y ningún elemento tenga ancho fijo mayor a 288px (320px − 2×16px de padding)
- [X] T045 [US5] Ejecutar `npm run dev` y validar a mano los pasos 1, 15 y 16 de `specs/002-registro-billetera/quickstart.md` a 1440, 768, 375 y 320px; anotar cualquier desvío en el PR

**Checkpoint**: Pantalla usable en todos los anchos

---

## Phase 8: User Story 6 - Mostrar u ocultar las contraseñas (Priority: P3)

**Goal**: Cada campo de contraseña tiene su propio control de visibilidad accesible.

**Independent Test**: Activar el control de cada campo y verificar que solo cambia ese campo.

### Tests for User Story 6 ⚠️

- [X] T046 [P] [US6] Ampliar `src/ui/features/register/RegisterForm.test.tsx` con `describe('US6')`: US6-1/US6-2 el primer `button` "Mostrar contraseña" cambia "Contraseña" a `type=text` y su nombre a "Ocultar contraseña", y vuelve; US6-3 cambiar la visibilidad de "Contraseña" deja "Confirmar contraseña" en `type=password` (hay dos botones "Mostrar contraseña"; usar `getAllByRole(...)[0]`/`[1]`); US6-4 los dos controles tienen `aria-pressed` y se alcanzan con tab

### Implementation for User Story 6

- [X] T047 [US6] Confirmar que T046 pasa sin cambios en `src/ui/components/PasswordField/PasswordField.tsx` (su estado de visibilidad es local, data-model.md)

**Checkpoint**: quickstart paso 10

---

## Phase 9: User Story 7 - Registro con Google y Apple no disponible (Priority: P3)

**Goal**: "Google" y "Apple" abren `window.alert("Próximamente")` sin alterar el formulario.

**Independent Test**: Activar cada botón y verificar la alerta nativa.

### Tests for User Story 7 ⚠️

- [X] T048 [P] [US7] Ampliar `src/ui/features/register/RegisterForm.test.tsx` con `describe('US7')`: US7-1/US7-2, con `onComingSoon = vi.fn()`, "Google" y "Apple" llaman `onComingSoon('Próximamente')` una vez cada uno, los valores se conservan y `register` no se llama; sin la prop `onComingSoon`, el clic llama `window.alert('Próximamente')` (espiar con `vi.spyOn(window, 'alert').mockImplementation(() => {})` y restaurarlo)
- [X] T049 [P] [US7] Ampliar `src/App.test.tsx`: US7-3 en `/register`, con `window.alert` espiado, "Google" llama `alert('Próximamente')` y la URL sigue en `/register`

### Implementation for User Story 7

- [X] T050 [US7] En `src/ui/features/register/RegisterForm.tsx`, implementar `onComingSoon` con valor por defecto `(message) => window.alert(message)` y conectarlo a los `SocialButton` Google y Apple con `MESSAGES.COMING_SOON` (research.md R8; hace pasar T048, T049)

**Checkpoint**: Todas las historias completas; quickstart paso 9

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Contraste WCAG AA, accesibilidad global, documentación y controles de cumplimiento

- [X] T051 [P] Ampliar `src/App.test.tsx` con auditorías `expectNoA11yViolations`: `/register` vacío; `/register` tras enviar vacío (errores visibles) y con el aviso de términos; `/login` con el aviso de éxito (FR-019, SC-006)
- [X] T052 [P] Ampliar `src/ui/features/register/RegisterForm.test.tsx` con FR-018: orden de tabulación de contracts/ui-register.md (nombre → correo → contraseña → "Mostrar contraseña" → confirmación → "Mostrar contraseña" → casilla → "términos y condiciones" → "Crear cuenta" → "Google" → "Apple" → "Inicia sesión")
- [X] T053 Aplicar el contraste de research.md R13: verificar que `RegisterForm.module.css` y los componentes usan `--brand-700` en el botón principal y los enlaces, `--neutral-600` en subtítulo, separador, pie y placeholders, `--neutral-border` en bordes de campos, casilla y botones sociales, y `--danger-600` en errores (sin literales de color de Figma). Panel de marca: la capa `--brand-scrim` se implementó y se retiró el 2026-10-20 (franja rechazada por diseño); el texto queda bajo excepción temporal 9.1 que vence el 2027-01-17 (research.md R13)
- [X] T054 [P] Actualizar `README.md`: título y descripción para cubrir login y registro; enlaces a `specs/002-registro-billetera/` y al frame de Figma `04 · Registro` (https://www.figma.com/design/6xNmoI41kvegTfeFfgGgcs/Billetera-Virtual---Prototipos--copia-?node-id=31-2); rutas `/login` y `/register`; el registro es simulado y no guarda la cuenta (no sirve para iniciar sesión); `SimulatedRegistrationGateway` y `features/register/` en la sección de arquitectura; nota de despliegue: el servidor estático debe redirigir rutas desconocidas a `index.html` (research.md R4); en notas de diseño, el contraste corregido del panel de marca (R13) y la alerta nativa "Próximamente"; sección "Registro de eventos" con el formato JSON de `ConsoleJsonLogger`, los eventos `registration.*` y la garantía de que no incluyen datos personales (R14); indicar que `specs/*/research.md` cumple la función de ADR
- [X] T055 [P] Cambiar el `<title>` inicial de `index.html` a "KynWallet" (App lo ajusta por ruta, research.md R11)
- [X] T056 Ejecutar `npm run verify` y corregir hasta que pasen lint, formato, tipos, pruebas con cobertura ≥ 80 %, build, auditorías y escaneo de secretos (Constitución 9.4)
- [X] T057 Ejecutar la validación manual completa de `specs/002-registro-billetera/quickstart.md` (pasos 1–19), incluida la medición de contraste del panel de marca (paso 18) y la revisión de los eventos en la consola (paso 19) y la comparación visual con el frame `04 · Registro` (SC-007)


---

## Phase 11: Follow-up — Correcciones posteriores a la implementación (2026-10-20)

- [X] T058 Corregir el desfase vertical del panel de marca entre `/login` y `/register` en ventanas de escritorio de menos de ~776px de alto: el formulario de registro estiraba la columna del panel y su `justify-content: space-between` bajaba el titular y la tarjeta. En `src/ui/layout/BrandPanel/BrandPanel.module.css` (≥ 960px), el panel pasa a `position: sticky; top: 0; align-self: start` con `min-height: 100dvh`, de modo que su alto no depende del formulario. Verificado midiendo en el navegador (Edge headless, 1440 × 1024/900/800/700/600): titular y tarjeta en la misma posición en ambas pantallas. jsdom no calcula diseño, por lo que la prueba de regresión es manual (quickstart paso 20); la prueba de regresión automática se agregó en T059
- [X] T059 Agregar pruebas en navegador real con `@playwright/test@1.64.1` (research.md R15): `playwright.config.ts` (Chromium, Vite en el puerto 4174), `e2e/brand-panel.spec.ts` (regresión de T058: misma posición del titular y la tarjeta en login y registro a 1440 × 1024/800/700/600 y panel fijo al desplazar; verificado que falla sin el arreglo) y `e2e/register.spec.ts` (US5-1 a US5-4, US7 alerta nativa, US1 registro completo con evento sin datos personales); script `test:e2e` incluido en `verify`; Vitest limitado a `src/**/*.test.{ts,tsx}`; `test-results/` y `playwright-report/` ignorados en git, ESLint y Prettier
---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup. BLOQUEA todas las historias.
- **US1 (Phase 3)**: depende de Foundational. Crea `RegisterForm`, `registerReducer`, `useRegisterForm` y las rutas en `App`, que usan las demás historias.
- **US2, US3 (Phases 4–5)**: dependen de US1 (amplían el mismo formulario). Pueden hacerse en cualquier orden entre sí, pero ambas tocan `RegisterForm.tsx`: hacerlas en secuencia.
- **US4 (Phase 6)**: depende de US1 (rutas en `App`).
- **US5 (Phase 7)**: depende de US1.
- **US6, US7 (Phases 8–9)**: dependen de US1; independientes entre sí y de US2–US5.
- **Polish (Phase 10)**: depende de todas las historias que se vayan a entregar.

### Within Each User Story

- Las pruebas se escriben primero y DEBEN fallar antes de implementar (Constitución 1.1).
- Reducer → hook → componente → integración en `App`.
- La historia se completa antes de pasar a la siguiente prioridad.

### Dependencias puntuales

- T009 ← T007, T008 · T010 ← T009 · T011 ← T009, T010 · T012 ← T011 · T013 ← T005, T010 · T018 ← T016, T017
- T024 ← T023 · T025 ← T024 · T028 ← T015, T016, T025, T027 · T029 ← T011, T012, T013, T028
- T036 ← T034 · T037 ← T036 · T042 ← T041 · T050 ← T048
- T053 ← T026, T036 · T056 ← todo lo anterior · T057 ← T056

### Parallel Opportunities

- Phase 2: T002, T003, T004, T005 y T006 (pruebas en archivos distintos); luego, hecho T009: T010, T014 y T015 en paralelo; después T011 → T012, y T013 en paralelo con ellos.
- US1: T019–T022 en paralelo; T026 (CSS) en paralelo con T023–T025.
- US2 y US3: sus pruebas sobre reducer y `Checkbox` (T030, T034) en paralelo.
- US6 y US7 pueden desarrollarse en paralelo después de US1 (solo comparten el archivo de pruebas; coordinar los `describe`).
- Polish: T051, T052, T054 y T055 en paralelo.

---

## Parallel Example: Phase 2

```bash
# Pruebas de cimientos en paralelo:
Task: "T002 Escribir src/domain/registration.test.ts"
Task: "T003 Escribir src/application/register.test.ts"
Task: "T004 Escribir src/infrastructure/SimulatedRegistrationGateway.test.ts"
Task: "T005 Escribir src/infrastructure/ConsoleJsonLogger.test.ts"
Task: "T006 Escribir src/ui/navigation/useNavigation.test.ts"
```

## Parallel Example: User Story 1

```bash
# Pruebas de US1 en paralelo:
Task: "T019 registerReducer.test.ts"
Task: "T020 RegisterForm.test.tsx (US1)"
Task: "T021 App.test.tsx (rutas y registro)"
Task: "T022 LoginForm.test.tsx (successNotice)"

# Estilos en paralelo con la lógica:
Task: "T026 RegisterForm.module.css"
```

---

## Implementation Strategy

### MVP First (User Stories 1–3, las tres P1)

1. Phase 1 (Setup) y Phase 2 (Foundational).
2. Phase 3 (US1): **PARAR y VALIDAR** el registro feliz de punta a punta.
3. Phases 4–5 (US2, US3): validación inline y términos. Ninguna P1 es opcional según la spec.
4. Demo del MVP: quickstart pasos 2–8 y 11–12.

### Incremental Delivery

1. Foundation → US1 → validar → demo del flujo feliz.
2. US2 + US3 → validar → MVP completo (P1).
3. US4 + US5 (P2) → navegación en ambos sentidos y responsive.
4. US6 + US7 (P3) → conveniencias y fidelidad al diseño.
5. Polish → contraste, accesibilidad, README, `npm run verify` y PR.

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes.
- [Story] mapea la tarea a la historia de spec.md para trazabilidad.
- Las tareas que modifican código de 001 (T008, T013 en `eslint.config.js`, T016, T017, T022, T027, T038, T041) no deben romper pruebas existentes salvo los cambios de comportamiento pedidos por la spec (T038).
- Commit después de cada tarea o grupo lógico, con referencia a la tarea (`T023`) y a la historia (Constitución 9.2).
- Evitar: tareas vagas, conflictos en el mismo archivo y dependencias entre historias que rompan su independencia.

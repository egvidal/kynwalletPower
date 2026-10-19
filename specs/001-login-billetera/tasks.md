---

description: "Task list for 001-login-billetera"
---

# Tasks: Pantalla de Inicio de Sesión de KynWallet

**Input**: Design documents from `/specs/001-login-billetera/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-login.md,
contracts/auth-gateway.md, quickstart.md

**Tests**: OBLIGATORIAS. La Constitución (Principio I, TDD) exige escribir las pruebas antes
del código, y verlas fallar. Cada historia empieza por sus pruebas.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Rutas relativas a la raíz del repositorio. Las pruebas viven junto al código (`*.test.ts(x)`).
- Trazabilidad (Constitución 9.2): cada `it(...)` DEBE empezar con el ID del escenario o
  requisito que verifica, p. ej. `it('US2-1: muestra error genérico…')`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar el proyecto React + TypeScript + Vite y las herramientas de calidad

- [X] T001 Inicializar git en la raíz (`git init`) y crear `.gitignore` con `node_modules/`, `dist/`, `coverage/`, `.env.local`, `.env.*.local`, conservando `.specify/` y `specs/` versionados (Constitución 9.3)
- [X] T002 Crear `package.json` (`"type": "module"`, `"private": true`, `engines.node >=20`), `index.html` (`lang="es"`, `<title>KynWallet · Iniciar sesión</title>`, `<div id="root">`), `tsconfig.json` (`strict: true`, `noUncheckedIndexedAccess: true`, `jsx: react-jsx`, alias `@/` → `src/`) y `vite.config.ts` con `@vitejs/plugin-react` en la raíz del repositorio (manualmente, sin `npm create vite`, porque el directorio no está vacío)
- [X] T003 Instalar dependencias según research.md R1/R2/R8: `react@19`, `react-dom@19`, `@fontsource-variable/inter`; dev: `vite@7`, `@vitejs/plugin-react`, `typescript@5`, `@types/react`, `@types/react-dom`, `vitest@3`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `vitest-axe`, `eslint@9`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `prettier`, `secretlint`, `@secretlint/secretlint-rule-preset-recommend`, `license-checker-rseidelsohn`; confirmar que no hay vulnerabilidades altas o críticas (`npm audit --audit-level=high`)
- [X] T004 [P] Configurar ESLint flat config en `eslint.config.js` con `typescript-eslint` (strict), `react-hooks`, `jsx-a11y` (recommended) y reglas `no-restricted-imports` por capa: `src/domain/**` no puede importar `react`, `@/application`, `@/infrastructure` ni `@/ui`; `src/application/**` solo puede importar `@/domain`; `src/ui/**` no puede importar `@/infrastructure` (Constitución 3.2, 3.5); además `no-console: error`
- [X] T005 [P] Configurar Prettier en `.prettierrc.json` (`singleQuote: true`, `printWidth: 100`) y `.prettierignore` (`dist`, `coverage`, `specs`, `.specify`)
- [X] T006 [P] Configurar Vitest dentro de `vite.config.ts` (`environment: 'jsdom'`, `globals: true`, `setupFiles: ['src/test/setup.ts']`, `css.modules.classNameStrategy: 'non-scoped'`, cobertura v8 sobre `src/**` excluyendo `src/main.tsx`, `src/test/**` y `**/*.d.ts`, con `thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 }`) y crear `src/test/setup.ts`, que importa `@testing-library/jest-dom/vitest` y extiende `expect` con los matchers de `vitest-axe`
- [X] T007 [P] Crear `.env.example` con `VITE_DEMO_USERS=[{"email":"demo@example.com","password":"CAMBIAR-EN-.env.local","displayName":"Nombre Ejemplo"}]` y un comentario indicando copiarlo a `.env.local` y usar solo cuentas ficticias; crear `src/vite-env.d.ts` que tipa `ImportMetaEnv.VITE_DEMO_USERS?: string`
- [X] T008 [P] Crear `.secretlintrc.json` (preset recommend) y `.secretlintignore` (`node_modules`, `dist`, `coverage`)
- [X] T009 Definir los scripts npm en `package.json`: `dev`, `build` (`tsc --noEmit && vite build`), `preview`, `lint` (`eslint .`), `format` (`prettier --check .`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:watch`, `test:coverage` (`vitest run --coverage`), `audit:deps` (`npm audit --audit-level=high`), `audit:licenses` (`license-checker-rseidelsohn --production --onlyAllow "MIT;ISC;BSD-2-Clause;BSD-3-Clause;Apache-2.0;0BSD;OFL-1.1;CC0-1.0;BlueOak-1.0.0"`), `scan:secrets` (`secretlint "**/*"`) y `verify`, que ejecuta en secuencia lint, format, typecheck, test:coverage, build, audit:deps, audit:licenses y scan:secrets (research.md R9)

**Checkpoint**: `npm run lint`, `npm run typecheck` y `npm test` (sin pruebas, `--passWithNoTests`) terminan sin errores

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tokens, tipos de dominio, puerto y componentes base que todas las historias usan

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T010 [P] Crear `src/ui/styles/tokens.css` con las variables de Figma en `:root`: `--neutral-0: #ffffff`, `--neutral-300: #d7d9e6`, `--neutral-400: #a9abc2`, `--neutral-500: #8a8ca8`, `--neutral-700: #3d3f5c`, `--neutral-900: #16182c`, `--brand-500: #ff6b3d`, `--brand-600: #ef5226`; los tokens accesibles de research.md R3: `--brand-700: #d04721`, `--neutral-600: #73748b`, `--neutral-border: #92949c`; el degradado `--brand-gradient: linear-gradient(121.19deg, #ff8a65 0%, #ef5226 70.71%)`; radios `--radius-control: 12px`, `--radius-card: 22px`, `--radius-checkbox: 6px`; alturas `--control-height: 52px`, `--social-height: 48px`; `--focus-ring: 0 0 0 2px var(--neutral-0), 0 0 0 4px var(--neutral-900)`; y colores de error `--danger-600: #c62828` (contraste ≥ 4.5:1 sobre blanco)
- [X] T011 [P] Crear `src/ui/styles/global.css`: importar `@fontsource-variable/inter`, `font-family: 'Inter Variable', system-ui, sans-serif`, `box-sizing: border-box` global, `margin: 0` en `body`, `min-height: 100dvh`, fondo `var(--neutral-0)`, estilo `:focus-visible { outline: none; box-shadow: var(--focus-ring); }` y la clase utilitaria `.visually-hidden`
- [X] T012 [P] Descargar a `src/ui/assets/` con `curl -L` los SVG del diseño obtenidos con el MCP de Figma `get_design_context` sobre el nodo `2:2` del archivo `f7uDsv8sh6ZOtK2OitTqtg`: logo (`logo-mark.svg`, 20×44), icono de visibilidad (`eye.svg`, 20×12) e icono social (`social-placeholder.svg`, 20×20). Las URL temporales caducan a los 7 días: volver a ejecutar `get_design_context` si fallan. No sustituir los marcadores de posición por logotipos de marca (research.md R11)
- [X] T013 [P] Crear los tipos de dominio en `src/domain/auth.ts` según contracts/auth-gateway.md: `LoginCredentials = { email: string; password: string }`, `AuthResult` (unión `success` con `displayName`, `invalid-credentials`, `unavailable`) y `DemoAccount = { email: string; password: string; displayName: string }`
- [X] T014 [P] Crear `src/domain/messages.ts` como fuente única de textos (Principio IV): `EMAIL_REQUIRED: 'Ingresa tu correo electrónico'`, `EMAIL_INVALID: 'Ingresa un correo electrónico válido'`, `PASSWORD_REQUIRED: 'Ingresa tu contraseña'`, `PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres'`, `PASSWORD_TOO_LONG: 'La contraseña no puede superar 128 caracteres'`, `INVALID_CREDENTIALS: 'Correo o contraseña incorrectos'`, `UNAVAILABLE: 'Servicio de acceso no disponible. Intenta más tarde.'`, `FEATURE_UNAVAILABLE: 'Función no disponible en esta demostración'`
- [X] T015 [P] Crear el puerto `src/application/ports/AuthGateway.ts` con `authenticate(credentials: LoginCredentials): Promise<AuthResult>` (contracts/auth-gateway.md)
- [X] T016 [P] Escribir las pruebas (que deben fallar) de `Button` en `src/ui/components/Button/Button.test.tsx`: renderiza su texto como `button`; variante `primary` y `secondary`; con `loading` tiene `aria-busy="true"`, está deshabilitado y muestra `loadingLabel`; `type` por defecto `button`; sin violaciones de `axe`
- [X] T017 [P] Escribir las pruebas (que deben fallar) de `TextField` en `src/ui/components/TextField/TextField.test.tsx`: la etiqueta se asocia al input (`getByLabelText`); propaga `type`, `autoComplete`, `placeholder`, `value`, `onChange`, `onBlur`; acepta un `ref` (forwardRef) y un slot `endAdornment`; sin violaciones de `axe`
- [X] T018 Implementar `src/ui/components/Button/Button.tsx` y `Button.module.css` hasta pasar T016: `primary` con fondo `var(--brand-700)`, texto blanco 16px SemiBold, alto 52px, radio 12px, ancho 100 %; `secondary` con fondo blanco, borde 1.5px `var(--neutral-border)`, texto `var(--neutral-900)` 15px SemiBold, alto 48px; estados hover, disabled y `:focus-visible`
- [X] T019 Implementar `src/ui/components/TextField/TextField.tsx` y `TextField.module.css` hasta pasar T017: etiqueta 14px Medium `var(--neutral-700)`, gap 8px; contenedor de 52px de alto, borde 1.5px `var(--neutral-border)`, radio 12px, padding horizontal 16px; texto 15px; placeholder `var(--neutral-600)`
- [X] T020 [P] Crear `src/ui/layout/BrandPanel/BrandPanel.tsx` y `BrandPanel.module.css` según Figma (nodo `2:3`): fondo `var(--brand-gradient)`, padding 64px 56px, columna con `justify-content: space-between`; logo (`logo-mark.svg` + "KynWallet" 26px Bold, gap 12px); titular "Tu dinero, sin fronteras." 44px Bold con line-height 1.08 y salto tras la coma; texto "Envía, recibe y paga en segundos. Una billetera pensada para tu día a día." 17px con line-height 1.5, color `rgba(255,255,255,.85)`, gap 18px; tarjeta decorativa `aria-hidden="true"` de 360×210, fondo `rgba(255,255,255,.16)`, borde `rgba(255,255,255,.35)`, radio 22px, padding 24px 26px, con "Kyn Card" 15px SemiBold, chip 38×28 `rgba(255,217,128,.9)` radio 6px, "5294  ••••  ••••  4827" 20px Medium tracking 1px, y "STEVEN LUNA"/"12/29" 13px Medium. Por debajo de 960px solo se muestra el logo (research.md R10)
- [X] T021 Crear `src/ui/features/login/LoginScreen.tsx` y `LoginScreen.module.css`: `<main>` en dos columnas desde 960px (`BrandPanel` de 620px desde 1280px, 43 % entre 960 y 1280px; panel de formulario blanco con contenido centrado de máx. 400px de ancho); por debajo de 960px, una columna con el `BrandPanel` reducido arriba; padding lateral de 16px por debajo de 480px; sin scroll horizontal desde 320px (FR-018). Recibe por props el contenido del panel derecho
- [X] T022 Crear `src/App.tsx` y `src/main.tsx` provisionales: `main.tsx` importa `global.css` y `tokens.css` y renderiza `<App />` en `StrictMode`; `App` muestra `LoginScreen` con un contenido provisional

**Checkpoint**: `npm run dev` muestra el panel de marca y el layout responsivo; las pruebas de Button y TextField pasan

---

## Phase 3: User Story 1 - Iniciar sesión con credenciales válidas (Priority: P1) 🎯 MVP

**Goal**: con una cuenta de demostración válida, el usuario ve la vista "¡Bienvenido, {nombre}!" y puede cerrar sesión

**Independent Test**: definir una cuenta en `.env.local`, ingresar sus credenciales, ver el estado de carga y luego la bienvenida; "Cerrar sesión" vuelve al formulario vacío (quickstart escenarios 1–3)

### Tests for User Story 1 ⚠️

> Escribir primero; confirmar que FALLAN antes de implementar

- [X] T023 [P] [US1] Pruebas de `normalizeEmail` en `src/domain/validation.test.ts`: recorta espacios periféricos y convierte a minúsculas (`'  Demo@Example.COM '` → `'demo@example.com'`); no altera el interior
- [X] T024 [P] [US1] Pruebas de contrato de `InMemoryAuthGateway` en `src/infrastructure/InMemoryAuthGateway.test.ts` (contracts/auth-gateway.md): C1 correo en mayúsculas y con espacios + contraseña exacta → `{ kind: 'success', displayName }`; C4 `accounts === null` → `unavailable`; C5 una excepción interna → `unavailable` sin rechazar la promesa; C6 el resultado nunca contiene la contraseña; espera configurable: con `delayMs: 1000` y `vi.useFakeTimers()` no resuelve antes de 1000 ms
- [X] T025 [P] [US1] Pruebas de `loadDemoAccounts` en `src/infrastructure/loadDemoAccounts.test.ts`: JSON válido → cuentas con el correo normalizado; devuelve `null` si `raw` es `undefined` o vacío, si el JSON es inválido, si no es un arreglo, si el arreglo está vacío, si una cuenta incumple las reglas de data-model.md ("email: obligatorio, formato válido"; "password: obligatorio, 8–128 caracteres"; "displayName: obligatorio, 1–80 caracteres") o si hay correos duplicados ("los correos repetidos invalidan la configuración")
- [X] T026 [P] [US1] Pruebas del caso de uso en `src/application/authenticate.test.ts`: delega en un `AuthGateway` falso las credenciales con el correo normalizado y la contraseña sin modificar, y devuelve su resultado; si el gateway lanza una excepción, devuelve `unavailable`
- [X] T027 [P] [US1] Pruebas del reducer en `src/ui/features/login/loginReducer.test.ts` (data-model.md LoginFormState): estado inicial `editing` con valores vacíos; `submit` → `submitting`; un segundo `submit` en `submitting` se ignora (FR-008); `success` → `welcome` con `welcomeName`; `logout` → estado inicial
- [X] T028 [P] [US1] Pruebas de `WelcomeView` en `src/ui/features/login/WelcomeView.test.tsx`: `heading` nivel 1 "¡Bienvenido, Steven Luna!" con el foco al montar (FR-009); el `button` "Cerrar sesión" llama a `onLogout`; sin violaciones de `axe`
- [X] T029 [US1] Pruebas de integración en `src/ui/features/login/LoginForm.test.tsx` con un gateway falso inyectado y `user-event`: US1-1 credenciales válidas → bienvenida con el nombre; US1-2 durante la espera el botón tiene `aria-busy`, está deshabilitado y un segundo clic no invoca de nuevo el gateway; US1-3 un correo con mayúsculas y espacios autentica; US1-4 Enter en la contraseña envía; US1-5 "Cerrar sesión" vuelve con los campos vacíos

### Implementation for User Story 1

- [X] T030 [P] [US1] Implementar `normalizeEmail` en `src/domain/validation.ts` hasta pasar T023
- [X] T031 [P] [US1] Implementar `src/infrastructure/InMemoryAuthGateway.ts` hasta pasar T024: constructor `(accounts: DemoAccount[] | null, options?: { delayMs?: number })` con `delayMs` por defecto 1000; compara el correo normalizado y la contraseña exacta; captura cualquier excepción y devuelve `unavailable`; sin `console` ni registro de la contraseña (FR-012)
- [X] T032 [P] [US1] Implementar `src/infrastructure/loadDemoAccounts.ts` hasta pasar T025, sin registrar ni exponer los valores leídos
- [X] T033 [US1] Implementar `src/application/authenticate.ts` hasta pasar T026: `createAuthenticate(gateway: AuthGateway) => (c: LoginCredentials) => Promise<AuthResult>`
- [X] T034 [US1] Implementar `src/ui/features/login/loginReducer.ts` hasta pasar T027, con el tipo de estado y las acciones de data-model.md (`status`, `values`, `touched`, `fieldErrors`, `authError`, `welcomeName`, `rememberMe`, `passwordVisible`, `notice`)
- [X] T035 [US1] Implementar el hook `src/ui/features/login/useLoginForm.ts`: envuelve `useReducer`; `submit` despacha `submit`, llama al caso de uso inyectado y despacha el resultado; ignora resultados si el componente se desmonta
- [X] T036 [US1] Implementar `src/ui/features/login/WelcomeView.tsx` y `WelcomeView.module.css` hasta pasar T028 (título 30px Bold `var(--neutral-900)`, `tabIndex={-1}`, foco con `useEffect`; botón primary "Cerrar sesión")
- [X] T037 [US1] Implementar `src/ui/features/login/LoginForm.tsx` y `LoginForm.module.css` hasta pasar T029: `<form noValidate>` con gap 22px; encabezado `h1` "Bienvenido de nuevo" (30px Bold `var(--neutral-900)`) y subtítulo "Ingresa a tu cuenta para continuar" (16px `var(--neutral-600)`), gap 8px; `TextField` "Correo electrónico" (`type="email"`, `autoComplete="username"`, placeholder "tucorreo@ejemplo.com"); `TextField` "Contraseña" (`type="password"`, `autoComplete="current-password"`); `Button` primary `type="submit"` "Iniciar sesión" con `loadingLabel` "Iniciando sesión…". Si `status === 'welcome'`, renderiza `WelcomeView`
- [X] T038 [US1] Conectar la raíz de composición en `src/main.tsx` y `src/App.tsx`: `loadDemoAccounts(import.meta.env.VITE_DEMO_USERS)` → `new InMemoryAuthGateway(accounts)` → `createAuthenticate(gateway)`, pasado por props a `LoginForm` dentro de `LoginScreen` (Constitución 2.5); `App` recibe el caso de uso por props para poder probarlo

**Checkpoint**: la historia US1 funciona de punta a punta con `npm run dev` y sus pruebas pasan

---

## Phase 4: User Story 2 - Retroalimentación ante credenciales incorrectas (Priority: P1)

**Goal**: ante credenciales incorrectas se muestra un único mensaje genérico, se conserva el correo y se facilita el reintento

**Independent Test**: enviar un correo válido con una contraseña incorrecta y luego un correo inexistente; ambos muestran "Correo o contraseña incorrectos" (quickstart escenarios 4, 5 y 11)

### Tests for User Story 2 ⚠️

- [X] T039 [P] [US2] Ampliar `src/infrastructure/InMemoryAuthGateway.test.ts` con C2 (contraseña incorrecta, incluyendo diferencias de mayúsculas o espacios → `invalid-credentials`) y C3 (correo inexistente → resultado idéntico a C2)
- [X] T040 [P] [US2] Ampliar `src/ui/features/login/loginReducer.test.ts`: `invalid-credentials` → `authError` con el correo conservado y la contraseña vacía; `unavailable` → `authError: 'unavailable'`; editar cualquier campo en `authError` → `editing` con `authError: null`
- [X] T041 [P] [US2] Pruebas de `Alert` en `src/ui/components/Alert/Alert.test.tsx`: con `tone="error"` usa `role="alert"`; con `tone="info"` usa `role="status"`; sin violaciones de `axe`
- [X] T042 [US2] Ampliar `src/ui/features/login/LoginForm.test.tsx`: US2-1 la contraseña incorrecta muestra `alert` "Correo o contraseña incorrectos" sin bienvenida; US2-2 un correo inexistente muestra exactamente el mismo texto; US2-3 editar un campo oculta el error; US2-4 el correo se conserva, la contraseña queda vacía y con el foco; caso límite: un gateway que devuelve `unavailable` muestra "Servicio de acceso no disponible. Intenta más tarde."

### Implementation for User Story 2

- [X] T043 [P] [US2] Ajustar `src/infrastructure/InMemoryAuthGateway.ts` si hace falta para pasar T039 (sin ramas que distingan correo inexistente de contraseña incorrecta)
- [X] T044 [P] [US2] Implementar `src/ui/components/Alert/Alert.tsx` y `Alert.module.css` hasta pasar T041: `error` con texto `var(--danger-600)` y fondo tenue; `info` con texto `var(--neutral-900)`; 14px; radio 12px
- [X] T045 [US2] Ampliar `src/ui/features/login/loginReducer.ts` hasta pasar T040
- [X] T046 [US2] Ampliar `src/ui/features/login/LoginForm.tsx` hasta pasar T042: renderiza `Alert` de error con `INVALID_CREDENTIALS` o `UNAVAILABLE` de `src/domain/messages.ts` encima del botón; tras `invalid-credentials`, mueve el foco a la contraseña con un `ref`

**Checkpoint**: US1 y US2 funcionan y se prueban de forma independiente

---

## Phase 5: User Story 3 - Validar los campos antes de enviar (Priority: P2)

**Goal**: el formulario indica qué falta o está mal antes de intentar autenticar

**Independent Test**: enviar vacío, con "usuario@" y con una contraseña de 7 caracteres; se ven los mensajes por campo y no se invoca el gateway (quickstart escenarios 6–8)

### Tests for User Story 3 ⚠️

- [X] T047 [P] [US3] Ampliar `src/domain/validation.test.ts` con `validateCredentials` según data-model.md: correo vacío tras trim → "Ingresa tu correo electrónico"; correos que no cumplen `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$` (`'usuario@'`, `'usuario.com'`, `'a@b.c'`) → "Ingresa un correo electrónico válido"; correo de "> 254 caracteres" → "Ingresa un correo electrónico válido"; contraseña vacía → "Ingresa tu contraseña"; "< 8 caracteres" → "La contraseña debe tener al menos 8 caracteres"; "> 128 caracteres" → "La contraseña no puede superar 128 caracteres"; la contraseña con espacios no se recorta; credenciales válidas → `{}`
- [X] T048 [P] [US3] Ampliar `src/ui/features/login/loginReducer.test.ts`: `blur` marca el campo como tocado y calcula su error; `submit` con errores marca ambos como tocados, queda en `editing` y no pasa a `submitting` (FR-006); `change` en un campo con error recalcula y oculta el error si es válido (FR-005)
- [X] T049 [P] [US3] Ampliar `src/ui/components/TextField/TextField.test.tsx`: con `error` el input tiene `aria-invalid="true"` y `aria-describedby` apunta al texto del error, que se muestra bajo el campo
- [X] T050 [US3] Ampliar `src/ui/features/login/LoginForm.test.tsx`: US3-1 envío vacío → ambos mensajes, gateway no invocado y foco en el correo; US3-2 "usuario@" + blur → mensaje de correo válido; US3-3 contraseña de 7 caracteres → mensaje de longitud y gateway no invocado; US3-4 corregir oculta el mensaje; US3-5 el nombre accesible o la descripción del campo incluye el error; caso límite: el texto pegado se valida igual que el escrito

### Implementation for User Story 3

- [X] T051 [US3] Implementar `validateCredentials` en `src/domain/validation.ts` hasta pasar T047, usando los textos de `src/domain/messages.ts`
- [X] T052 [P] [US3] Ampliar `src/ui/components/TextField/TextField.tsx` y su CSS hasta pasar T049: prop `error?: string`, id del error con `useId`, borde y texto de error en `var(--danger-600)` 13px
- [X] T053 [US3] Ampliar `src/ui/features/login/loginReducer.ts` hasta pasar T048, usando `validateCredentials`
- [X] T054 [US3] Ampliar `src/ui/features/login/LoginForm.tsx` hasta pasar T050: `onBlur` en los campos, `error` a cada `TextField`, foco en el primer campo con error al enviar

**Checkpoint**: US1, US2 y US3 funcionan de forma independiente

---

## Phase 6: User Story 4 - Mostrar u ocultar la contraseña (Priority: P3)

**Goal**: el usuario puede ver temporalmente la contraseña

**Independent Test**: escribir una contraseña y alternar el control de visibilidad con ratón y teclado (quickstart escenario 9)

### Tests for User Story 4 ⚠️

- [X] T055 [P] [US4] Pruebas de `PasswordField` en `src/ui/components/PasswordField/PasswordField.test.tsx`: US4-1 por defecto `type="password"` y el botón "Mostrar contraseña" con `aria-pressed="false"`; al activarlo, `type="text"` y "Ocultar contraseña" con `aria-pressed="true"`; US4-2 se vuelve a ocultar; US4-3 alcanzable con Tab y activable con Enter/Espacio; propaga `error`, `ref` y `autoComplete`; sin violaciones de `axe`

### Implementation for User Story 4

- [X] T056 [US4] Implementar `src/ui/components/PasswordField/PasswordField.tsx` y su CSS hasta pasar T055, componiendo `TextField` con `endAdornment` = `<button type="button">` que contiene `eye.svg` (20×12, `alt=""`) y su nombre accesible
- [X] T057 [US4] Reemplazar en `src/ui/features/login/LoginForm.tsx` el `TextField` de contraseña por `PasswordField` y verificar que las pruebas de US1–US3 siguen pasando

**Checkpoint**: US4 funciona sin romper las historias anteriores

---

## Phase 7: User Story 5 - Elementos del diseño fuera de alcance (Priority: P3)

**Goal**: fidelidad completa al diseño; los elementos sin funcionalidad avisan que no están disponibles

**Independent Test**: activar "¿Olvidaste tu contraseña?", Google, Apple y "Regístrate" y ver el aviso; marcar "Recordarme" sin efectos (quickstart escenario 10)

### Tests for User Story 5 ⚠️

- [X] T058 [P] [US5] Pruebas de `Checkbox` en `src/ui/components/Checkbox/Checkbox.test.tsx`: `checkbox` con la etiqueta "Recordarme", alterna `checked`; sin violaciones de `axe`
- [X] T059 [P] [US5] Pruebas de `SocialButton` en `src/ui/components/SocialButton/SocialButton.test.tsx`: `button` con el nombre del proveedor e icono decorativo (`alt=""`); llama a `onClick`
- [X] T060 [P] [US5] Pruebas de `Divider` en `src/ui/components/Divider/Divider.test.tsx`: muestra "o continúa con"; las líneas son decorativas
- [X] T061 [US5] Ampliar `src/ui/features/login/LoginForm.test.tsx`: US5-1 cada uno de "¿Olvidaste tu contraseña?", "Google", "Apple" y "Regístrate" muestra `status` "Función no disponible en esta demostración" y conserva los valores ingresados; US5-2 "Recordarme" cambia de estado sin escribir en `localStorage` ni `sessionStorage` (espiar `Storage.prototype.setItem`); orden de tabulación según contracts/ui-login.md

### Implementation for User Story 5

- [X] T062 [P] [US5] Implementar `src/ui/components/Checkbox/Checkbox.tsx` y su CSS hasta pasar T058: input nativo con apariencia de casilla de 20×20, borde 1.5px `var(--neutral-border)`, radio 6px; marcado con fondo `var(--brand-700)`; etiqueta 14px Medium `var(--neutral-700)`, gap 8px
- [X] T063 [P] [US5] Implementar `src/ui/components/SocialButton/SocialButton.tsx` hasta pasar T059, reutilizando `Button` variante `secondary` con `social-placeholder.svg` (20×20) y gap 8px
- [X] T064 [P] [US5] Implementar `src/ui/components/Divider/Divider.tsx` y su CSS hasta pasar T060: dos líneas de 1px `var(--neutral-300)` con flex 1, gap 14px, texto 13px `var(--neutral-600)`
- [X] T065 [US5] Ampliar `src/ui/features/login/LoginForm.tsx` y `loginReducer.ts` hasta pasar T061, siguiendo el orden de Figma: fila de opciones (Checkbox "Recordarme" + botón-enlace "¿Olvidaste tu contraseña?" 14px SemiBold `var(--brand-700)`, `justify-content: space-between`) entre la contraseña y "Iniciar sesión"; luego `Divider`; fila social (Google, Apple; gap 12px; mitades iguales); pie centrado "¿No tienes cuenta?" (14px `var(--neutral-600)`) + botón-enlace "Regístrate" (14px SemiBold `var(--brand-700)`), gap 5px; `Alert` `info` con `FEATURE_UNAVAILABLE`

**Checkpoint**: todas las historias funcionan de forma independiente; la pantalla coincide con el diseño

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: accesibilidad global, documentación y controles de cumplimiento

- [X] T066 [P] Prueba de accesibilidad de la pantalla completa en `src/App.test.tsx`: renderizar `App` con un caso de uso falso y comprobar que no hay violaciones de `axe` en la vista de login, con errores visibles y en la vista de bienvenida (FR-015, SC-005)
- [X] T067 [P] Prueba de seguridad en `src/ui/features/login/LoginForm.test.tsx`: tras un intento fallido y uno exitoso, la contraseña no aparece en `document.body.textContent`, `window.location.href` ni en llamadas a `console.*` o `Storage.prototype.setItem` (FR-012)
- [X] T068 [P] Escribir `README.md` en la raíz: descripción, requisitos (Node ≥ 20), configuración de `.env.local` con la advertencia del bundle, scripts (`dev`, `build`, `preview`, `test`, `verify`), estructura por capas, enlace a `specs/001-login-billetera/` y nota sobre las desviaciones de color pendientes de aprobación (Constitución 8.3)
- [X] T069 Verificar el diseño responsivo con `npm run dev` a 320, 480, 960, 1280 y 1440px: sin scroll horizontal, logo siempre visible y distribución de dos columnas fiel a Figma desde 1280px (FR-018); corregir `src/ui/features/login/LoginScreen.module.css` y `src/ui/layout/BrandPanel/BrandPanel.module.css` si hace falta
- [X] T070 Comparar visualmente la pantalla a 1440×1024 con la captura de Figma (`get_screenshot` del nodo `2:2`): textos, orden, espaciados, radios y tipografía (SC-006); las únicas diferencias admitidas son los tokens accesibles de research.md R3
- [X] T071 Ejecutar `npm run verify` y corregir hasta que todos los controles pasen (lint, format, typecheck, cobertura ≥ 80 %, build, audit:deps, audit:licenses, scan:secrets) (Constitución 9.4, SC-003, SC-007)
- [X] T072 Recorrer los 13 escenarios de `specs/001-login-billetera/quickstart.md` y anotar el resultado; cualquier fallo vuelve a la tarea de la historia correspondiente

---

## Phase 9: Follow-up — Registro de eventos (detectado en `/speckit-analyze` de 002, 2026-10-19)

**Purpose**: Corregir el incumplimiento de la Constitución 5.5 y 8.7: el login no registra los intentos de autenticación. Depende del puerto `Logger` y del adaptador `ConsoleJsonLogger` creados en `specs/002-registro-billetera/tasks.md` (T010, T013); ver `specs/002-registro-billetera/research.md` R14.

- [X] T073 Registrar los intentos de inicio de sesión como eventos estructurados, con TDD: (1) primero ampliar `src/application/authenticate.test.ts` con un logger espía (`src/test/loggerSpy.ts`) y verificar exactamente un evento por intento con el mismo `attemptId`: `info` `auth.succeeded` con `durationMs`; `info` `auth.rejected` con `reason: 'invalid-credentials'`; `error` `auth.failed` con `durationMs` y `errorName` cuando el gateway rechaza, o con `reason: 'unavailable'` cuando responde `unavailable` (no hay excepción de la que tomar el nombre); y que ningún evento serializado contenga el correo, la contraseña ni el `message` del error; (2) después cambiar `createAuthenticate` en `src/application/authenticate.ts` a `createAuthenticate({ gateway, logger, newAttemptId?, now? })` siguiendo el patrón de `createRegister`, y actualizar la composición en `src/main.tsx` (`logger: new ConsoleJsonLogger()`) y los usos en las pruebas; (3) `npm run verify` en verde

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias. T001 → T002 → T003; luego T004–T008 en paralelo; T009 al final
- **Foundational (Phase 2)**: depende de Setup y bloquea todas las historias. T016/T017 antes que T018/T019; T021 depende de T020; T022 depende de T021
- **US1 (Phase 3)**: depende de Foundational
- **US2 (Phase 4)**: depende de US1 (amplía el gateway, el reducer y `LoginForm`)
- **US3 (Phase 5)**: depende de US1; independiente de US2 a nivel funcional, pero toca los mismos archivos (`loginReducer.ts`, `LoginForm.tsx`), así que conviene hacerla después de US2
- **US4 (Phase 6)**: depende de US1; T057 se integra mejor después de US3 (propaga `error`)
- **US5 (Phase 7)**: depende de US1 y de `Alert` (T044, US2)
- **Polish (Phase 8)**: depende de todas las historias

### Within Each User Story

- Pruebas primero, y deben FALLAR (Principio I)
- Dominio → infraestructura/aplicación → reducer/hook → componentes → integración
- Cada historia se cierra con sus pruebas en verde y `npm run lint` limpio

### Parallel Opportunities

- Setup: T004, T005, T006, T007, T008
- Foundational: T010–T017 y T020
- US1: pruebas T023–T028 en paralelo; implementación T030–T032 en paralelo
- US2: T039, T040, T041 en paralelo; T043 y T044 en paralelo
- US3: T047, T048, T049 en paralelo
- US5: T058–T060 y T062–T064 en paralelo
- Polish: T066, T067, T068

---

## Parallel Example: User Story 1

```bash
# Pruebas de US1 en paralelo (archivos distintos):
Task: "T023 Pruebas de normalizeEmail en src/domain/validation.test.ts"
Task: "T024 Pruebas de contrato de InMemoryAuthGateway en src/infrastructure/InMemoryAuthGateway.test.ts"
Task: "T025 Pruebas de loadDemoAccounts en src/infrastructure/loadDemoAccounts.test.ts"
Task: "T026 Pruebas del caso de uso en src/application/authenticate.test.ts"
Task: "T027 Pruebas del reducer en src/ui/features/login/loginReducer.test.ts"
Task: "T028 Pruebas de WelcomeView en src/ui/features/login/WelcomeView.test.tsx"

# Implementaciones independientes de US1:
Task: "T030 normalizeEmail en src/domain/validation.ts"
Task: "T031 InMemoryAuthGateway en src/infrastructure/InMemoryAuthGateway.ts"
Task: "T032 loadDemoAccounts en src/infrastructure/loadDemoAccounts.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 (Setup) y Phase 2 (Foundational)
2. Completar Phase 3 (US1)
3. **DETENERSE Y VALIDAR**: quickstart escenarios 1–3
4. Demostrar el MVP

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → acceso exitoso (MVP)
3. US2 → error genérico (completa el requerimiento central del usuario)
4. US3 → validación de campos
5. US4 → visibilidad de la contraseña
6. US5 → fidelidad completa al diseño
7. Polish → `npm run verify` en verde y revisión de código antes de integrar (Constitución 9.3)

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- La etiqueta [USn] y los IDs en los nombres de las pruebas dan la trazabilidad requisito → prueba (9.2)
- Hacer commit al cerrar cada tarea o grupo lógico, referenciando el ID de la tarea
- Decisiones pendientes que pueden cambiar tareas: (a) si se aprueba la excepción para definir las cuentas en el código, solo cambian T007, T025, T032 y T038; (b) si diseño rechaza los tokens accesibles, cambia T010 y debe resolverse el incumplimiento de WCAG; (c) si se incluye bloqueo por intentos fallidos, se agregan tareas a US2

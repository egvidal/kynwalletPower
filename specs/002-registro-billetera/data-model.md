# Data Model: Pantalla de Registro de KynWallet

**Feature**: [spec.md](./spec.md) | **Date**: 2026-10-19

No hay persistencia: todas las entidades viven en memoria durante la sesión de la pestaña.

## Dominio (`src/domain/registration.ts`)

### RegistrationData

Datos del formulario tal como los escribe el usuario.

| Campo | Tipo | Regla (spec) | Mensaje si no cumple |
|---|---|---|---|
| `fullName` | `string` | Obligatorio; recortado, de 2 a 100 caracteres (FR-004) | `FULL_NAME_REQUIRED` / `FULL_NAME_TOO_SHORT` / `FULL_NAME_TOO_LONG` |
| `email` | `string` | Obligatorio; formato de correo; ≤ 254 caracteres; se recorta (FR-005) | `EMAIL_REQUIRED` / `EMAIL_INVALID` |
| `password` | `string` | Obligatorio; de 8 a 128 caracteres; **no** se recorta (FR-006) | `PASSWORD_REQUIRED` / `PASSWORD_TOO_SHORT` / `PASSWORD_TOO_LONG` |
| `confirmPassword` | `string` | Obligatorio; igual a `password`, carácter por carácter (FR-007) | `CONFIRM_PASSWORD_REQUIRED` / `PASSWORDS_DO_NOT_MATCH` |
| `acceptedTerms` | `boolean` | Debe ser `true` (FR-008) | `TERMS_REQUIRED` |

Las reglas de `email` y `password` son las mismas funciones que usa el login
(`domain/validation.ts`); los textos están en `domain/messages.ts` (ver research R7).

### RegistrationErrors

`Partial<Record<keyof RegistrationData, string>>`. Objeto vacío = datos válidos.
`validateRegistration(data: RegistrationData): RegistrationErrors` es una función pura.

Orden de evaluación por campo: obligatorio → longitud mínima → longitud máxima/formato. La
confirmación solo informa `PASSWORDS_DO_NOT_MATCH` cuando no está vacía.

### NewAccount

Lo que el caso de uso entrega al puerto, ya normalizado. Sin confirmación ni casilla.

| Campo | Tipo | Normalización |
|---|---|---|
| `fullName` | `string` | `trim()` |
| `email` | `string` | `normalizeEmail()` (recorte y minúsculas, como en el login) |
| `password` | `string` | Sin cambios |

### RegistrationResult

```text
{ kind: 'success' } | { kind: 'invalid'; errors: RegistrationErrors } | { kind: 'unavailable' }
```

- `success`: la cuenta "se creó" (simulado, no se guarda nada).
- `invalid`: el caso de uso volvió a validar y encontró errores (research R6). Con la UI actual no
  debería ocurrir, porque el formulario valida antes de enviar; si ocurre, la UI muestra esos
  errores como si se hubiera enviado con errores.
- `unavailable`: fallo inesperado (excepción del adaptador). La UI muestra
  `REGISTRATION_UNAVAILABLE` sin detalles técnicos (FR-021).

## Aplicación

- **Puerto** `RegistrationGateway` (`application/ports/RegistrationGateway.ts`):
  `register(account: NewAccount): Promise<RegistrationResult>`. Contrato en
  [contracts/registration-gateway.md](./contracts/registration-gateway.md).
- **Puerto** `Logger` (`application/ports/Logger.ts`): `info(entry: LogEntry)` y
  `error(entry: LogEntry)`, con
  `LogEntry = { event: string; attemptId: string; [campo: string]: string | number | boolean | string[] }`.
  Eventos y campos en research R14.
- **Caso de uso** `createRegister({ gateway, logger, newAttemptId?, now? }): Register`, donde
  `Register = (data: RegistrationData) => Promise<RegistrationResult>`. Valida con
  `validateRegistration` (si hay errores devuelve `invalid` sin llamar al gateway), convierte
  `RegistrationData` en `NewAccount`, transforma excepciones en `{ kind: 'unavailable' }` y
  registra un evento por intento. `newAttemptId` (por defecto `newAttemptId()` de `application/attemptId.ts`: `crypto.randomUUID` con respaldo en contextos no seguros) y `now` (por
  defecto `performance.now`) se inyectan para hacer deterministas las pruebas.

## Estado del formulario (`src/ui/features/register/registerReducer.ts`)

### RegisterFormState

| Campo | Tipo | Descripción |
|---|---|---|
| `status` | `'editing' \| 'submitting' \| 'failed'` | Ver transiciones |
| `values` | `{ fullName, email, password, confirmPassword: string; acceptedTerms: boolean }` | Valores actuales |
| `touched` | `Record<keyof values, boolean>` | Campos que el usuario abandonó o que se intentaron enviar |
| `fieldErrors` | `RegistrationErrors` | Solo errores de campos tocados (FR-009) |
| `notice` | `string \| null` | Aviso informativo del enlace de términos ("Función no disponible…") |
| `failure` | `boolean` | Mostrar `REGISTRATION_UNAVAILABLE` |

La visibilidad de cada contraseña es estado local de `PasswordField` (igual que en el login), así
que cada campo tiene su propio control (US6-3).

### Acciones y transiciones

```text
           change / blur / toggleTerms / showNotice
              ┌───────────────┐
              ▼               │
  ┌──────► editing ───────────┘
  │           │ submit (sin errores)          submit (con errores): sigue en editing,
  │           ▼                               marca todo como tocado y muestra errores
  │       submitting ── result: success ──► (sale de la pantalla: onRegistered → /login)
  │           │
  │           └─ result: unavailable ──► failed
  │                                         │
  └──────────── change ─────────────────────┘
```

| Acción | Efecto |
|---|---|
| `change(field, value)` | Actualiza el valor; recalcula `fieldErrors` de los campos tocados (incluida la confirmación si cambia la contraseña, US2-5); limpia `failure`; `failed` → `editing` |
| `blur(field)` | Marca el campo como tocado y recalcula sus errores |
| `toggleTerms(checked)` | Actualiza `acceptedTerms`; si estaba tocado, recalcula su error (US3-2) |
| `showNotice(message)` | Muestra el aviso informativo sin tocar los valores (US3-3) |
| `submit` | Ignorado si `submitting`; marca todo como tocado; si hay errores, sigue en `editing`; si no, pasa a `submitting` y limpia `notice` y `failure` |
| `result(success)` | El hook llama `onRegistered()`; el estado se descarta al desmontar la pantalla |
| `result(unavailable)` | `failed`, `failure = true`; **conserva** todos los valores (caso límite de la spec) |
| `result(invalid)` | `editing`; marca todo como tocado y muestra `errors` como `fieldErrors`; conserva los valores |

Diferencias con el login: no se vacía la contraseña tras un fallo y no hay vista de bienvenida.

Google y Apple no pasan por el reducer: llaman a la función `onComingSoon("Próximamente")`, que
por defecto es `window.alert` (research R8). El estado del formulario no cambia (US7).

## Navegación (`src/ui/navigation/`)

| Elemento | Tipo | Descripción |
|---|---|---|
| `Route` | `'/login' \| '/register'` | Rutas conocidas; cualquier otra se normaliza a `/login` |
| `useNavigation()` | `{ route: Route; navigate(route: Route): void }` | Lee `location.pathname`, escucha `popstate`, usa `pushState` |
| `flash` (en `App`) | `'registered' \| null` | Aviso de un solo uso para `/login`; se limpia en cada navegación |

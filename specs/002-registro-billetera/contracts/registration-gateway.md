# Contract: Puerto de registro (`RegistrationGateway`)

Abstracción entre el caso de uso `register` y el mecanismo que crea la cuenta. Hoy la
implementación es simulada; un backend futuro solo reemplaza el adaptador
(Constitución 2.5, 3.4). Tipos en [data-model.md](../data-model.md).

## Interfaz

```ts
// src/application/ports/RegistrationGateway.ts
export interface RegistrationGateway {
  register(account: NewAccount): Promise<RegistrationResult>;
}
```

## Precondiciones (las garantiza el llamador)

- `account` es válida: el caso de uso ejecutó `validateRegistration` antes de llamar al gateway.
- `account` está normalizada por el caso de uso: nombre recortado, correo recortado y en
  minúsculas, contraseña sin cambios.

## Postcondiciones

| Situación | Resultado |
|---|---|
| Registro aceptado | Resuelve `{ kind: 'success' }` |
| Fallo del mecanismo | Puede rechazar la promesa; el caso de uso lo convierte en `{ kind: 'unavailable' }` |

- El adaptador **no** registra, muestra ni guarda la contraseña ni los datos personales (FR-013,
  Constitución 5.4). Un rechazo no debe incluir esos datos en el mensaje del error.

## Caso de uso (`src/application/register.ts`)

```ts
export type Register = (data: RegistrationData) => Promise<RegistrationResult>;
export function createRegister(deps: {
  gateway: RegistrationGateway;
  logger: Logger;
  newAttemptId?: () => string; // por defecto newAttemptId(): randomUUID con respaldo (R14)
  now?: () => number; // por defecto performance.now
}): Register;
```

| Paso | Comportamiento | Evento registrado |
|---|---|---|
| 1 | `validateRegistration(data)`; si hay errores, devuelve `{ kind: 'invalid', errors }` y **no** llama al gateway | `registration.rejected` (info) con `invalidFields` = nombres de campo |
| 2 | Convierte `RegistrationData` en `NewAccount` (descarta confirmación y casilla) y llama al gateway | — |
| 3a | El gateway resuelve `success` → lo devuelve | `registration.succeeded` (info) con `durationMs` |
| 3b | El gateway rechaza → devuelve `{ kind: 'unavailable' }` | `registration.failed` (error) con `durationMs` y `errorName` |

Todos los eventos llevan el mismo `attemptId`. Ninguno contiene nombre, correo, contraseña ni
`error.message` (research R14).

## Puerto `Logger`

```ts
// src/application/ports/Logger.ts
export type LogEntry = {
  event: string;
  attemptId: string;
  [field: string]: string | number | boolean | string[];
};
export interface Logger {
  info(entry: LogEntry): void;
  error(entry: LogEntry): void;
}
```

Adaptador `src/infrastructure/ConsoleJsonLogger.ts`: una línea JSON por evento,
`{ "timestamp": ISO-8601, "level": "info" | "error", "app": "kynwallet-web", ...entry }`, con
`console.info` o `console.error`. Es el único archivo con `console` permitido por ESLint.

## Implementación de la demo: `SimulatedRegistrationGateway`

| Aspecto | Comportamiento |
|---|---|
| Ubicación | `src/infrastructure/SimulatedRegistrationGateway.ts` |
| Espera | 1000 ms por defecto; `new SimulatedRegistrationGateway({ delayMs })` para pruebas |
| Resultado | Siempre `{ kind: 'success' }` |
| Estado | Ninguno; no guarda la cuenta (las cuentas registradas no sirven para iniciar sesión) |
| Configuración | Ninguna; no lee variables de entorno ni requiere credenciales |

## Composición

`src/main.tsx` crea
`createRegister({ gateway: new SimulatedRegistrationGateway(), logger: new ConsoleJsonLogger() })`
y lo inyecta en `App` junto a `authenticate`. Las pruebas de UI inyectan un doble del caso de uso
(`src/test/registerStub.ts`) que permite resolver éxito, fallo o dejar la promesa pendiente; las
del caso de uso usan un logger espía (`src/test/loggerSpy.ts`).

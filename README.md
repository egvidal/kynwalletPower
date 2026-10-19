# KynWallet · Inicio de sesión y registro (demo)

Demostración funcional, solo del lado del cliente, de las pantallas de inicio de sesión y de
registro de la billetera virtual KynWallet. Reproduce los diseños de Figma
([01 · Login](https://www.figma.com/design/f7uDsv8sh6ZOtK2OitTqtg/Billetera-Virtual---Prototipos?node-id=2-2)
y [04 · Registro](https://www.figma.com/design/6xNmoI41kvegTfeFfgGgcs/Billetera-Virtual---Prototipos--copia-?node-id=31-2)),
valida los campos y simula la autenticación y el registro, sin backend ni base de datos.

| Ruta        | Pantalla                                                            |
| ----------- | ------------------------------------------------------------------- |
| `/login`    | Inicio de sesión (cualquier otra ruta, incluida `/`, redirige aquí) |
| `/register` | Registro                                                            |

- El registro es **simulado**: la cuenta creada no se guarda, así que no sirve para iniciar
  sesión. Para entrar se usan las cuentas de `VITE_DEMO_USERS`.
- Tras un registro exitoso se vuelve a `/login` con un aviso de un solo uso (desaparece al
  recargar o navegar).

Especificación, plan y tareas: [`specs/001-login-billetera/`](specs/001-login-billetera/) y
[`specs/002-registro-billetera/`](specs/002-registro-billetera/). En este proyecto, el
`research.md` de cada funcionalidad cumple la función de registro de decisiones de arquitectura
(ADR).

## Requisitos

- Node.js 20 LTS o superior y npm 10 o superior.

## Configuración

```bash
npm install
cp .env.example .env.local
```

Edita `.env.local` y define al menos una cuenta **ficticia** en `VITE_DEMO_USERS`:

```dotenv
VITE_DEMO_USERS=[{"email":"tu.correo@example.com","password":"minimo-8-caracteres","displayName":"Tu Nombre"}]
```

- `password`: de 8 a 128 caracteres. `displayName`: de 1 a 80 caracteres. Los correos no se pueden repetir.
- `.env.local` no se versiona: la Constitución del proyecto (regla 5.3) prohíbe credenciales en el
  código fuente o en archivos versionados.
- ⚠️ Al ser una aplicación solo-cliente, el valor de `VITE_DEMO_USERS` queda incluido en el bundle
  compilado. Usa únicamente cuentas ficticias.
- Si la variable falta o es inválida, la pantalla muestra "Servicio de acceso no disponible".

## Scripts

| Comando                           | Descripción                                                                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Servidor de desarrollo en <http://localhost:5173>                                                                                                                           |
| `npm run build`                   | Typecheck y build de producción en `dist/`                                                                                                                                  |
| `npm run preview`                 | Sirve el build de producción                                                                                                                                                |
| `npm test`                        | Ejecuta las pruebas una vez                                                                                                                                                 |
| `npm run test:watch`              | Pruebas en modo observación                                                                                                                                                 |
| `npm run test:coverage`           | Pruebas con cobertura (umbral: 80 %)                                                                                                                                        |
| `npm run test:e2e`                | Pruebas en navegador real con Playwright (`e2e/`)                                                                                                                           |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                                                                                                                           |
| `npm run verify`                  | Todos los controles de cumplimiento: lint, formato, tipos, pruebas con cobertura, pruebas en navegador, build, auditoría de dependencias y licencias, y escaneo de secretos |

## Arquitectura

Clean Architecture ligera. Las dependencias apuntan hacia el dominio y ESLint lo verifica:

```text
src/
├── domain/          # Tipos, reglas de validación y textos. Sin React.
├── application/     # Casos de uso `authenticate` y `register`; puertos `AuthGateway`,
│                    # `RegistrationGateway` y `Logger`
├── infrastructure/  # `InMemoryAuthGateway` y `SimulatedRegistrationGateway` (simulación, 1 s),
│                    # `loadDemoAccounts` y `ConsoleJsonLogger`
├── ui/
│   ├── styles/      # Tokens de Figma (`tokens.css`) y estilos globales
│   ├── components/  # Button, TextField, PasswordField, Checkbox, SocialButton, Divider, Alert
│   ├── layout/      # AuthLayout (distribución compartida) y BrandPanel
│   ├── navigation/  # `useNavigation`: rutas /login y /register sobre la History API
│   ├── features/login/     # LoginForm, WelcomeView, reducer y hook
│   └── features/register/  # RegisterForm, reducer y hook
├── App.tsx
└── main.tsx         # Raíz de composición (inyección de dependencias)
```

Las pruebas unitarias y de componentes viven junto al código (`*.test.ts(x)`) y se ejecutan con
Vitest. Las pruebas en navegador real (diseño, medidas, alertas nativas) están en `e2e/` y se
ejecutan con Playwright; la primera vez hay que descargar el navegador con
`npx playwright install chromium`. Cada caso se nombra con el escenario o
requisito que verifica (por ejemplo, `US2-1`, `FR-012`) para mantener la trazabilidad.

## Registro de eventos

Los casos de uso de inicio de sesión y de registro emiten una línea JSON por intento en la consola
del navegador (`ConsoleJsonLogger`), según las reglas 5.5 y 8.7 de la Constitución. Todos los
eventos de un intento comparten su `attemptId`:

```json
{
  "timestamp": "2026-10-19T12:00:00.000Z",
  "level": "info",
  "app": "kynwallet-web",
  "event": "registration.succeeded",
  "attemptId": "…",
  "durationMs": 1003
}
```

| Evento                   | Nivel | Campos adicionales                                   |
| ------------------------ | ----- | ---------------------------------------------------- |
| `registration.succeeded` | info  | `durationMs`                                         |
| `registration.rejected`  | info  | `invalidFields` (solo nombres de campo)              |
| `registration.failed`    | error | `durationMs`, `errorName`                            |
| `auth.succeeded`         | info  | `durationMs`                                         |
| `auth.rejected`          | info  | `durationMs`, `reason: "invalid-credentials"`        |
| `auth.failed`            | error | `durationMs` y `reason: "unavailable"` o `errorName` |

Los eventos **nunca** incluyen nombre, correo, contraseña, nombre del titular ni el mensaje del
error. Es el único
archivo autorizado a usar `console` (excepción explícita en `eslint.config.js`).

## Despliegue

Es una SPA con rutas en la URL (`/login`, `/register`). `npm run dev` y `npm run preview` ya
sirven `index.html` para cualquier ruta; un servidor estático debe configurarse para redirigir
las rutas desconocidas a `index.html`.

## Notas de diseño

- **Contraste (pendiente de aprobación de diseño):** varios colores de Figma no alcanzan
  WCAG 2.1 AA (botón 2.83:1, enlaces 3.56:1, textos secundarios 3.28:1, bordes 1.40:1). Se
  usan variantes más oscuras del mismo tono (`--brand-700`, `--neutral-600`, `--neutral-border`
  en `src/ui/styles/tokens.css`). Detalle en `specs/001-login-billetera/research.md` (R3).
- Los iconos de Google, Apple y del control de visibilidad son los marcadores de posición del
  diseño de Figma.
- **Panel de marca — excepción temporal:** el texto blanco sobre el degradado no alcanza AA
  (2.31:1 en la zona clara). Queda como en Figma bajo una excepción a la Constitución (regla 9.1)
  que **vence el 2027-01-17**; antes de esa fecha diseño debe elegir una alternativa que cumpla
  (`specs/002-registro-billetera/research.md`, R13). El logo y la tarjeta están exentos
  (logotipo e ilustración decorativa).
- **Registro:** usa el logo, el degradado, la tarjeta y el ícono del ojo del login (decisión de
  diseño del 2026-10-19). Google y Apple muestran la alerta nativa del navegador
  "Próximamente"; "términos y condiciones" muestra un aviso de función no disponible.
- Fuera de alcance: recuperar contraseña, acceso con Google/Apple, persistencia de
  "Recordarme" y bloqueo por intentos fallidos. Al activarlos se muestra un aviso.

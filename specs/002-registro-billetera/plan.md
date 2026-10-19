# Implementation Plan: Pantalla de Registro de KynWallet

**Branch**: `feature/registro-eduardo-vidal` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-registro-billetera/spec.md`

## Summary

Pantalla de registro de KynWallet (`/register`), solo del lado del cliente y fiel al frame de
Figma `04 · Registro` (nodo `31:2`). Formulario con nombre completo, correo, contraseña,
confirmación y aceptación de términos; validación inline; registro simulado de ~1s, y al
terminar, redirección a `/login` con un aviso de éxito de un solo uso. Google y Apple muestran
"Próximamente".

Se extiende el proyecto de `001-login-billetera` sin dependencias nuevas:

- **Dominio:** función `validateRegistration`, que reutiliza las reglas de correo y contraseña.
- **Aplicación:** caso de uso `register` con los puertos `RegistrationGateway` y `Logger`; el
  caso de uso vuelve a validar los datos y registra cada intento como evento estructurado.
- **Infraestructura:** adaptador de registro simulado y logger JSON por consola (research R14).
- **Navegación:** propia y mínima sobre la History API (dos rutas).
- **Layout:** `AuthLayout` compartido con el login.
- **Componentes:** reutilizados y con extensiones pequeñas (`Checkbox`, `BrandPanel`). Logo,
  degradado, tarjeta "Kyn Card" e iconos son los del login.
- **Contraste:** corrección a WCAG 2.1 AA del formulario; el texto del panel de marca queda bajo
  una excepción temporal (vence 2027-01-17, research R13).
- **Google y Apple:** `window.alert("Próximamente")`, como pide el requisito.

Desarrollo guiado por pruebas con Vitest y Testing Library.

## Technical Context

**Language/Version**: TypeScript 5.x (`strict`), Node.js ≥ 20 LTS para herramientas

**Primary Dependencies**: React 19, Vite 8, `@fontsource-variable/inter` (sin cambios; ninguna
dependencia nueva, research R1 y R4)

**Storage**: N/A (estado en memoria; el registro no persiste nada)

**Testing**: Vitest 5, React Testing Library, `@testing-library/user-event`, jsdom, `axe-core`
(helper `src/test/a11y.ts`), `@vitest/coverage-v8` con umbral de 80 %; Playwright 1.64.1 con
Chromium para lo que jsdom no puede verificar (diseño, medidas, alertas nativas; research R15)

**Target Platform**: Navegadores modernos (las dos últimas versiones de Chrome, Firefox, Safari
y Edge), de 320px a escritorio

**Project Type**: Aplicación web de página única (SPA), solo frontend

**Performance Goals**: llegada a `/login` con el aviso en ≤ 3s tras "Crear cuenta" (SC-002),
con una espera simulada de 1s

**Constraints**: sin backend, base de datos ni APIs externas; WCAG 2.1 AA; sin datos personales
ni contraseñas en la URL, logs o almacenamiento; sin scroll horizontal desde 320px

**Scale/Scope**: 2 rutas; 1 pantalla nueva; 2 componentes extendidos (`Checkbox`, `BrandPanel`);
1 layout movido (`AuthLayout`); 13 archivos nuevos de código y apoyo de pruebas (sin contar los
archivos `*.test.*`)

No quedan elementos `NEEDS CLARIFICATION`: la fuente del diseño, el mecanismo de navegación, el
aviso de un solo uso, la alerta "Próximamente" y las diferencias entre frames se resolvieron en
[research.md](./research.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / Regla | Cumplimiento en el diseño | Estado |
|---|---|---|
| I. TDD | Cada historia empieza con pruebas que fallan (dominio → caso de uso → reducer → componentes → App); los nombres siguen los escenarios Given/When/Then | ✅ |
| II. SOLID | `RegistrationGateway` y `Logger` inyectados (DIP); `Checkbox` y `BrandPanel` se extienden con props opcionales sin romper el login (OCP/LSP); navegación, reducer, hook y vista con una responsabilidad cada uno | ✅ |
| III. Clean Architecture | `domain/registration.ts` sin React; `application/register.ts` depende solo del dominio; adaptador en `infrastructure/`; la navegación vive en `ui/`; las reglas `no-restricted-imports` de ESLint cubren los archivos nuevos | ✅ |
| IV. DRY/KISS/YAGNI | Reglas de correo y contraseña reutilizadas; mensajes en `messages.ts`; `AuthLayout` compartido; sin router, librería de formularios ni estado global (research R1, R4) | ✅ |
| V. Seguridad | Validación en la UI y de nuevo en el caso de uso, con la misma función de dominio (5.1, R6); excepciones registradas y no silenciadas, y el alta registrada como evento de seguridad estructurado y trazable (5.5, R14); la contraseña no se registra, ni se persiste, ni va en la URL; el aviso de éxito no lleva datos personales (R5); errores sin detalles técnicos; el registro no usa credenciales ni configuración | ✅ |
| VI. BRD/ARD | No existen para esta funcionalidad (supuesto de la spec) | ✅ N/A |
| 7. Dependencias | Una dependencia de desarrollo nueva, `@playwright/test@1.64.1` (Apache-2.0, mantenida por Microsoft, sin vulnerabilidades), fijada con versión exacta y justificada en R15; React Router evaluado y rechazado por 4.2/7.4 (R4) | ✅ |
| 8.1 Pruebas | Unitarias, de componentes e integración de rutas; cobertura ≥ 80 % sin disminuir la global | ✅ |
| 8.2 Convenciones | ESLint (con `jsx-a11y`), Prettier y `tsc --noEmit` vía `npm run verify` | ✅ |
| 8.3 Documentación | README actualizado: rutas, registro, nota de despliegue SPA; contratos en `contracts/`; `research.md` cumple la función de ADR en este proyecto (decisión del 2026-10-19) | ✅ |
| 8.4 Accesibilidad AA | Colores del formulario corregidos a AA (R13); el texto sobre el degradado del panel de marca queda bajo excepción temporal a la regla 8.4 (Constitución 9.1), aprobada por Eduardo Gabriel Vidal el 2026-10-20, vence el 2027-01-17; contrato de roles y nombres; `axe-core` en las pantallas; foco y título al cambiar de ruta (R11); casilla con nombre completo (R9); ojo del login (R3) | ⚠️ excepción temporal registrada (9.1) |
| 8.5 Reutilización | Componentes de 001 reutilizados; `LoginScreen` pasa a ser el `AuthLayout` compartido | ✅ |
| 8.6 Sistema de diseño | Tipografía, medidas y espaciado del frame reproducidos; colores ajustados a AA, y logo, degradado, tarjeta e iconos del login | ✅ desviaciones aprobadas por Eduardo Gabriel Vidal como responsable de diseño, 2026-10-19 (ver Complexity Tracking) |
| 8.7 Observabilidad | Puerto `Logger` y adaptador `ConsoleJsonLogger`: una línea JSON por evento (`registration.succeeded`, `.rejected`, `.failed`) con `attemptId` y `durationMs`, de los que se derivan las métricas; sin nombre, correo, contraseña ni `error.message` (R14). El login de 001 registra eventos `auth.*` con el mismo puerto (T073 de 001, completada) | ✅ |
| 9.2 Trazabilidad | Pruebas nombradas con el ID del escenario o requisito; las tareas referenciarán FR/US | ✅ |
| 9.3/9.4 Revisión y controles | Rama `feature/registro-eduardo-vidal`; `npm run verify` antes de abrir la solicitud de cambio | ✅ |

**Resultado del gate**: APROBADO. Las desviaciones respecto del frame de Figma están
justificadas abajo y las aprobó Eduardo Gabriel Vidal como responsable de diseño (8.6). Ninguna
violación queda sin justificar.

**Re-check tras `/speckit-analyze` (2026-10-19)**: se incorporó el registro de eventos (8.7 y
5.5, antes incumplidas), la validación en el caso de uso (5.1) y la constancia de aprobación de
diseño (8.6). El gate sigue APROBADO.

**Re-check post-diseño (Phase 1)**: data-model, contratos y quickstart no agregan capas,
dependencias ni persistencia. El refactor `LoginScreen` → `AuthLayout` y los cambios del login
("Regístrate" navega, aviso de éxito) se limitan a la UI y deben mantener en verde las pruebas
existentes de 001 (Constitución 1.2). El gate sigue APROBADO.

## Project Structure

### Documentation (this feature)

```text
specs/002-registro-billetera/
├── plan.md                       # Este archivo
├── research.md                   # Phase 0
├── data-model.md                 # Phase 1
├── quickstart.md                 # Phase 1
├── contracts/
│   ├── registration-gateway.md   # Puerto de registro y adaptador simulado
│   └── ui-register.md            # Contrato observable de la UI, rutas y cambios en login
├── checklists/
│   └── requirements.md
└── tasks.md                      # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

Leyenda: `+` nuevo, `~` modificado, `→` movido/renombrado.

```text
README.md                          ~ rutas, registro y despliegue SPA
src/
├── main.tsx                       ~ crea e inyecta `register` (gateway simulado + ConsoleJsonLogger)
├── App.tsx                        ~ elige pantalla por ruta, guarda el aviso de un solo uso
├── App.test.tsx                   ~ rutas, aviso de éxito y a11y del registro
├── domain/
│   ├── messages.ts                ~ mensajes del registro (research R7)
│   ├── validation.ts              ~ exporta validateEmail y validatePassword
│   ├── registration.ts            + RegistrationData, NewAccount, RegistrationResult, validateRegistration
│   └── registration.test.ts       +
├── application/
│   ├── ports/RegistrationGateway.ts  +
│   ├── ports/Logger.ts            + puerto de registro de eventos (research R14)
│   ├── register.ts                + caso de uso createRegister (valida, delega y registra)
│   └── register.test.ts           +
├── infrastructure/
│   ├── SimulatedRegistrationGateway.ts       +
│   ├── SimulatedRegistrationGateway.test.ts  +
│   ├── ConsoleJsonLogger.ts                  + una línea JSON por evento
│   └── ConsoleJsonLogger.test.ts             +
├── ui/
│   ├── navigation/
│   │   ├── useNavigation.ts       + ruta actual, navigate(), popstate, normalización
│   │   └── useNavigation.test.ts  +
│   ├── components/
│   │   └── Checkbox/              ~ props opcionales error, ref, addon (research R9)
│   ├── layout/
│   │   ├── AuthLayout/            → antes features/login/LoginScreen (+ .module.css)
│   │   └── BrandPanel/            ~ props title, subtitle
│   ├── features/login/
│   │   └── LoginForm.tsx          ~ "Regístrate" navega; prop de aviso de éxito
│   └── features/register/
│       ├── RegisterForm.tsx       + vista del formulario
│       ├── RegisterForm.module.css +
│       ├── RegisterForm.test.tsx  + escenarios US1–US3, US6, US7
│       ├── registerReducer.ts     + máquina de estados (data-model.md)
│       ├── registerReducer.test.ts +
│       └── useRegisterForm.ts     + envío, en curso y resultado
└── test/
    ├── registerStub.ts            + doble del caso de uso register
    └── loggerSpy.ts               + logger espía para pruebas
eslint.config.js                   ~ excepción de `no-console` solo para ConsoleJsonLogger.ts
```

**Structure Decision**: se mantiene el proyecto único de frontend de 001, con capas separadas
por carpeta (`domain`, `application`, `infrastructure`, `ui`) y pruebas junto al código. La
funcionalidad nueva va en `ui/features/register/`. Lo que comparten ambas pantallas se mueve a
`ui/layout/` y la navegación a `ui/navigation/`, porque pertenece a la presentación y no al
dominio.

**Nota sobre la regla 1.3 (2026-10-20)**: la corrección T058 es de diseño (CSS) y jsdom no
calcula posiciones. Su prueba de regresión vive en `e2e/brand-panel.spec.ts` (Playwright, research
R15); se comprobó que falla sin el arreglo y pasa con él.

## Complexity Tracking

| Violación / desviación | Por qué es necesaria | Alternativa más simple rechazada porque |
|---|---|---|
| Colores de botón, enlaces, textos secundarios, placeholders y bordes distintos a los literales de Figma (research R13) | Los literales no alcanzan WCAG AA (8.4, OBLIGATORIO). Corrección completa aprobada por Eduardo Gabriel Vidal como responsable de diseño (2026-10-19) | Reproducir los colores exactos incumple 8.4 y SC-006 |
| **Excepción temporal (9.1)**: texto blanco del panel de marca sobre el degradado sin alcanzar WCAG AA (2.31:1 en la zona clara), en login y registro (research R13) | La capa oscura que lo corregía formaba una franja visible, rechazada por diseño. Aprobada por Eduardo Gabriel Vidal el 2026-10-20; **vence el 2027-01-17** | Texto oscuro `#16182c` (4.92:1 a 7.56:1) o degradado `#d04721`→`#b03b1b` (4.56:1 a 6.02:1): cumplen, pendientes de decisión de diseño antes del vencimiento |
| Logo, degradado, tarjeta "Kyn Card" e ícono del ojo del login en lugar de los del frame de registro (research R3) | Aprobado por Eduardo Gabriel Vidal como responsable de diseño (2026-10-19); una sola marca y un solo estilo (4.1, 8.5); el ojo del registro tiene contraste ~1.5:1 | Reproducir los del frame duplica activos y el ojo incumple 8.4 |
| Navegación propia en vez de una librería de rutas (research R4) | Dos rutas fijas; evitar una dependencia (4.3, 7.4) | React Router agrega peso y superficie para un caso trivial; se adoptará, registrándolo en `research.md`, si crecen las rutas |

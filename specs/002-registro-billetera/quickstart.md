# Quickstart: Pantalla de Registro de KynWallet

Guía para ejecutar la demo localmente y validar el registro de punta a punta. Contratos de
referencia: [ui-register.md](./contracts/ui-register.md) y
[registration-gateway.md](./contracts/registration-gateway.md).

## Requisitos previos

- Node.js 20 LTS o superior y npm 10 o superior.
- Dependencias instaladas y `.env.local` configurado como indica el [README](../../README.md)
  (`VITE_DEMO_USERS` solo hace falta para el inicio de sesión; el registro no usa configuración).

```bash
npm install
cp .env.example .env.local   # solo la primera vez; edita las cuentas ficticias
```

## Ejecutar

```bash
npm run dev        # http://localhost:5173/register
npm test           # pruebas una vez
npm run verify     # todos los controles de la Constitución (9.4)
```

Resultado esperado de `npm run verify`: sin errores de lint, formato ni tipos; todas las pruebas
pasan con cobertura ≥ 80 %; build correcto; sin vulnerabilidades altas, licencias no permitidas
ni secretos.

## Validación manual

| # | Pasos | Resultado esperado | Spec |
|---|---|---|---|
| 1 | Abrir `/register` en un ancho ≥ 960px | Dos paneles; textos y orden iguales al frame `04 · Registro` | FR-001, US5-1 |
| 2 | Presionar "Crear cuenta" con todo vacío | Un mensaje bajo cada campo y bajo la casilla; foco en "Nombre completo" | US2-1 |
| 3 | Escribir `usuario@` en el correo y salir del campo | "Ingresa un correo electrónico válido" | US2-2 |
| 4 | Contraseña `1234567`, salir del campo | "La contraseña debe tener al menos 8 caracteres" | US2-3 |
| 5 | Contraseña válida y confirmación distinta, salir | "Las contraseñas no coinciden" | US2-4 |
| 6 | Igualar la confirmación y luego cambiar la contraseña | Vuelve a aparecer "Las contraseñas no coinciden" | US2-5 |
| 7 | Todo válido sin marcar la casilla, enviar | "Debes aceptar los términos y condiciones"; foco en la casilla | US3-1 |
| 8 | Activar "términos y condiciones" | Aviso "Función no disponible en esta demostración"; la casilla no cambia | US3-3 |
| 9 | Activar "Google" y luego "Apple" | Alerta nativa del navegador "Próximamente"; al cerrarla, los datos se conservan | US7 |
| 10 | Mostrar/ocultar cada contraseña | Cada control cambia solo su campo | US6 |
| 11 | Completar todo válido, marcar la casilla, Enter | Botón "Creando cuenta…" ~1s; luego `/login` con "Cuenta creada con éxito. Ya puedes iniciar sesión." | US1-1, US1-2, US1-3 |
| 12 | Recargar `/login` | El aviso de éxito ya no aparece | US1-5 |
| 13 | En `/login`, activar "Regístrate"; luego "Inicia sesión" y Atrás del navegador | Navega a `/register`, a `/login` y de vuelta a `/register` | US4 |
| 14 | Escribir `/register` directamente en la barra de direcciones | Se muestra la pantalla de registro | Caso límite |
| 15 | Ancho de 320px (herramientas de desarrollo) | Solo cabecera con logo y formulario, sin scroll horizontal | US5-2, US5-3 |
| 16 | Escribir datos y cambiar el ancho de 1440 a 375px | Los datos se conservan | US5-4 |
| 17 | Recorrer la pantalla solo con teclado | Orden del contrato, foco visible, todo operable | FR-018 |
| 18 | Medir con un verificador de contraste los textos del formulario (botón, enlaces, subtítulo, separador, pie, placeholders) | Texto ≥ 4.5:1 y bordes ≥ 3:1. El panel de marca está bajo excepción temporal hasta el 2027-01-17 | FR-019, research R13 |
| 19 | Con las herramientas de desarrollo abiertas (Consola), completar un registro exitoso | Una línea JSON `registration.succeeded` con `attemptId` y `durationMs`; ninguna línea contiene el nombre, el correo ni la contraseña ingresados | FR-023, research R14 |
| 20 | A 1440 × 700, abrir `/login` y luego `/register` | El titular y la tarjeta del panel de marca quedan a la misma altura en ambas pantallas; al desplazar el registro, el panel queda fijo (automatizado en `e2e/brand-panel.spec.ts`) | T058 |

## Pruebas automatizadas relevantes

```bash
npx playwright install chromium   # solo la primera vez
npm run test:e2e                  # pruebas en navegador real (e2e/)
npx vitest run src/domain/registration.test.ts
npx vitest run src/ui/features/register
npx vitest run src/App.test.tsx
```

Cada prueba se nombra con el escenario que cubre (por ejemplo, `US2-5`), por lo que
`npx vitest run -t "US3"` ejecuta las de una historia.

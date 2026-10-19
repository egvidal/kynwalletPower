# Contract: Interfaz de usuario de la pantalla de registro y navegación

Contrato observable por el usuario y por las pruebas (RTL consulta por rol y nombre accesible).
Textos exactos en español, tal como figuran en el frame `04 · Registro` (nodo `31:2`) y en la
spec. Los mensajes de validación están en [research.md](../research.md) (R7).

## Rutas

| Ruta | Pantalla | Título del documento |
|---|---|---|
| `/login` | Inicio de sesión (001) | "Iniciar sesión · KynWallet" |
| `/register` | Registro | "Crear cuenta · KynWallet" |
| `/` u otra | Se reemplaza por `/login` (sin entrada nueva en el historial) | — |

- Al cambiar de ruta, el foco pasa al `heading` nivel 1 de la pantalla nueva.
- Los botones Atrás/Adelante del navegador cambian de pantalla.
- La URL nunca contiene datos del formulario (FR-013).

## Pantalla de registro (`/register`)

| Elemento | Rol / nombre accesible | Notas |
|---|---|---|
| Título | `heading` nivel 1 "Crea tu cuenta" | Subtítulo "Completa tus datos para comenzar" |
| Nombre | `textbox` "Nombre completo" | `autocomplete=name`, placeholder "Ej: Diego Martínez" |
| Correo | `textbox` "Correo electrónico" | `type=email`, `autocomplete=email`, placeholder "tucorreo@ejemplo.com" |
| Contraseña | campo con etiqueta "Contraseña" | `type=password` (o `text` si es visible), `autocomplete=new-password`, placeholder "••••••••" |
| Confirmación | campo con etiqueta "Confirmar contraseña" | Igual que la contraseña |
| Visibilidad (×2) | `button` "Mostrar contraseña" / "Ocultar contraseña" | Uno por campo, independientes; `aria-pressed` refleja el estado |
| Términos | `checkbox` "Acepto los términos y condiciones" | Nombre compuesto con `aria-labelledby` (research R9) |
| Enlace de términos | `button` "términos y condiciones" | Muestra "Función no disponible en esta demostración"; no cambia la casilla |
| Enviar | `button` "Crear cuenta" | En carga: `aria-busy=true`, deshabilitado, texto "Creando cuenta…" |
| Separador | texto "o regístrate con" | Decorativo |
| Google / Apple | `button` "Google", `button` "Apple" | Abren `window.alert("Próximamente")`; al cerrarla, el foco vuelve al botón |
| Ir a login | `button` "Inicia sesión" precedido por "¿Ya tienes cuenta?" | Navega a `/login` |

**Errores por campo**: texto bajo el campo (o bajo la casilla), vinculado con
`aria-describedby`; el control lleva `aria-invalid=true`. Al enviar con errores, el foco va al
primer control con error en el orden visual: nombre → correo → contraseña → confirmación →
términos.

**Mensajes globales**:

| Caso | Rol | Texto |
|---|---|---|
| Enlace de términos | `status` | "Función no disponible en esta demostración" |
| Fallo inesperado | `alert` | "No pudimos crear tu cuenta. Intenta más tarde." |

## Cambios en la pantalla de inicio de sesión (`/login`)

| Elemento | Antes (001) | Ahora |
|---|---|---|
| `button` "Regístrate" | Mostraba el aviso de función no disponible | Navega a `/register` |
| Aviso de registro exitoso | — | `status` "Cuenta creada con éxito. Ya puedes iniciar sesión.", visible solo al llegar desde un registro exitoso; desaparece al navegar o recargar |
| Título del documento | Sin cambio dinámico | "Iniciar sesión · KynWallet" |

El resto del contrato de [001/ui-login.md](../../001-login-billetera/contracts/ui-login.md) no
cambia.

## Panel de marca

| Pantalla | Titular | Texto de apoyo |
|---|---|---|
| Login | "Tu dinero, sin fronteras." | "Envía, recibe y paga en segundos. Una billetera pensada para tu día a día." |
| Registro | "Comienza tu camino financiero." | "Crea tu cuenta en minutos y empieza a enviar, recibir y administrar tu dinero desde cualquier lugar." |

Logo, degradado (`--brand-gradient`, el del login; su texto está bajo excepción temporal de
contraste hasta el 2027-01-17, research R13) y tarjeta "Kyn Card" con el estilo del login (decorativa, `aria-hidden=true`) iguales en ambas. Por debajo de 960px
solo se muestra la cabecera con el logo y el formulario ocupa el ancho disponible (máx. 400px).

## Teclado

Orden de tabulación: nombre → correo → contraseña → visibilidad → confirmación → visibilidad →
casilla → términos y condiciones → crear cuenta → Google → Apple → inicia sesión. Enter en
cualquier campo de texto envía el formulario. El foco siempre es visible.

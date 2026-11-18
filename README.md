# RPG Maker MZ – Active Battle Command (TimedDefense)

Plugin para **RPG Maker MZ** que agrega bloqueo y esquiva activos en las batallas: cuando un enemigo ataca, el jugador puede apretar un botón **en el momento preciso** para reducir el daño o evitar el golpe por completo.

> ⚠️ **Estado:** versión inicial. La lógica de los golpes se probó con una simulación del flujo de batalla, pero todavía no se probó dentro de RPG Maker MZ. Si encontrás un error, abrí un issue con el mensaje de la consola (F8 durante la prueba de juego).

## Cómo funciona

1. Un enemigo ataca a un actor con una habilidad que quita HP.
2. Después de la animación del ataque, justo antes del daño, aparece sobre el actor un **anillo dorado que se va cerrando** hacia un círculo blanco.
3. Cuando el anillo coincide con el círculo, apretá:

| Acción | Teclado | Mando | Efecto | Margen (por defecto) |
|---|---|---|---|---|
| **Bloquear** | `S` | LT (botón 6) | Recibís el 50% del daño | ±9 frames |
| **Esquivar** | `D` | RT (botón 7) | El ataque falla por completo (ni daño ni estados) | ±5 frames |

- Esquivar tiene un margen más corto: es más arriesgado pero evita todo.
- Si apretás **fuera de tiempo**, aparece "¡Fallo!" y perdés la oportunidad para ese golpe (apretar muchas veces no sirve).
- Los ataques a todo el grupo y los golpes múltiples dan **una oportunidad por cada golpe**.
- Un actor que no puede moverse (dormido, paralizado…) no puede reaccionar.
- Las curaciones, los ataques de tus actores y los contraataques no se ven afectados.
- Funciona con batalla por turnos o por tiempo (TPB), en vista lateral o frontal. En vista frontal, el anillo aparece en el centro de la pantalla.

## Instalación

1. Descargá [`js/plugins/TimedDefense.js`](js/plugins/TimedDefense.js) (botón **Download raw file** en GitHub).
2. Copialo a la carpeta `js/plugins/` de tu proyecto. **No le cambies el nombre**: el plugin lee sus parámetros usando el nombre `TimedDefense`.
3. En RPG Maker MZ abrí **Herramientas → Administrador de plugins** (Plugin Manager), hacé doble clic en una fila vacía, elegí `TimedDefense` y marcalo como **ON**.
4. Ajustá los parámetros si querés y guardá el proyecto.

## Parámetros

| Parámetro | Por defecto | Descripción |
|---|---|---|
| Tecla de bloqueo | `S` | Letra/número o código de tecla numérico (por ejemplo `70` para F). |
| Tecla de esquiva | `D` | Igual que el anterior. |
| Botón de mando: bloqueo | `6` | Índice del botón del mando. `-1` para no asignar. |
| Botón de mando: esquiva | `7` | Igual que el anterior. |
| Duración del aviso | `45` | Frames desde que aparece el anillo hasta el impacto (60 frames = 1 segundo). |
| Variación aleatoria | `15` | Frames extra al azar, para que el ritmo no sea siempre igual. |
| Margen de bloqueo | `9` | Frames antes o después del impacto en los que el bloqueo funciona. |
| Margen de esquiva | `5` | Frames antes o después del impacto en los que la esquiva funciona. |
| Daño al bloquear (%) | `50` | Porcentaje del daño que se recibe al bloquear. `0` = sin daño. |
| Permitir bloqueo / esquiva | `true` | Activa o desactiva cada acción. |
| Interruptor de activación | ninguno | Si elegís uno, el sistema solo funciona con ese interruptor en ON. |
| Textos de ayuda y de resultado | `[S] Bloquear`, `¡Bloqueo!`… | Textos que se muestran en pantalla. |
| Sonidos | vacío | Efectos de sonido para bloqueo, esquiva y fallo. Vacío = sonidos del sistema. |

**Evitá las teclas que el juego ya usa:** Z, X, Q, W, Enter, Espacio, Shift, Esc y las flechas. Si cambiás una tecla, cambiá también su texto de ayuda.

## Etiquetas en las notas de una habilidad

Escribilas en el campo **Nota** de la habilidad en la base de datos:

| Etiqueta | Efecto |
|---|---|
| `<NoQTE>` | La habilidad no se puede bloquear ni esquivar. |
| `<NoBlock>` | Solo se puede esquivar. |
| `<NoDodge>` | Solo se puede bloquear. |

## Qué probar primero

1. Que la batalla cargue sin errores.
2. Que el anillo aparezca cuando ataca un enemigo.
3. Apretar `S` en el momento justo: "¡Bloqueo!" y la mitad del daño.
4. Apretar `D` en el momento justo: "¡Esquiva!" y el ataque falla.
5. Apretar antes de tiempo: "¡Fallo!".
6. Una habilidad enemiga que golpee a todo el grupo.

## Compatibilidad

El plugin extiende (sin reemplazar) estas funciones del motor: `BattleManager.updateAction`, `initMembers`, `endAction`, `endBattle`, `Game_Action.prototype.itemHit`, `itemEva`, `makeDamageValue` y `Spriteset_Battle.prototype.createLowerLayer`. Otros plugins que reemplacen esas funciones por completo pueden entrar en conflicto. En ese caso, probá cambiar el orden en el Administrador de plugins.

No tiene comandos de plugin.

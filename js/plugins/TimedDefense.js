//=============================================================================
// TimedDefense.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Bloqueo y esquiva con botones en el momento preciso durante los ataques enemigos.
 * @author Camilo-rpg
 *
 * @help TimedDefense.js
 *
 * Cuando un enemigo ataca a un actor con una habilidad que hace daño de HP,
 * aparece un anillo que se cierra sobre el actor. Si el jugador aprieta la
 * tecla en el momento en que el anillo coincide con el círculo fijo:
 *
 *   - Bloquear: el daño se multiplica por "Daño al bloquear" (50% por defecto).
 *   - Esquivar: el ataque falla por completo (ni daño ni estados).
 *
 * La ventana de esquiva es más corta que la de bloqueo: esquivar es más
 * arriesgado pero evita todo. Si se aprieta fuera de tiempo, se pierde la
 * oportunidad para ese golpe (apretar muchas veces no sirve).
 *
 * Cada golpe tiene su propia oportunidad: los ataques a todo el grupo o los
 * que se repiten piden una pulsación por golpe.
 *
 * --- Teclas ---
 * En los parámetros se puede escribir una letra o número ("S", "D", "1") o
 * un código de tecla numérico (por ejemplo 70 para F). Evita las teclas que
 * el juego ya usa: Z, X, Q, W, Enter, Espacio, Shift, Esc, flechas.
 * Si cambias la tecla, cambia también el texto de ayuda.
 * Botones de mando por defecto: LT (6) bloquea y RT (7) esquiva.
 *
 * --- Etiquetas en las notas de una habilidad ---
 *   <NoQTE>      Esta habilidad no se puede bloquear ni esquivar.
 *   <NoBlock>    Solo se puede esquivar.
 *   <NoDodge>    Solo se puede bloquear.
 *
 * --- Notas ---
 * - Los tiempos están en frames (60 frames = 1 segundo).
 * - Un actor que no puede moverse (dormido, paralizado...) no puede
 *   reaccionar.
 * - Funciona con batallas por turnos y por tiempo, vista lateral o frontal.
 * - No tiene comandos de plugin.
 *
 * @param blockKey
 * @text Tecla de bloqueo
 * @desc Letra/número o código de tecla.
 * @type string
 * @default S
 *
 * @param dodgeKey
 * @text Tecla de esquiva
 * @desc Letra/número o código de tecla.
 * @type string
 * @default D
 *
 * @param blockButton
 * @text Botón de mando: bloqueo
 * @desc Índice del botón del mando (6 = LT). -1 para no asignar.
 * @type number
 * @min -1
 * @default 6
 *
 * @param dodgeButton
 * @text Botón de mando: esquiva
 * @desc Índice del botón del mando (7 = RT). -1 para no asignar.
 * @type number
 * @min -1
 * @default 7
 *
 * @param leadFrames
 * @text Duración del aviso
 * @desc Frames desde que aparece el anillo hasta el momento del impacto.
 * @type number
 * @min 10
 * @default 45
 *
 * @param randomFrames
 * @text Variación aleatoria
 * @desc Frames extra al azar (0 a este valor) para que el ritmo no sea siempre igual.
 * @type number
 * @min 0
 * @default 15
 *
 * @param blockTolerance
 * @text Margen de bloqueo
 * @desc Frames antes/después del impacto en los que el bloqueo funciona.
 * @type number
 * @min 0
 * @default 9
 *
 * @param dodgeTolerance
 * @text Margen de esquiva
 * @desc Frames antes/después del impacto en los que la esquiva funciona.
 * @type number
 * @min 0
 * @default 5
 *
 * @param blockRate
 * @text Daño al bloquear (%)
 * @desc Porcentaje del daño que se recibe al bloquear. 0 = sin daño.
 * @type number
 * @min 0
 * @max 100
 * @default 50
 *
 * @param enableBlock
 * @text Permitir bloqueo
 * @type boolean
 * @default true
 *
 * @param enableDodge
 * @text Permitir esquiva
 * @type boolean
 * @default true
 *
 * @param enableSwitch
 * @text Interruptor de activación
 * @desc Si se elige, el sistema solo funciona con este interruptor en ON. Ninguno = siempre activo.
 * @type switch
 * @default 0
 *
 * @param blockHint
 * @text Texto de ayuda: bloqueo
 * @type string
 * @default [S] Bloquear
 *
 * @param dodgeHint
 * @text Texto de ayuda: esquiva
 * @type string
 * @default [D] Esquivar
 *
 * @param blockText
 * @text Texto: bloqueo logrado
 * @type string
 * @default ¡Bloqueo!
 *
 * @param dodgeText
 * @text Texto: esquiva lograda
 * @type string
 * @default ¡Esquiva!
 *
 * @param failText
 * @text Texto: fuera de tiempo
 * @type string
 * @default ¡Fallo!
 *
 * @param blockSe
 * @text Sonido de bloqueo
 * @desc Vacío = sonido de sistema "Reflejo mágico".
 * @type file
 * @dir audio/se
 * @default
 *
 * @param dodgeSe
 * @text Sonido de esquiva
 * @desc Vacío = solo el sonido de evasión normal del juego.
 * @type file
 * @dir audio/se
 * @default
 *
 * @param failSe
 * @text Sonido de fallo
 * @desc Vacío = zumbido de sistema.
 * @type file
 * @dir audio/se
 * @default
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "TimedDefense";
    const SYM_BLOCK = "tdBlock";
    const SYM_DODGE = "tdDodge";

    const raw = PluginManager.parameters(PLUGIN_NAME);
    const num = (key, def) => {
        const n = Number(raw[key]);
        return raw[key] === undefined || raw[key] === "" || isNaN(n) ? def : n;
    };
    const str = (key, def) => (raw[key] === undefined ? def : String(raw[key]));
    const bool = (key, def) =>
        raw[key] === undefined || raw[key] === "" ? def : raw[key] === "true";

    const P = {
        blockKey: str("blockKey", "S"),
        dodgeKey: str("dodgeKey", "D"),
        blockButton: num("blockButton", 6),
        dodgeButton: num("dodgeButton", 7),
        lead: Math.max(1, num("leadFrames", 45)),
        random: Math.max(0, num("randomFrames", 15)),
        blockTol: Math.max(0, num("blockTolerance", 9)),
        dodgeTol: Math.max(0, num("dodgeTolerance", 5)),
        blockRate: Math.min(100, Math.max(0, num("blockRate", 50))) / 100,
        enableBlock: bool("enableBlock", true),
        enableDodge: bool("enableDodge", true),
        enableSwitch: num("enableSwitch", 0),
        blockHint: str("blockHint", "[S] Bloquear"),
        dodgeHint: str("dodgeHint", "[D] Esquivar"),
        blockText: str("blockText", "¡Bloqueo!"),
        dodgeText: str("dodgeText", "¡Esquiva!"),
        failText: str("failText", "¡Fallo!"),
        blockSe: str("blockSe", ""),
        dodgeSe: str("dodgeSe", ""),
        failSe: str("failSe", "")
    };

    //-------------------------------------------------------------------------
    // Input: teclas propias, para no chocar con ok/cancel/shift
    //-------------------------------------------------------------------------

    const keyCodeOf = value => {
        const text = String(value).trim();
        if (/^[a-z]$/i.test(text)) {
            return text.toUpperCase().charCodeAt(0);
        }
        const code = parseInt(text, 10);
        return isNaN(code) ? 0 : code;
    };

    const blockKeyCode = keyCodeOf(P.blockKey);
    const dodgeKeyCode = keyCodeOf(P.dodgeKey);
    if (blockKeyCode > 0) {
        Input.keyMapper[blockKeyCode] = SYM_BLOCK;
    }
    if (dodgeKeyCode > 0) {
        Input.keyMapper[dodgeKeyCode] = SYM_DODGE;
    }
    if (P.blockButton >= 0) {
        Input.gamepadMapper[P.blockButton] = SYM_BLOCK;
    }
    if (P.dodgeButton >= 0) {
        Input.gamepadMapper[P.dodgeButton] = SYM_DODGE;
    }

    //-------------------------------------------------------------------------
    // BattleManager: abre la ventana de tiempo antes de aplicar cada golpe
    //-------------------------------------------------------------------------

    const playSe = (name, fallback) => {
        if (name) {
            AudioManager.playSe({ name: name, volume: 90, pitch: 100, pan: 0 });
        } else if (fallback) {
            fallback();
        }
    };

    BattleManager.timedDefenseState = function() {
        return this._phase === "action" ? this._tdState : null;
    };

    BattleManager.takeTimedDefensePopup = function() {
        const popup = this._tdPopup;
        this._tdPopup = null;
        return popup;
    };

    BattleManager.clearTimedDefense = function() {
        this._tdState = null;
        this._tdOutcome = null;
        this._tdPopup = null;
    };

    // Resultado del golpe que se está aplicando ahora mismo: "block", "dodge" o null.
    BattleManager.timedDefenseOutcome = function() {
        return this._tdOutcome || null;
    };

    BattleManager.timedDefenseOptions = function(subject, target) {
        const none = { block: false, dodge: false };
        const action = this._action;
        if (!subject || !target || !action || !action.item()) {
            return none;
        }
        if (P.enableSwitch > 0 && !$gameSwitches.value(P.enableSwitch)) {
            return none;
        }
        if (!subject.isEnemy() || !target.isActor()) {
            return none;
        }
        if (!target.isAlive() || !target.canMove()) {
            return none;
        }
        const item = action.item();
        if (!action.isForOpponent() || ![1, 5].includes(item.damage.type)) {
            return none;
        }
        const meta = item.meta || {};
        if (meta.NoQTE) {
            return none;
        }
        return {
            block: P.enableBlock && !meta.NoBlock,
            dodge: P.enableDodge && !meta.NoDodge
        };
    };

    BattleManager.startTimedDefense = function(target, options) {
        const impact = P.lead + Math.randomInt(P.random + 1);
        const late = Math.max(
            options.block ? P.blockTol : 0,
            options.dodge ? P.dodgeTol : 0
        );
        this._tdState = {
            target: target,
            frame: 0,
            impact: impact,
            end: impact + late,
            canBlock: options.block,
            canDodge: options.dodge,
            locked: false,
            result: null,
            done: false
        };
    };

    BattleManager.updateTimedDefense = function() {
        const s = this._tdState;
        s.frame++;
        if (!s.locked) {
            let pressed = null;
            if (s.canDodge && Input.isTriggered(SYM_DODGE)) {
                pressed = "dodge";
            } else if (s.canBlock && Input.isTriggered(SYM_BLOCK)) {
                pressed = "block";
            }
            if (pressed) {
                const tolerance = pressed === "dodge" ? P.dodgeTol : P.blockTol;
                if (Math.abs(s.frame - s.impact) <= tolerance) {
                    s.result = pressed;
                    s.done = true;
                } else {
                    // Fuera de tiempo: se pierde la oportunidad para este golpe.
                    s.locked = true;
                    this._tdPopup = { text: P.failText, color: "#ff6060" };
                    playSe(P.failSe, () => SoundManager.playBuzzer());
                }
            }
        }
        if (s.frame >= (s.locked ? s.impact : s.end)) {
            s.done = true;
        }
    };

    const _BattleManager_updateAction = BattleManager.updateAction;
    BattleManager.updateAction = function() {
        const next = this._targets[0];
        if (this._tdState && this._tdState.target !== next) {
            this._tdState = null;
        }
        if (!this._tdState) {
            const options = next
                ? this.timedDefenseOptions(this._subject, next)
                : null;
            if (!options || (!options.block && !options.dodge)) {
                _BattleManager_updateAction.call(this);
                return;
            }
            this.startTimedDefense(next, options);
            return;
        }
        this.updateTimedDefense();
        if (!this._tdState.done) {
            return;
        }
        const result = this._tdState.result;
        this._tdState = null;
        if (result === "block") {
            this._tdPopup = { text: P.blockText, color: "#80c8ff" };
            playSe(P.blockSe, () => SoundManager.playReflection());
        } else if (result === "dodge") {
            this._tdPopup = { text: P.dodgeText, color: "#a0ff90" };
            playSe(P.dodgeSe, null);
        }
        // El resultado solo vale mientras se aplica este golpe.
        this._tdOutcome = result;
        try {
            _BattleManager_updateAction.call(this);
        } finally {
            this._tdOutcome = null;
        }
    };

    const _BattleManager_initMembers = BattleManager.initMembers;
    BattleManager.initMembers = function() {
        _BattleManager_initMembers.call(this);
        this.clearTimedDefense();
    };

    const _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        _BattleManager_endAction.call(this);
        this._tdState = null;
        this._tdOutcome = null;
    };

    const _BattleManager_endBattle = BattleManager.endBattle;
    BattleManager.endBattle = function(result) {
        this._tdState = null;
        this._tdOutcome = null;
        _BattleManager_endBattle.call(this, result);
    };

    //-------------------------------------------------------------------------
    // Game_Action: efecto del bloqueo / esquiva
    //-------------------------------------------------------------------------

    // Solo cuenta para el golpe del enemigo sobre un actor; así un contraataque
    // o un reflejo mágico (donde el objetivo es el enemigo) no se ve afectado.
    Game_Action.prototype.timedDefenseOutcome = function(target) {
        const outcome = BattleManager.timedDefenseOutcome();
        if (outcome && target && target.isActor() && this.subject().isEnemy()) {
            return outcome;
        }
        return null;
    };

    const _Game_Action_itemHit = Game_Action.prototype.itemHit;
    Game_Action.prototype.itemHit = function(target) {
        if (this.timedDefenseOutcome(target) === "dodge") {
            return 1; // que cuente como evasión, no como fallo del enemigo
        }
        return _Game_Action_itemHit.call(this, target);
    };

    const _Game_Action_itemEva = Game_Action.prototype.itemEva;
    Game_Action.prototype.itemEva = function(target) {
        if (this.timedDefenseOutcome(target) === "dodge") {
            return 1;
        }
        return _Game_Action_itemEva.call(this, target);
    };

    const _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        const value = _Game_Action_makeDamageValue.call(this, target, critical);
        if (value > 0 && this.timedDefenseOutcome(target) === "block") {
            return Math.floor(value * P.blockRate);
        }
        return value;
    };

    //-------------------------------------------------------------------------
    // Sprite_TimedDefenseCue: anillo que se cierra + textos
    //-------------------------------------------------------------------------

    const RING_RADIUS = 36;
    const RING_SIZE = 96;
    const START_SCALE = 3;

    function Sprite_TimedDefenseCue() {
        this.initialize(...arguments);
    }

    Sprite_TimedDefenseCue.prototype = Object.create(Sprite.prototype);
    Sprite_TimedDefenseCue.prototype.constructor = Sprite_TimedDefenseCue;

    Sprite_TimedDefenseCue.prototype.initialize = function(spriteset) {
        Sprite.prototype.initialize.call(this);
        this._spriteset = spriteset;
        this._lastState = null;
        this._popupDuration = 0;
        this._targetRing = this.createRing("#ffffff", 3);
        this._approachRing = this.createRing("#ffd040", 4);
        // Encima del anillo: debajo quedaría tapado por la ventana de estado.
        this._hint = this.createTextSprite(360, 36, -RING_RADIUS - 24);
        this._popup = this.createTextSprite(360, 48, 0);
        this._targetRing.visible = false;
        this._approachRing.visible = false;
        this._hint.visible = false;
        this._popup.visible = false;
    };

    Sprite_TimedDefenseCue.prototype.createRing = function(color, lineWidth) {
        const bitmap = new Bitmap(RING_SIZE, RING_SIZE);
        const context = bitmap.context;
        if (context) {
            context.save();
            context.strokeStyle = "rgba(0, 0, 0, 0.6)";
            context.lineWidth = lineWidth + 3;
            context.beginPath();
            context.arc(RING_SIZE / 2, RING_SIZE / 2, RING_RADIUS, 0, Math.PI * 2);
            context.stroke();
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.beginPath();
            context.arc(RING_SIZE / 2, RING_SIZE / 2, RING_RADIUS, 0, Math.PI * 2);
            context.stroke();
            context.restore();
            if (bitmap.baseTexture) {
                bitmap.baseTexture.update();
            }
        } else {
            bitmap.drawCircle(RING_SIZE / 2, RING_SIZE / 2, RING_RADIUS, color);
        }
        const sprite = new Sprite(bitmap);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        this.addChild(sprite);
        return sprite;
    };

    Sprite_TimedDefenseCue.prototype.createTextSprite = function(width, height, y) {
        const bitmap = new Bitmap(width, height);
        bitmap.fontFace = $gameSystem.mainFontFace();
        bitmap.fontSize = height - 14;
        bitmap.outlineColor = "rgba(0, 0, 0, 0.8)";
        bitmap.outlineWidth = 5;
        const sprite = new Sprite(bitmap);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.y = y;
        this.addChild(sprite);
        return sprite;
    };

    Sprite_TimedDefenseCue.prototype.setText = function(sprite, text, color) {
        const bitmap = sprite.bitmap;
        bitmap.clear();
        bitmap.textColor = color;
        bitmap.drawText(text, 0, 0, bitmap.width, bitmap.height, "center");
    };

    Sprite_TimedDefenseCue.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.updateCue();
        this.updatePopup();
    };

    Sprite_TimedDefenseCue.prototype.updateCue = function() {
        const state = BattleManager.timedDefenseState();
        if (state !== this._lastState) {
            this._lastState = state;
            if (state) {
                this.setupCue(state);
            }
        }
        const visible = !!state;
        this._targetRing.visible = visible;
        this._approachRing.visible = visible;
        this._hint.visible = visible && !state.locked;
        if (state) {
            const remaining = state.impact - state.frame;
            const scale =
                remaining >= 0
                    ? 1 + (remaining / state.impact) * (START_SCALE - 1)
                    : Math.max(0.6, 1 + remaining * 0.03);
            this._approachRing.scale.x = scale;
            this._approachRing.scale.y = scale;
            this._approachRing.opacity = state.locked ? 96 : 255;
            this._targetRing.opacity = state.locked ? 96 : 255;
        }
    };

    Sprite_TimedDefenseCue.prototype.setupCue = function(state) {
        this.placeOn(state.target);
        const hints = [];
        if (state.canBlock) {
            hints.push(P.blockHint);
        }
        if (state.canDodge) {
            hints.push(P.dodgeHint);
        }
        this.setText(this._hint, hints.join("   "), "#ffffff");
    };

    Sprite_TimedDefenseCue.prototype.placeOn = function(target) {
        let x = Graphics.boxWidth / 2;
        let y = Graphics.boxHeight / 2;
        if ($gameSystem.isSideView()) {
            const sprites = this._spriteset._actorSprites || [];
            const sprite = sprites.find(s => s._battler === target);
            if (sprite) {
                x = sprite.x;
                y = sprite.y - (sprite.height || 64) / 2;
            }
        }
        const halfText = 180; // mitad del ancho de los textos
        this.x = Math.min(Math.max(x, halfText), Graphics.boxWidth - halfText);
        this.y = Math.max(y, RING_RADIUS + 80);
    };

    Sprite_TimedDefenseCue.prototype.updatePopup = function() {
        const popup = BattleManager.takeTimedDefensePopup();
        if (popup) {
            this.setText(this._popup, popup.text, popup.color);
            this._popupDuration = 40;
            this._popup.visible = true;
        }
        if (this._popupDuration > 0) {
            this._popupDuration--;
            const elapsed = 40 - this._popupDuration;
            this._popup.y = -RING_RADIUS - 24 - Math.min(elapsed, 12);
            this._popup.opacity = Math.min(255, this._popupDuration * 26);
            if (this._popupDuration === 0) {
                this._popup.visible = false;
            }
        }
    };

    const _Spriteset_Battle_createLowerLayer =
        Spriteset_Battle.prototype.createLowerLayer;
    Spriteset_Battle.prototype.createLowerLayer = function() {
        _Spriteset_Battle_createLowerLayer.call(this);
        this._timedDefenseCue = new Sprite_TimedDefenseCue(this);
        this._battleField.addChild(this._timedDefenseCue);
    };
})();

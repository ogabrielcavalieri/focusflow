// Dimensões do Amazfit Bip 6 (tela 1.91", ~192x490)
const SCREEN_W = 192;
const SCREEN_H = 490;

// Paleta de cores
const COLOR_BG      = 0x000000;
const COLOR_ACCENT  = 0x00FF88;
const COLOR_WHITE   = 0xFFFFFF;
const COLOR_GRAY    = 0x888888;
const COLOR_BTN     = 0x007AFF;
const COLOR_BTN_PR  = 0x005EC0;
const COLOR_SUCCESS = 0xFFD700;

Page({
  // Referências aos widgets
  _timerText:  null,
  _statusText: null,
  _goalText:   null,
  _statsText:  null,
  _startBtn:   null,

  // Estado da sessão
  _isRunning:     false,
  _startTime:     0,
  _targetMs:      900000, // 15min padrão
  _sessionDone:   false,
  _interval:      null,

  build() {
    this._calcRecommendation();

    // Título
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: 12, w: SCREEN_W, h: 28,
      text: 'FocusFlow',
      color: COLOR_ACCENT,
      text_size: 20,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });

    // Linha separadora
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 24, y: 44, w: SCREEN_W - 48, h: 1,
      color: 0x333333,
    });

    // Timer principal
    this._timerText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: 70, w: SCREEN_W, h: 70,
      text: '00:00',
      color: COLOR_WHITE,
      text_size: 52,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });

    // Meta de duração
    this._goalText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: 148, w: SCREEN_W, h: 22,
      text: 'Meta: ' + this._fmtDuration(this._targetMs),
      color: COLOR_GRAY,
      text_size: 13,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });

    // Status da sessão
    this._statusText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: 174, w: SCREEN_W, h: 20,
      text: 'Pronto para focar',
      color: COLOR_GRAY,
      text_size: 12,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });

    // Botão iniciar/parar
    this._startBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 36, y: 206, w: 120, h: 48,
      text: 'INICIAR',
      text_size: 16,
      normal_color: COLOR_BTN,
      press_color: COLOR_BTN_PR,
      radius: 24,
      click_func: () => this._toggleSession(),
    });

    // Linha separadora inferior
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 24, y: 268, w: SCREEN_W - 48, h: 1,
      color: 0x333333,
    });

    // Stats resumidas
    this._statsText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: 276, w: SCREEN_W, h: 20,
      text: this._buildStatsLabel(),
      color: COLOR_GRAY,
      text_size: 12,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });
  },

  onDestroy() {
    if (this._interval) clearInterval(this._interval);
  },

  // ─── Sessão ────────────────────────────────────────────────

  _toggleSession() {
    if (this._isRunning) {
      this._stopSession();
    } else {
      this._startSession();
    }
  },

  _startSession() {
    this._isRunning   = true;
    this._startTime   = Date.now();
    this._sessionDone = false;

    hmUI.setProperty(this._startBtn,   hmUI.prop.TEXT,  'PARAR');
    hmUI.setProperty(this._statusText, hmUI.prop.TEXT,  'Focando...');
    hmUI.setProperty(this._timerText,  hmUI.prop.COLOR, COLOR_WHITE);

    this._interval = setInterval(() => this._tick(), 1000);
  },

  _stopSession() {
    clearInterval(this._interval);
    this._interval  = null;
    this._isRunning = false;

    const duration  = Date.now() - this._startTime;
    const completed = this._sessionDone || duration >= this._targetMs * 0.9;

    this._persistSession({
      startTime: this._startTime,
      duration:  duration,
      targetMs:  this._targetMs,
      completed: completed,
    });

    hmUI.setProperty(this._startBtn,   hmUI.prop.TEXT,  'INICIAR');
    hmUI.setProperty(this._timerText,  hmUI.prop.TEXT,  '00:00');
    hmUI.setProperty(this._timerText,  hmUI.prop.COLOR, COLOR_WHITE);
    hmUI.setProperty(this._statusText, hmUI.prop.TEXT,  completed ? 'Sessao concluida!' : 'Sessao encerrada');
    hmUI.setProperty(this._statsText,  hmUI.prop.TEXT,  this._buildStatsLabel());

    this._calcRecommendation();
    hmUI.setProperty(this._goalText, hmUI.prop.TEXT, 'Meta: ' + this._fmtDuration(this._targetMs));
  },

  _tick() {
    const elapsed = Date.now() - this._startTime;
    hmUI.setProperty(this._timerText, hmUI.prop.TEXT, this._fmtTime(elapsed));

    // Alerta ao atingir meta
    if (elapsed >= this._targetMs && !this._sessionDone) {
      this._sessionDone = true;
      hmVibrate.triggerBig();
      hmUI.setProperty(this._timerText,  hmUI.prop.COLOR, COLOR_SUCCESS);
      hmUI.setProperty(this._statusText, hmUI.prop.TEXT,  'Meta atingida!');
    }
  },

  // ─── Persistência ──────────────────────────────────────────

  _persistSession(session) {
    const app = getApp();
    app.globalData.sessions.unshift(session);
    if (app.globalData.sessions.length > 100) {
      app.globalData.sessions.length = 100;
    }

    try {
      const json = JSON.stringify(app.globalData.sessions);
      const buf  = new Uint8Array(json.length);
      for (let i = 0; i < json.length; i++) buf[i] = json.charCodeAt(i) & 0xFF;

      const fd = hmFS.open('focusflow.json', hmFS.O_WRONLY | hmFS.O_CREAT | hmFS.O_TRUNC);
      hmFS.write(fd, buf.buffer, 0, buf.length);
      hmFS.close(fd);
    } catch (e) {
      console.log('[FocusFlow] Erro ao salvar:', e);
    }
  },

  // ─── Analytics inline ──────────────────────────────────────

  _calcRecommendation() {
    const { successRate } = this._calcStats();
    if (successRate < 40)      this._targetMs = 300000;  // 5min
    else if (successRate < 70) this._targetMs = 900000;  // 15min
    else                       this._targetMs = 1800000; // 30min
  },

  _calcStats() {
    const sessions = getApp().globalData.sessions;
    if (!sessions || !sessions.length) return { successRate: 0, streak: 0, total: 0 };

    const done = sessions.filter(s => s.completed).length;
    let streak = 0;
    for (const s of sessions) {
      if (s.completed) streak++;
      else break;
    }

    return {
      total:       sessions.length,
      successRate: Math.round((done / sessions.length) * 100),
      streak:      streak,
    };
  },

  _buildStatsLabel() {
    const { successRate, streak } = this._calcStats();
    return successRate + '% sucesso  |  ' + streak + ' seguidas';
  },

  // ─── Formatação ────────────────────────────────────────────

  _fmtTime(ms) {
    const total = Math.floor(ms / 1000);
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return m + ':' + s;
  },

  _fmtDuration(ms) {
    return Math.floor(ms / 60000) + 'min';
  },
});

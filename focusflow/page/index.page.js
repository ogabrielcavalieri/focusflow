import { PowerUI } from 'powerui';
import { StorageManager } from '../utils/storage.js';
import { FocusAnalytics } from '../utils/analytics.js';

Page({
  state: {
    time: '00:00',
    isRunning: false,
    recommendedDuration: 900, // 15min default
    stats: { successRate: 0, streak: 0, avgDuration: 0 },
    session: null
  },

  storage: null,
  analytics: null,

  async onInit() {
    this.storage = App.getApp().globalData.storage;
    this.analytics = new FocusAnalytics(this.storage);
    
    await this.loadStats();
    this.state.recommendedDuration = this.analytics.recommendSessionDuration();
    
    this.buildUI();
    this.updateDisplay();
  },

  async loadStats() {
    this.state.stats = this.storage.getStats();
    this.$page.setState({ stats: this.state.stats });
  },

  buildUI() {
    PowerUI.render(`
      <div class="focus-container">
        <div class="header">
          <text class="title">🎯 FocusFlow</text>
          <text class="streak">🔥 {{stats.streak}} dias</text>
        </div>

        <div class="timer-section">
          <text id="timer" class="timer">{{time}}</text>
          <text class="recommended">Recomendado: {{formatDuration(recommendedDuration)}}</text>
        </div>

        <div class="controls">
          <rect id="start-btn" class="btn primary" onclick="startFocus">
            {{isRunning ? '⏸️ PAUSAR' : '▶️ INICIAR'}}
          </rect>
          <rect id="stats-btn" class="btn secondary" onclick="showStats">
            📊
          </rect>
        </div>

        <div class="stats-mini">
          <text>✅ {{stats.successRate}}% sucesso</text>
        </div>
      </div>
    `);
  },

  // 🔄 CONTROLES PRINCIPAIS
  async startFocus() {
    if (this.state.isRunning) {
      this.pauseSession();
    } else {
      this.startSession();
    }
  },

  startSession() {
    this.state.session = {
      startTime: Date.now(),
      targetDuration: this.state.recommendedDuration * 1000,
      completed: false
    };

    this.state.isRunning = true;
    this.interval = setInterval(() => this.tick(), 1000);
    
    this.$page.setState({ 
      isRunning: true,
      time: this.formatTime(0)
    });
  },

  pauseSession() {
    if (this.state.session) {
      this.state.session.duration = Date.now() - this.state.session.startTime;
      this.state.session.completed = this.state.session.duration >= this.state.session.targetDuration * 0.9;
      this.storage.saveSession(this.state.session);
    }

    clearInterval(this.interval);
    this.state.isRunning = false;
    
    this.loadStats(); // Atualiza streak/sucesso
    this.$page.setState({ isRunning: false });
  },

  tick() {
    if (!this.state.session) return;
    
    const elapsed = Date.now() - this.state.session.startTime;
    const timeStr = this.formatTime(elapsed);
    
    this.$page.setState({ time: timeStr });

    // Vibração no alvo
    if (elapsed >= this.state.session.targetDuration && !this.state.session.completed) {
      hmDevice.vibrate([100, 200, 100]);
      this.state.session.completed = true;
    }
  },

  // 📊 UTILITÁRIOS
  formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  },

  formatDuration(ms) {
    const mins = Math.floor(ms / 1000 / 60);
    return `${mins}min`;
  },

  showStats() {
    // Mostra stats detalhados (modal simples)
    console.log('📊 Stats:', this.state.stats);
    hmUI.showToast({
      msg: `✅ ${this.state.stats.successRate}% | 🔥 ${this.state.stats.streak} dias`
    });
  },

  // 🔋 OTIMIZAÇÕES
  onHide() {
    if (this.state.isRunning) {
      this.pauseSession();
    }
  },

  onDestroy() {
    if (this.interval) clearInterval(this.interval);
  }
});

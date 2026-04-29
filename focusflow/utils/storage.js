// Gerenciador de persistência otimizada (hmFS)
export class StorageManager {
  constructor() {
    this.dbPath = 'focusflow_sessions.json';
    this.sessions = [];
  }

  async init() {
    try {
      const fs = hmFS.openReader(this.dbPath);
      const data = fs.readArraySync();
      this.sessions = data.length ? JSON.parse(data) : [];
      console.log(`📊 ${this.sessions.length} sessões carregadas`);
    } catch (e) {
      console.log('Novo banco de dados criado');
      this.sessions = [];
    }
  }

  async saveSession(session) {
    this.sessions.unshift(session); // Mais recente primeiro
    if (this.sessions.length > 100) {
      this.sessions = this.sessions.slice(0, 100); // Mantém 100 últimas
    }
    
    const writer = hmFS.openWriter(this.dbPath, 'w+');
    writer.writeArraySync(JSON.stringify(this.sessions));
    writer.close();
    
    this.syncToPhone(session);
  }

  syncToPhone(session) {
    // Envia para Zepp App via mensagem
    hmApp.sendToHost(JSON.stringify({
      event: 'focus_session',
      data: session
    }));
  }

  getStats() {
    if (!this.sessions.length) return { avgDuration: 0, successRate: 0 };
    
    const completed = this.sessions.filter(s => s.completed).length;
    const totalDuration = this.sessions.reduce((sum, s) => sum + s.duration, 0);
    
    return {
      totalSessions: this.sessions.length,
      successRate: Math.round((completed / this.sessions.length) * 100),
      avgDuration: Math.round(totalDuration / this.sessions.length / 1000), // segundos
      bestStreak: this.calculateStreak()
    };
  }

  calculateStreak() {
    let streak = 0;
    let maxStreak = 0;
    this.sessions.forEach(s => {
      if (s.completed) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    });
    return maxStreak;
  }
}

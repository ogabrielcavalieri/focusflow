// Lógica adaptativa baseada em dados
export class FocusAnalytics {
  constructor(storage) {
    this.storage = storage;
  }

  recommendSessionDuration() {
    const stats = this.storage.getStats();
    
    // Lógica adaptativa
    if (stats.successRate < 40) {
      return 300; // 5min - sessões curtas para construir hábito
    } else if (stats.successRate < 70) {
      return 900; // 15min
    } else {
      return 1800; // 30min - usuário consistente
    }
  }

  bestTimeOfDay() {
    const sessions = this.storage.sessions;
    const hours = Array(24).fill(0);
    
    sessions.forEach(s => {
      const hour = new Date(s.startTime).getHours();
      hours[hour]++;
    });
    
    return hours.indexOf(Math.max(...hours));
  }
}

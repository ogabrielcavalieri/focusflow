// Cálculos de analytics sobre sessões de foco.
// Funções puras — sem dependência de APIs do dispositivo.

export function calcStats(sessions) {
  if (!sessions || sessions.length === 0) {
    return { total: 0, successRate: 0, streak: 0, avgDurationSec: 0 };
  }

  const completed = sessions.filter(s => s.completed);
  const totalDuration = completed.reduce((sum, s) => sum + (s.duration || 0), 0);

  let streak = 0;
  for (const s of sessions) {
    if (s.completed) streak++;
    else break;
  }

  return {
    total:          sessions.length,
    successRate:    Math.round((completed.length / sessions.length) * 100),
    streak:         streak,
    avgDurationSec: completed.length
      ? Math.round(totalDuration / completed.length / 1000)
      : 0,
  };
}

// Retorna duração recomendada em ms com base na taxa de sucesso histórica.
export function recommendDuration(sessions) {
  const { successRate } = calcStats(sessions);
  if (successRate < 40) return 300000;  // 5min  — construir o hábito
  if (successRate < 70) return 900000;  // 15min — progressão
  return 1800000;                        // 30min — usuário consistente
}

// Retorna a hora do dia (0-23) com mais sessões concluídas.
export function bestHourOfDay(sessions) {
  const counts = new Array(24).fill(0);
  sessions.forEach(s => {
    if (s.completed) counts[new Date(s.startTime).getHours()]++;
  });
  return counts.indexOf(Math.max(...counts));
}

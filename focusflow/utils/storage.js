// Utilitário de persistência via hmFS (ZeppOS 2.x).
// Não é importado diretamente pela page — a lógica de salvar/carregar
// está em app.js (onCreate) e page/index.page.js (_persistSession).
// Use este módulo se quiser extrair a camada de dados futuramente.

const DB_FILE = 'focusflow.json';
const MAX_SESSIONS = 100;

export function loadSessions() {
  try {
    const [stat, err] = hmFS.stat(DB_FILE);
    if (err !== 0) return [];

    const fd  = hmFS.open(DB_FILE, hmFS.O_RDONLY);
    const buf = new Uint8Array(stat.size);
    hmFS.read(fd, buf.buffer, 0, stat.size);
    hmFS.close(fd);

    return JSON.parse(String.fromCharCode.apply(null, buf));
  } catch (e) {
    console.log('[storage] Erro ao ler:', e);
    return [];
  }
}

export function saveSessions(sessions) {
  if (sessions.length > MAX_SESSIONS) sessions = sessions.slice(0, MAX_SESSIONS);

  try {
    const json = JSON.stringify(sessions);
    const buf  = new Uint8Array(json.length);
    for (let i = 0; i < json.length; i++) buf[i] = json.charCodeAt(i) & 0xFF;

    const fd = hmFS.open(DB_FILE, hmFS.O_WRONLY | hmFS.O_CREAT | hmFS.O_TRUNC);
    hmFS.write(fd, buf.buffer, 0, buf.length);
    hmFS.close(fd);
    return true;
  } catch (e) {
    console.log('[storage] Erro ao salvar:', e);
    return false;
  }
}

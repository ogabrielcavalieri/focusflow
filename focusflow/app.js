App({
  globalData: {
    sessions: [],
  },

  onCreate(options) {
    this._loadSessions();
  },

  onDestroy() {},

  _loadSessions() {
    try {
      const [stat, err] = hmFS.stat('focusflow.json');
      if (err !== 0) return;

      const fd = hmFS.open('focusflow.json', hmFS.O_RDONLY);
      const buf = new Uint8Array(stat.size);
      hmFS.read(fd, buf.buffer, 0, stat.size);
      hmFS.close(fd);

      const text = String.fromCharCode.apply(null, buf);
      this.globalData.sessions = JSON.parse(text);
    } catch (e) {
      this.globalData.sessions = [];
    }
  },
});

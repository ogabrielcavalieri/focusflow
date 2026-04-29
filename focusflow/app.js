import FocusPage from './page/index.page.js';
import { StorageManager } from './utils/storage.js';

App({
  globalData: {
    storage: new StorageManager(),
    analytics: null
  },

  async onLaunch(options) {
    console.log('🚀 FocusFlow launched');
    this.globalData.storage.init();
  },

  onShow(options) {
    new FocusPage('page');
  }
});

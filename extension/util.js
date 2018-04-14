class SomaPlayerUtil {
  static getJSON(url) {
    return new Promise((resolve, reject) => {
      window.fetch(url).then(response => {
        return response.json();
      }).then(resolve).catch(reject);
    });
  }

  static getUrlParam(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp(`[\\?&]${name}=([^&#]*)`);
    const results = regex.exec(window.location.search);
    if (results === null) {
      return '';
    }
    return decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  static getOptions() {
    return new Promise(resolve => {
      chrome.storage.sync.get('somaplayer_options', opts => {
        resolve(opts.somaplayer_options || {})
      })
    })
  }

  static setOptions(opts) {
    return new Promise(resolve => {
      chrome.storage.sync.set({ somaplayer_options: opts }, () => resolve())
    })
  }
}

window.SomaPlayerUtil = SomaPlayerUtil

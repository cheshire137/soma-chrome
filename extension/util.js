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

  static getStations() {
    const list = window.localStorage.getItem('somaplayer_stations') || '[]'
    return JSON.parse(list)
  }

  static setStations(stations) {
    window.localStorage.setItem('somaplayer_stations', JSON.stringify(stations))
  }

  static getTrackList() {
    const list = window.localStorage.getItem('somaplayer_track_list') || '[]'
    return JSON.parse(list)
  }

  static setTrackList(tracks) {
    window.localStorage.setItem('somaplayer_track_list', JSON.stringify(tracks))
  }

  static getCurrentStation() {
    return window.localStorage.getItem('somaplayer_current_station')
  }

  static setCurrentStation(station) {
    window.localStorage.setItem('somaplayer_current_station', station)
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

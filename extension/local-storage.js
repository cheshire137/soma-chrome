class SomaLocalStorage {
  static getList(key) {
    const list = window.localStorage.getItem(key) || '[]'
    return JSON.parse(list)
  }

  static getStations() {
    return this.getList('somaplayer_stations')
  }

  static setStations(stations) {
    window.localStorage.setItem('somaplayer_stations', JSON.stringify(stations))
  }

  static getTrackList() {
    return this.getList('somaplayer_track_list')
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
}

window.SomaLocalStorage = SomaLocalStorage

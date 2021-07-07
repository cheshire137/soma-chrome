class SomaPlayerBackground {
  constructor() {
    console.debug('initializing SomaPlayer background script');
    this.findElements()
  }

  findElements() {
    this.audioTag = document.getElementById('audio')
  }

  play(station) {
    console.debug('playing', station)
    const isPaused = this.audioTag.hasAttribute('data-paused')
    if (!isPaused && SomaLocalStorage.getCurrentStation() === station &&
        this.audioTag.hasAttribute('src')) {
      return
    }

    this.resetTrackInfoIfNecessary(station)
    this.subscribe(station)
    this.audioTag.src = `${SomaPlayerConfig.somafm_station_url}/${station}`
    SomaLocalStorage.setCurrentStation(station)
    this.audioTag.removeAttribute('data-paused')
  }

  resetTrackInfoIfNecessary(station) {
    if (SomaLocalStorage.getCurrentStation() === station) {
      return
    }

    console.debug('changed station from',
                  SomaLocalStorage.getCurrentStation(), 'to', station,
                  'clearing current track info')
    SomaLocalStorage.setTrackList([])
  }

  areTracksDifferent(track1, track2) {
    if (!track1 || !track2) {
      return true
    }

    return track1.title !== track2.title ||
      track1.artist !== track2.artist ||
      track1.album !== track2.album
  }

  onTracksFetched(station, tracks) {
    console.debug('fetched track list', station)
    const newTrack = tracks[0]
    const lastTrack = SomaLocalStorage.getLastTrack()

    if (this.areTracksDifferent(newTrack, lastTrack)) {
      this.notifyOfTrack(newTrack)
    }

    SomaLocalStorage.setLastTrack(newTrack)
    SomaLocalStorage.setTrackList(tracks)
  }

  subscribe(station) {
    if (this.songListInterval) {
      clearInterval(this.songListInterval)
    }

    SomaLocalStorage.setTrackList([])

    const updateTracksList = () => {
      console.debug(`getting tracks for ${station}`)
      const api = new SomaAPI()
      api.getStationTracks(station).
        then(tracks => this.onTracksFetched(station, tracks)).
        catch(error => console.error('failed to fetch track list', station, error))
    };

    const seconds = 30;
    const secons_hours = 60;
    this.songListInterval = setInterval(updateTracksList, seconds * 1000)

    updateTracksList()
  }

  notifyOfTrack(track) {
    if (typeof this.notifyTimer !== 'undefined') {
      clearTimeout(this.notifyTimer)
    }

    SomaPlayerUtil.getOptions().then(opts => {
      // Default to showing notifications, so if user has not saved preferences,
      // assume they want notifications.
      if (opts.notifications === false) {
        return
      }

      const notification = {
        type: 'basic',
        title: track.artist,
        message: track.title,
        iconUrl: 'icon48.png'
      }

      const station = SomaLocalStorage.getCurrentStation()
      if (station && station.length > 0) {
        notification.iconUrl = `station-images/${station}.png`
      }

      const delay = 15000 // 15 seconds
      console.debug('notifying in', (delay / 1000), 'seconds', notification)
      this.notifyTimer = setTimeout(() => {
        chrome.notifications.create('', notification, () => {})
      }, delay)
    })
  }

  getVolume() {
    console.debug('current volume', this.audioTag.volume)
    return this.audioTag.volume
  }

  setVolume(volume) {
    console.debug('setting volume to', volume)
    this.audioTag.volume = volume
  }

  pause(station) {
    if (typeof station === 'undefined') {
      station = SomaLocalStorage.getCurrentStation()
    }

    if (!station || station.length < 1) {
      return
    }

    console.debug('pausing station', station)
    this.unsubscribe(station)
    this.audioTag.pause()
    this.audioTag.currentTime = 0
    this.audioTag.setAttribute('data-paused', 'true')
  }

  togglePlay() {
    const station = SomaLocalStorage.getCurrentStation()
    const haveStation = station && station.length > 0
    if (!haveStation) {
      return
    }

    if (this.audioTag.hasAttribute('data-paused')) {
      this.play(station)
    } else {
      this.pause(station)
    }
  }

  clear() {
    const info = this.getInfo()
    this.unsubscribe(info.station)
    this.audioTag.pause()
    this.audioTag.currentTime = 0
    this.audioTag.setAttribute('data-station', '')
    this.audioTag.removeAttribute('data-paused')
  }

  unsubscribe(station) {
    if (!(typeof station === 'string' && station.length > 0)) {
      return
    }

    console.debug('unsubscribing from', station)
    if (this.notifyTimer) {
      clearTimeout(this.notifyTimer)
    }

    if (this.songListInterval) {
      clearInterval(this.songListInterval)
    }
  }

  getInfo() {
    const station = SomaLocalStorage.getCurrentStation()
    console.log('station', station)

    return {
      station,
      tracks: SomaLocalStorage.getTrackList(),
      paused: this.audioTag.hasAttribute('data-paused') || station === ''
    }
  }
}

let somaPlayerBG;

document.addEventListener('DOMContentLoaded', () => {
  somaPlayerBG = new SomaPlayerBackground()
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (typeof somaPlayerBG === 'undefined') {
    return
  }

  console.debug('received', request.action, request)

  if (request.action === 'play') {
    somaPlayerBG.play(request.station)
    sendResponse()
    return true
  }

  if (request.action === 'pause') {
    somaPlayerBG.pause(request.station)
    sendResponse()
    return true
  }

  if (request.action === 'info') {
    const info = somaPlayerBG.getInfo()
    console.debug('info', info)
    sendResponse(info)
    return true
  }

  if (request.action === 'clear') {
    somaPlayerBG.clear()
    sendResponse()
    return true
  }

  if (request.action === 'refresh_stations') {
    const api = new SomaAPI()
    api.getStations().then(stations => {
      console.debug('fetched list of stations', stations)
      SomaLocalStorage.setStations(stations)
      sendResponse(stations)
    }).catch(error => sendResponse(null, error))
    return true
  }

  if (request.action === 'get_stations') {
    const stations = SomaLocalStorage.getStations()
    console.debug('got saved list of stations', stations)
    sendResponse(stations)
    return true;
  }

  if (request.action === 'change_volume') {
    somaPlayerBG.setVolume(request.volume)
    sendResponse()
    return true
  }

  if (request.action === 'get_volume') {
    sendResponse(somaPlayerBG.getVolume())
    return true
  }
})

chrome.commands.onCommand.addListener(command => {
  if (typeof somaPlayerBG === 'undefined') {
    return
  }

  if (command === 'play-pause-station') {
    somaPlayerBG.togglePlay()
  } else if (command === 'pause-station') {
    somaPlayerBG.pause()
  }
})

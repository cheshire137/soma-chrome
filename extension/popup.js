class SomaPlayerPopup {
  constructor() {
    this.findElements()
    this.handleLinks()
    this.hookupMenu()
    this.applyTheme()
    this.fetchSomaStations()
    this.listenForPlayback()
  }

  hookupMenu() {
    this.stationMenuToggle.addEventListener('click', () => {
      if (this.stationMenuToggle.classList.contains('disabled')) {
        return
      }
      this.toggleStationMenu()
    })
    window.addEventListener('click', event => {
      const dropdown = event.target.closest('.dropdown')
      if (!dropdown) {
        this.closeStationMenu()
      }
    })
  }

  closeStationMenu() {
    const container = this.stationMenuToggle.closest('.dropdown')
    this.stationMenuToggle.blur()
    container.classList.remove('active')
    this.stationMenuToggle.classList.remove('selected')
  }

  toggleStationMenu() {
    const container = this.stationMenuToggle.closest('.dropdown')
    this.stationMenuToggle.blur()
    container.classList.toggle('active')
    this.stationMenuToggle.classList.toggle('selected')
  }

  listenForPlayback() {
    this.playButton.addEventListener('click', () => this.play())
    this.pauseButton.addEventListener('click', () => this.pause())
  }

  findElements() {
    this.stationMenuToggle = document.getElementById('station-menu-toggle')
    this.stationListEl = document.getElementById('station-list')
    this.stationListItemTpl = document.getElementById('station-list-item-template')
    this.playButton = document.getElementById('play')
    this.pauseButton = document.getElementById('pause')
    this.currentInfoEl = document.getElementById('currently-playing')
    this.trackListEl = document.getElementById('track-list')
    this.trackListItemTpl = document.getElementById('track-list-item-template')
    this.stationImg = document.getElementById('station-image')
  }

  onStationKeypress(keyCode) {
    if (keyCode !== 13) { // Enter
      return
    }

    if (this.stationMenuToggle.value === '') {
      return
    }

    if (!(this.playButton.disabled ||
          this.playButton.classList.contains('d-none'))) {
      console.debug('pressing play button')
      this.play()
    }

    if (!(this.pauseButton.disabled ||
          this.pauseButton.classList.contains('d-none'))) {
      console.debug('pressing pause button')
      this.pause()
    }
  }

  insertStationOptions(stations) {
    for (const data of stations) {
      const listItem = this.createStationListItem(data)
      this.stationListEl.appendChild(listItem)
    }

    this.stationMenuToggle.classList.remove('disabled')
    this.loadCurrentInfo()
  }

  loadDefaultStations() {
    console.debug('loading default station list')
    const url = chrome.extension.getURL('defaultStations.json')
    SomaPlayerUtil.getJSON(url).
      then(defaultStations => this.insertStationOptions(defaultStations))
  }

  fetchSomaStations() {
    chrome.runtime.sendMessage({ action: 'get_stations' }, stations => {
      if (!stations || stations.length < 1) {
        const msg = { action: 'refresh_stations' }
        chrome.runtime.sendMessage(msg, (stations, error) => {
          if (error) {
            console.error('failed to fetch stations, using defaults')
            this.loadDefaultStations()
          } else {
            console.debug('fetched stations', stations)
            this.insertStationOptions(stations)
          }
        })
      } else {
        console.debug('stations already stored', stations)
        this.insertStationOptions(stations)
      }
    })
  }

  emptyTrackList() {
    while (this.trackListEl.hasChildNodes()) {
      this.trackListEl.removeChild(this.trackListEl.lastChild);
    }
  }

  listTracks(tracks) {
    this.emptyTrackList()

    for (const track of tracks) {
      const listItem = this.createTrackListItem(track)
      this.trackListEl.appendChild(listItem)
    }
  }

  onStationButtonClick(event) {
    const button = event.currentTarget
    const stationID = button.value
    const stationName = button.querySelector('.station-name').textContent

    button.blur()
    this.toggleStationMenu()
    this.stationChanged(stationID, stationName)
  }

  createStationListItem(data) {
    const el = this.stationListItemTpl.content.cloneNode(true)
    const button = el.querySelector('.station-button')
    const nameEl = el.querySelector('.station-name')
    const imageEl = el.querySelector('.station-image')

    imageEl.src = `station-images/${data.id}.png`
    button.value = data.id
    nameEl.textContent = data.title
    button.addEventListener('click', e => this.onStationButtonClick(e))

    return el
  }

  createTrackListItem(track) {
    const el = this.trackListItemTpl.content.cloneNode(true)
    const nameEl = el.querySelector('.track-name')
    const artistEl = el.querySelector('.artist')
    const timeEl = el.querySelector('.track-date')
    const date = new Date(track.date)

    nameEl.textContent = track.title
    artistEl.textContent = track.artist
    timeEl.textContent = this.prettyDate(date)

    return el
  }

  prettyDate(date) {
    const fullHours = date.getHours()
    const hours = fullHours - 12
    let minutes = date.getMinutes()
    if (minutes < 10) {
      minutes = `0${minutes}`
    }
    let amPM = 'am'
    if (fullHours >= 12) {
      amPM = 'pm'
    }
    return `${hours}:${minutes} ${amPM}`
  }

  hideTrackInfo() {
    this.emptyTrackList()
    this.trackListEl.classList.add('d-none')
  }

  loadCurrentInfo() {
    this.stationMenuToggle.classList.add('disabled')

    chrome.runtime.sendMessage({ action: 'info' }, info => {
      console.debug('finished info request, info', info);
      const currentStationButton = document.querySelector(`.station-button[value="${info.station}"]`)
      if (currentStationButton) {
        this.stationMenuToggle.textContent = currentStationButton.textContent
      }

      if (info.paused) {
        this.stationIsPaused()
      } else {
        this.stationIsPlaying()
      }

      this.updateStationImage(info.station)
      this.stationMenuToggle.classList.remove('disabled')
      this.listTracks(info.tracks)
    })
  }

  stationIsPlaying() {
    this.pauseButton.classList.remove('d-none')
    this.playButton.classList.add('d-none')
    this.stationMenuToggle.focus()
  }

  stationIsPaused() {
    this.pauseButton.classList.add('d-none')
    this.playButton.classList.remove('d-none')
    this.playButton.disabled = false
    this.stationMenuToggle.focus()
  }

  play() {
    const station = this.stationMenuToggle.value
    console.debug('play', station)
    this.updateStationImage(station)

    chrome.runtime.sendMessage({ action: 'play', station }, () => {
      console.debug('finishing telling station to play')
      this.stationIsPlaying()

      chrome.runtime.sendMessage({ action: 'info' }, info => {
        if (info.tracks && info.tracks.length > 0) {
          this.listTracks(info.tracks)
        } else {
          const api = new SomaAPI()
          api.getStationTracks(station).then(tracks => this.listTracks(tracks))
        }
      });
    });
  }

  pause() {
    const station = this.stationMenuToggle.value
    console.debug('pausing station', station)

    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'pause', station }, () => {
        this.stationIsPaused()
        this.stationMenuToggle.focus()
        resolve()
      })
    })
  }

  updateStationImage(station) {
    if (station && station.length > 0) {
      this.stationImg.src = `station-images/${station}.png`
      this.stationImg.classList.remove('d-none')
    } else {
      this.stationImg.classList.add('d-none')
    }
  }

  stationChanged(stationID, stationName) {
    if (stationID === '') {
      chrome.runtime.sendMessage({ action: 'clear' }, () => {
        console.debug('station cleared')
        this.playButton.disabled = true
        this.hideTrackInfo()
        this.pause()
      })
      return
    }

    this.stationMenuToggle.value = stationID
    this.stationMenuToggle.textContent = stationName
    this.closeStationMenu()

    chrome.runtime.sendMessage({ action: 'info' }, info => {
      const currentStation = info.station

      if (stationID !== currentStation) {
        console.debug(`station changed to ${stationID}`)
        this.playButton.disabled = false
        this.pause().then(() => this.play())
      }
    })
  }

  handleLinks() {
    const links = Array.from(document.querySelectorAll('a'));
    for (let i = 0; i < links.length; i++) {
      this.handleLink(links[i]);
    }
  }

  handleLink(link) {
    link.addEventListener('click', event => {
      event.preventDefault();
      let url;
      const href = link.href;
      const optionsSuffix = '#options';
      if (href.indexOf(optionsSuffix) === href.length - optionsSuffix.length) {
        url = chrome.extension.getURL('options.html');
      } else {
        url = href;
      }
      chrome.tabs.create({ url });
      return false;
    });
  }

  applyTheme() {
    return SomaPlayerUtil.getOptions().then(opts => {
      const theme = opts.theme || 'light';
      return document.body.classList.add(`theme-${theme}`);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SomaPlayerPopup();
});

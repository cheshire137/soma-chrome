class SomaPlayerPopup {
  constructor() {
    this.base = this;
    this.findElements();
    this.handleLinks();
    this.applyTheme();
    this.fetchSomaStations();
    this.listenForPlayback();
    this.listenForStationChange();
  }

  listenForStationChange() {
    this.stationSelect.addEventListener('change', () => {
      this.stationChanged();
    });
    this.stationSelect.addEventListener('keypress', e => {
      this.onStationKeypress(e.keyCode);
    });
  }

  listenForPlayback() {
    this.playButton.addEventListener('click', () => {
      this.play();
    });
    this.pauseButton.addEventListener('click', () => {
      this.pause();
    });
  }

  findElements() {
    this.stationSelect = document.getElementById('station')
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

    if (this.stationSelect.value === '') {
      return
    }

    if (!(this.playButton.disabled ||
          this.playButton.classList.contains('hidden'))) {
      console.debug('pressing play button')
      this.play()
    }

    if (!(this.pauseButton.disabled ||
          this.pauseButton.classList.contains('hidden'))) {
      console.debug('pressing pause button')
      this.pause()
    }
  }

  insertStationOptions(stations) {
    for (let i = 0; i < stations.length; i++) {
      const option = document.createElement('option')

      option.value = stations[i].id
      option.textContent = stations[i].title

      this.stationSelect.appendChild(option)
    }

    this.stationSelect.disabled = false
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
        const msg = { action: 'fetch_stations' }
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

  createTrackListItem(track) {
    console.log(track)
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
    this.trackListEl.classList.add('hidden')
  }

  loadCurrentInfo() {
    this.stationSelect.disabled = true

    chrome.runtime.sendMessage({ action: 'info' }, info => {
      console.debug('finished info request, info', info);
      this.stationSelect.value = info.station

      if (info.paused) {
        this.stationIsPaused()
      } else {
        this.stationIsPlaying()
      }

      this.updateStationImage(info.station)
      this.stationSelect.disabled = false
      this.listTracks(info.tracks)
    })
  }

  stationIsPlaying() {
    this.pauseButton.classList.remove('hidden');
    this.playButton.classList.add('hidden');
    this.stationSelect.focus();
  }

  stationIsPaused() {
    this.pauseButton.classList.add('hidden');
    this.playButton.classList.remove('hidden');
    this.playButton.disabled = false;
    this.stationSelect.focus();
  }

  play() {
    const station = this.stationSelect.value
    console.debug('play button clicked, station', station)
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
    const station = this.stationSelect.value
    console.debug('pausing station', station)

    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'pause', station }, () => {
        this.stationIsPaused()
        this.stationSelect.focus()
        resolve()
      })
    })
  }

  updateStationImage(station) {
    if (station && station.length > 0) {
      this.stationImg.src = `station-images/${station}.png`;
      this.stationImg.classList.remove('hidden');
    } else {
      this.stationImg.classList.add('hidden');
    }
  }

  stationChanged() {
    const newStation = this.stationSelect.value;
    if (newStation === '') {
      chrome.runtime.sendMessage({ action: 'clear' }, () => {
        console.debug('station cleared');
        this.playButton.disabled = true;
        this.hideTrackInfo();
        this.pause();
      });
    } else {
      chrome.runtime.sendMessage({ action: 'info' }, info => {
        const currentStation = info.station;
        if (newStation !== '' && newStation !== currentStation) {
          console.debug(`station changed to ${newStation}`);
          this.playButton.disabled = false;
          this.pause().then(this.play.bind(this));
        }
      });
    }
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

class SomaPlayerPopup {
  constructor() {
    this.base = this;
    this.findElements();
    this.handleLinks();
    this.applyTheme();
    this.fetchSomaStations();
    this.fetchVolume();
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
    this.volumeSlider.addEventListener('mousemove', e => {
      if (e.buttons === 1) {
        this.setVolume(e);
      }
    });
    this.volumeSlider.addEventListener('click', e => {
      this.setVolume(e);
    });
  }

  findElements() {
    this.stationSelect = document.getElementById('station');
    this.playButton = document.getElementById('play');
    this.pauseButton = document.getElementById('pause');
    this.currentInfoEl = document.getElementById('currently-playing');
    this.titleEl = document.getElementById('title');
    this.artistEl = document.getElementById('artist');
    this.stationImg = document.getElementById('station-image');
    this.volumeSlider = document.getElementById('volume');
  }

  onStationKeypress(keyCode) {
    if (keyCode !== 13) { // Enter
      return;
    }
    if (this.stationSelect.value === '') {
      return;
    }
    if (!(this.playButton.disabled ||
          this.playButton.classList.contains('hidden'))) {
      console.debug('pressing play button');
      this.play();
    }
    if (!(this.pauseButton.disabled ||
          this.pauseButton.classList.contains('hidden'))) {
      console.debug('pressing pause button');
      this.pause();
    }
  }

  insertStationOptions(stations) {
    for (let i = 0; i < stations.length; i++) {
      const option = document.createElement('option');
      option.value = stations[i].id;
      option.textContent = stations[i].title;
      this.stationSelect.appendChild(option);
    }
    this.stationSelect.disabled = false;
    this.loadCurrentInfo();
  }

  loadDefaultStations() {
    console.debug('loading default station list');
    const url = chrome.extension.getURL('defaultStations.json');
    SomaPlayerUtil.getJSON(url).then(defaultStations => {
      this.insertStationOptions(defaultStations);
    });
  }

  fetchSomaStations() {
    chrome.runtime.sendMessage({ action: 'get_stations' }, cache => {
      console.log('stations already stored', cache);
      if (!cache || cache.length < 1) {
        const msg = { action: 'fetch_stations' };
        chrome.runtime.sendMessage(msg, (stations, error) => {
          if (error) {
            this.loadDefaultStations();
          } else {
            this.insertStationOptions(stations);
          }
        });
      } else {
        this.insertStationOptions(cache);
      }
    });
  }

  fetchVolume() {
    chrome.runtime.sendMessage({ action: 'get_volume' }, volume => {
      this.volumeSlider.value = volume * this.volumeSlider.max;
    });
  }

  displayTrackInfo(info) {
    if (info.artist || info.title) {
      this.titleEl.textContent = info.title;
      this.artistEl.textContent = info.artist;
      this.currentInfoEl.classList.remove('hidden');
    }
  }

  hideTrackInfo() {
    this.titleEl.textContent = '';
    this.artistEl.textContent = '';
    this.currentInfoEl.classList.add('hidden');
  }

  loadCurrentInfo() {
    this.stationSelect.disabled = true;
    chrome.runtime.sendMessage({ action: 'info' }, info => {
      console.debug('finished info request, info', info);
      this.stationSelect.value = info.station;
      if (info.paused) {
        this.stationIsPaused();
      } else {
        this.stationIsPlaying();
      }
      this.updateStationImage(info.station);
      this.stationSelect.disabled = false;
      this.displayTrackInfo(info);
    });
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
    const station = this.stationSelect.value;
    console.debug('play button clicked, station', station);
    this.updateStationImage(station);
    chrome.runtime.sendMessage({ action: 'play', station }, () => {
      console.debug('finishing telling station to play');
      this.stationIsPlaying();
      chrome.runtime.sendMessage({ action: 'info' }, info => {
        if (info.artist !== '' || info.title !== '') {
          this.displayTrackInfo(info);
        } else {
          SomaPlayerUtil.getCurrentTrackInfo(station).then(info => {
            this.displayTrackInfo(info);
          });
        }
      });
    });
  }

  pause() {
    const station = this.stationSelect.value;
    console.debug('pause button clicked, station', station);
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'pause', station }, () => {
        console.debug('finished telling station to pause');
        this.stationIsPaused();
        this.stationSelect.focus();
        resolve();
      });
    });
  }

  setVolume(event) {
    const volume = event.offsetX / this.volumeSlider.offsetWidth;
    this.volumeSlider.value = volume * this.volumeSlider.max;
    chrome.runtime.sendMessage({ action: 'volume', volume });
  }

  updateStationImage(station) {
    if (!this.stationImg) {
      this.stationImg = document.createElement('img');
      this.stationImg.className = 'hidden';
      this.stationImg.id = 'station-image';
      const nextSibling = this.titleEl.parentNode;
      const container = nextSibling.parentNode;
      container.insertBefore(this.stationImg, nextSibling);
    }
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

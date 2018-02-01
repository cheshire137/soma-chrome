const __bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
};

class SomaPlayerBackground {
  constructor() {
    console.debug('initializing SomaPlayer background script');
    this.onTrack = __bind(this.onTrack, this);
    this.createAudioTag();
    this.createTitleEl();
    this.createArtistEl();
  }

  createAudioTag() {
    this.audioTag = document.querySelector('audio');
    if (!this.audioTag) {
      console.debug('adding new audio tag');
      this.audioTag = document.createElement('audio');
      this.audioTag.setAttribute('autoplay', 'true');
      this.audioTag.setAttribute('data-station', '');
      document.body.appendChild(this.audioTag);
    }
  }

  createTitleEl() {
    this.titleEl = document.getElementById('title');
    if (!this.titleEl) {
      this.titleEl = document.createElement('div');
      this.titleEl.id = 'title';
      document.body.appendChild(this.titleEl);
    }
  }

  createArtistEl() {
    this.artistEl = document.getElementById('artist');
    if (!this.artistEl) {
      this.artistEl = document.createElement('div');
      this.artistEl.id = 'artist';
      document.body.appendChild(this.artistEl);
    }
  }

  play(station) {
    console.debug('playing station', station);
    this.resetTrackInfoIfNecessary(station);
    this.subscribe(station);
    this.socket.on('track', this.onTrack);
    this.audioTag.src = SomaPlayerConfig.somafm_station_url + station;
    this.audioTag.setAttribute('data-station', station);
    this.audioTag.removeAttribute('data-paused');
  }

  resetTrackInfoIfNecessary(station) {
    if (this.audioTag.getAttribute('data-station') === station) {
      return;
    }
    console.debug('changed station from',
                  this.audioTag.getAttribute('data-station'), 'to', station,
                  'clearing current track info');
    this.titleEl.textContent = '';
    this.artistEl.textContent = '';
  }

  displayCurrentTrack(station) {
    return SomaPlayerUtil.getCurrentTrackInfo(station).then(track => {
      this.titleEl.textContent = track.title;
      this.artistEl.textContent = track.artist;
    });
  }

  subscribe(station) {
    const emitSubscribe = () => {
      this.socket.emit('subscribe', station, response => {
        if (response.subscribed) {
          console.debug('subscribed to', station);
          this.displayCurrentTrack(station);
        } else {
          console.error('failed to subscribe to', station, response);
        }
      });
    };
    if (typeof this.socket === 'undefined') {
      console.debug('connecting to socket', SomaPlayerConfig.scrobbler_api_url);
      this.socket = io.connect(SomaPlayerConfig.scrobbler_api_url);
    }
    if (this.socket.connected) {
      emitSubscribe();
    } else {
      this.socket.on('connect', () => {
        emitSubscribe();
      });
    }
  }

  onTrack(track) {
    console.debug('new track', track.title, track.artist);
    this.titleEl.textContent = track.title;
    this.artistEl.textContent = track.artist;
    SomaPlayerUtil.getOptions().then(opts => {
      this.notifyOfTrack(track, opts);
    });
  }

  notifyOfTrack(track, opts) {
    if (typeof this.notifyTimer !== 'undefined') {
      clearTimeout(this.notifyTimer);
    }
    // Default to showing notifications, so if user has not saved preferences,
    // assume they want notifications.
    if (opts.notifications === false) {
      return;
    }
    const notification = {
      type: 'basic',
      title: track.artist,
      message: track.title,
      iconUrl: 'icon48.png'
    };
    if (this.audioTag && this.audioTag.hasAttribute('data-station')) {
      const station = this.audioTag.getAttribute('data-station');
      if (station.length > 0) {
        notification.iconUrl = `station-images/${station}.png`;
      }
    }
    const delay = 15000; // 15 seconds
    console.debug('notifying in', (delay / 1000), 'seconds', notification);
    this.notifyTimer = setTimeout(() => {
      chrome.notifications.create('', notification, () => {});
    }, delay);
  }

  trackHasDuration(track) {
    return typeof track.duration === 'number' && track.duration > 0;
  }

  pause(station) {
    if (!this.audioTag) {
      return;
    }
    if (typeof station === 'undefined') {
      station = this.audioTag.getAttribute('data-station');
    }
    if (!station || station.length < 1) {
      return;
    }
    console.debug('pausing station', station);
    this.unsubscribe(station);
    this.audioTag.pause();
    this.audioTag.currentTime = 0;
    this.audioTag.setAttribute('data-paused', 'true');
  }

  togglePlay() {
    if (!this.audioTag) {
      return;
    }
    const station = this.audioTag.getAttribute('data-station');
    const haveStation = station && station.length > 0;
    if (!haveStation) {
      return;
    }
    if (this.audioTag.hasAttribute('data-paused')) {
      this.play(station);
    } else {
      this.pause(station);
    }
  }

  clear() {
    const info = this.getInfo();
    this.unsubscribe(info.station);
    this.audioTag.pause();
    this.audioTag.currentTime = 0;
    this.audioTag.setAttribute('data-station', '');
    this.audioTag.removeAttribute('data-paused');
  }

  unsubscribe(station) {
    if (!(typeof station === 'string' && station.length > 0)) {
      return;
    }
    if (typeof this.socket === 'undefined') {
      return;
    }
    console.debug('unsubscribing from', station);
    this.socket.emit('unsubscribe', station, response => {
      if (!response.unsubscribed) {
        console.error('failed to unsubscribe from', station);
      }
    });
    this.socket.removeListener('track', this.onTrack);
    if (typeof this.notifyTimer !== 'undefined') {
      clearTimeout(this.notifyTimer);
    }
  }

  getInfo() {
    let station = '';
    if (this.audioTag) {
      station = this.audioTag.getAttribute('data-station') || '';
    }
    return {
      station,
      artist: this.artistEl.textContent,
      title: this.titleEl.textContent,
      paused: this.audioTag.hasAttribute('data-paused') || station === ''
    };
  }

  setStations(stations) {
    console.debug('set stations', stations);
    SomaPlayerUtil.getOptions().then(opts => {
      opts.stations = stations;
      SomaPlayerUtil.setOptions(opts);
    });
  }

  getStations() {
    return new Promise(resolve => {
      SomaPlayerUtil.getOptions().then(opts => {
        resolve(opts.stations);
      });
    });
  }

  fetchStations() {
    const url = `${SomaPlayerConfig.somafm_api_url}channels.json`;
    console.debug(`fetching channels list from ${url}`);
    return new Promise((resolve, reject) => {
      SomaPlayerUtil.getJSON(url).then(data => {
        console.debug('fetched stations list', data);
        const simpleStations = this.extractStations(data);
        this.setStations(simpleStations);
        resolve(simpleStations);
      }).catch((xhr, status, error) => {
        console.error('failed to fetch stations list', error);
        reject(error);
      });
    });
  }

  extractStations(data) {
    const stations = data.channels.map(station => {
      return { id: station.id, title: station.title };
    });
    stations.sort(this.stationCompare);
    return stations;
  }

  stationCompare(a, b) {
    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
  }
}

let somaPlayerBG;

document.addEventListener('DOMContentLoaded', () => {
  somaPlayerBG = new SomaPlayerBackground();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (typeof somaPlayerBG === 'undefined') {
    return;
  }
  console.debug('received:', request.action, request);
  if (request.action === 'play') {
    somaPlayerBG.play(request.station);
    sendResponse();
    return true;
  }
  if (request.action === 'pause') {
    somaPlayerBG.pause(request.station);
    sendResponse();
    return true;
  }
  if (request.action === 'info') {
    const info = somaPlayerBG.getInfo();
    console.debug('info:', info);
    sendResponse(info);
    return true;
  }
  if (request.action === 'clear') {
    somaPlayerBG.clear();
    sendResponse();
    return true;
  }
  if (request.action === 'fetch_stations') {
    somaPlayerBG.fetchStations().then(stations => {
      sendResponse(stations);
    }).catch(error => {
      sendResponse(null, error);
    });
    return true;
  }
  if (request.action === 'get_stations') {
    somaPlayerBG.getStations().then(stations => {
      console.debug('got saved list of stations:', stations);
      sendResponse(stations);
    });
    return true;
  }
});

chrome.commands.onCommand.addListener(command => {
  if (typeof somaPlayerBG === 'undefined') {
    return;
  }
  if (command === 'play-pause-station') {
    somaPlayerBG.togglePlay();
  } else if (command === 'pause-station') {
    somaPlayerBG.pause();
  }
});

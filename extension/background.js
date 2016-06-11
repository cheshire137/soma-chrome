const __bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
};

class SomaPlayerBackground {
  constructor() {
    console.debug('initializing SomaPlayer background script');
    this.onTrack = __bind(this.onTrack, this);
    this.lastfm = SomaPlayerUtil.getLastfmConnection();
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
    console.debug('new track:', track);
    this.titleEl.textContent = track.title;
    this.artistEl.textContent = track.artist;
    SomaPlayerUtil.getOptions().then(opts => {
      this.notifyOfTrack(track, opts);
      this.scrobbleTrack(track, opts);
    });
  }

  notifyOfTrack(track, opts) {
    // Default to showing notifications, so if user has not saved preferences,
    // assume they want notifications.
    if (opts.notifications === false) {
      return;
    }
    const notificationOpts = {
      type: 'basic',
      title: track.artist,
      message: track.title,
      iconUrl: 'icon48.png'
    };
    return chrome.notifications.create('', notificationOpts, () => {});
  }

  getScrobbleData(track, opts) {
    return {
      artist: (track.artist || '').replace(/"/g, "'"),
      track: (track.title || '').replace(/"/g, "'"),
      user: opts.lastfm_user,
      chosenByUser: 0,
      timestamp: Math.round((new Date()).getTime() / 1000)
    };
  }

  scrobbleTrack(track, opts) {
    if (!(opts.lastfm_session_key && opts.lastfm_user && opts.scrobbling)) {
      return;
    }
    console.debug('scrobbling track for Last.fm user', opts.lastfm_user);
    const data = this.getScrobbleData(track, opts);
    const auth = { key: opts.lastfm_session_key };
    return this.lastfm.track.scrobble(data, auth, {
      success() {
        let e;
        try {
          const iframeWin = document.querySelector('iframe').contentWindow;
          iframeWin.document.querySelector('form').submit();
          console.debug('scrobbled track', track.title, track.artist);
        } catch (_error) {
          // Mysterious second submit after scrobble form has already POSTed
          // to Last.fm and the iframe has its origin changed to
          // ws.audioscrobbler.com, which can't be touched by the extension.
          e = _error;
          if (e.name !== 'SecurityError') {
            throw e;
          }
        }
      },
      error(data) {
        console.error('failed to scrobble track', track, 'response:', data);
      }
    });
  }

  pause(station) {
    console.debug('pausing station', station);
    this.unsubscribe(station);
    this.audioTag.pause();
    this.audioTag.currentTime = 0;
    this.audioTag.setAttribute('data-paused', 'true');
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
    console.debug('unsubscribing from', station, '...');
    this.socket.emit('unsubscribe', station, response => {
      if (response.unsubscribed) {
        console.debug('unsubscribed from', station);
      } else {
        console.error('failed to unsubscribe from', station);
      }
    });
    console.debug('removing track listener');
    this.socket.removeListener('track', this.onTrack);
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
      window.fetch(url).then(response => {
        return response.json();
      }).then(data => {
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
    return data.channels.map(station => {
      return { id: station.id, title: station.title };
    });
  }
}

let somaPlayerBG;

document.addEventListener('DOMContentLoaded', () => {
  somaPlayerBG = new SomaPlayerBackground();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

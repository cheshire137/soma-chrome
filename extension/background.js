const __bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
};

let somaPlayerBG;

const SomaPlayerBackground = (function() {
  function SomaPlayerBackground() {
    this.onTrack = __bind(this.onTrack, this);
    console.debug('initializing SomaPlayer background script');
    this.lastfm = SomaPlayerUtil.getLastfmConnection();
    this.audio = document.querySelector('audio');
    if (!this.audio) {
      console.debug('adding new audio tag');
      this.audio = document.createElement('audio');
      this.audio.setAttribute('autoplay', 'true');
      this.audio.setAttribute('data-station', '');
      document.body.appendChild(this.audio);
    }
    this.titleEl = document.getElementById('title');
    if (!this.titleEl) {
      this.titleEl = document.createElement('div');
      this.titleEl.id = 'title';
      document.body.appendChild(this.titleEl);
    }
    this.artistEl = document.getElementById('artist');
    if (!this.artistEl) {
      this.artistEl = document.createElement('div');
      this.artistEl.id = 'artist';
      document.body.appendChild(this.artistEl);
    }
  }

  SomaPlayerBackground.prototype.play = function(station) {
    console.debug('playing station', station);
    this.resetTrackInfoIfNecessary(station);
    this.subscribe(station);
    console.debug('adding track listener');
    this.socket.on('track', this.onTrack);
    this.audio.src = SomaPlayerConfig.somafm_station_url + station;
    this.audio.setAttribute('data-station', station);
    this.audio.removeAttribute('data-paused');
  };

  SomaPlayerBackground.prototype.resetTrackInfoIfNecessary = function(station) {
    if (this.audio.getAttribute('data-station') === station) {
      return;
    }
    console.debug('changed station from',
                  this.audio.getAttribute('data-station'), 'to', station,
                  ', clearing current track info');
    this.titleEl.textContent = '';
    this.artistEl.textContent = '';
  };

  SomaPlayerBackground.prototype.getCurrentTrackInfo = function(station) {
    return SomaPlayerUtil.getCurrentTrackInfo(station).then(track => {
      this.titleEl.textContent = track.title;
      this.artistEl.textContent = track.artist;
    });
  };

  SomaPlayerBackground.prototype.subscribe = function(station) {
    const emitSubscribe = () => {
      this.socket.emit('subscribe', station, response => {
        if (response.subscribed) {
          console.debug('subscribed to', station);
          this.getCurrentTrackInfo(station);
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
  };

  SomaPlayerBackground.prototype.onTrack = function(track) {
    console.debug('new track:', track);
    this.titleEl.textContent = track.title;
    this.artistEl.textContent = track.artist;
    SomaPlayerUtil.getOptions().then(opts => {
      this.notifyOfTrack(track, opts);
      this.scrobbleTrack(track, opts);
    });
  };

  SomaPlayerBackground.prototype.notifyOfTrack = function(track, opts) {
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
  };

  SomaPlayerBackground.prototype.scrobbleTrack = function(track, opts) {
    if (!(opts.lastfm_session_key && opts.lastfm_user && opts.scrobbling)) {
      return;
    }
    console.debug('scrobbling track for Last.fm user', opts.lastfm_user);
    const scrobbleData = {
      artist: (track.artist || '').replace(/"/g, "'"),
      track: (track.title || '').replace(/"/g, "'"),
      user: opts.lastfm_user,
      chosenByUser: 0,
      timestamp: Math.round((new Date()).getTime() / 1000)
    };
    return this.lastfm.track.scrobble(scrobbleData, {
      key: opts.lastfm_session_key
    }, {
      success() {
        let e;
        try {
          const iframeWin = document.querySelector('iframe').contentWindow;
          iframeWin.document.querySelector('form').submit();
          console.debug('scrobbled track', scrobbleData);
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
  };

  SomaPlayerBackground.prototype.pause = function(station) {
    console.debug('pausing station', station);
    this.unsubscribe(station);
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.setAttribute('data-paused', 'true');
  };

  SomaPlayerBackground.prototype.clear = function() {
    const info = this.getInfo();
    this.unsubscribe(info.station);
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.setAttribute('data-station', '');
    this.audio.removeAttribute('data-paused');
  };

  SomaPlayerBackground.prototype.unsubscribe = function(station) {
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
  };

  SomaPlayerBackground.prototype.getInfo = function() {
    let station = '';
    if (this.audio) {
      station = this.audio.getAttribute('data-station') || '';
    }
    return {
      station,
      artist: this.artistEl.textContent,
      title: this.titleEl.textContent,
      paused: this.audio.hasAttribute('data-paused') || station === ''
    };
  };

  SomaPlayerBackground.prototype.setStations = function(stations) {
    console.debug('set stations', stations);
    SomaPlayerUtil.getOptions().then(opts => {
      opts.stations = stations;
      SomaPlayerUtil.setOptions(opts);
    });
  };

  SomaPlayerBackground.prototype.getStations = function() {
    return new Promise(resolve => {
      SomaPlayerUtil.getOptions().then(opts => {
        resolve(opts.stations);
      });
    });
  };

  SomaPlayerBackground.prototype.fetchStations = function() {
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
  };

  SomaPlayerBackground.prototype.extractStations = function(data) {
    return data.channels.map(station => {
      return { id: station.id, title: station.title };
    });
  };

  return SomaPlayerBackground;
})();

document.addEventListener('DOMContentLoaded', () => {
  somaPlayerBG = new SomaPlayerBackground();
});

SomaPlayerUtil.receiveMessage((request, sender, sendResponse) => {
  let info;
  console.debug('received message in background:', request);
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
    info = somaPlayerBG.getInfo();
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

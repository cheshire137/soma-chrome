var __bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
};

var somaPlayerBG;

var SomaPlayerBackground = (function() {
  function SomaPlayerBackground() {
    this.onTrack = __bind(this.onTrack, this);
    console.debug('initializing SomaPlayer background script');
    this.lastfm = SomaPlayerUtil.getLastfmConnection();
    this.audio = $('audio');
    if (this.audio.length < 1) {
      console.debug('adding new audio tag');
      $('body').append($('<audio autoplay="true" data-station=""></audio>'));
      this.audio = $('audio');
    }
    this.titleEl = $('div#title');
    if (this.titleEl.length < 1) {
      $('body').append($('<div id="title"></div>'));
      this.titleEl = $('div#title');
    }
    this.artistEl = $('div#artist');
    if (this.artistEl.length < 1) {
      $('body').append($('<div id="artist"></div>'));
      this.artistEl = $('div#artist');
    }
    this.socket = io.connect(SomaPlayerConfig.scrobbler_api_url);
  }

  SomaPlayerBackground.prototype.play = function(station) {
    console.debug('playing station', station);
    this.resetTrackInfoIfNecessary(station);
    this.subscribe(station);
    console.debug('adding track listener');
    this.socket.on('track', this.onTrack);
    this.audio.attr('src', SomaPlayerConfig.somafm_station_url + station);
    this.audio.attr('data-station', station);
    this.audio.removeAttr('data-paused');
  };

  SomaPlayerBackground.prototype.resetTrackInfoIfNecessary = function(station) {
    if (this.audio.attr('data-station') === station) {
      return;
    }
    console.debug('changed station from', this.audio.attr('data-station'),
                  'to', station, ', clearing current track info');
    this.titleEl.text('');
    this.artistEl.text('');
  };

  SomaPlayerBackground.prototype.getCurrentTrackInfo = function(station) {
    return SomaPlayerUtil.getCurrentTrackInfo(station, (function(_this) {
      return function(track) {
        _this.titleEl.text(track.title);
        _this.artistEl.text(track.artist);
      };
    })(this));
  };

  SomaPlayerBackground.prototype.subscribe = function(station) {
    var emitSubscribe = (function(_this) {
      return function() {
        console.debug('subscribing to', station, '...');
        _this.socket.emit('subscribe', station, function(response) {
          if (response.subscribed) {
            console.debug('subscribed to', station);
            _this.getCurrentTrackInfo(station);
          } else {
            console.error('failed to subscribe to', station, response);
          }
        });
      };
    })(this);
    if (this.socket.connected) {
      emitSubscribe();
    } else {
      this.socket.on('connect', function() {
        emitSubscribe();
      });
    }
  };

  SomaPlayerBackground.prototype.onTrack = function(track) {
    console.debug('new track:', track);
    this.titleEl.text(track.title);
    this.artistEl.text(track.artist);
    SomaPlayerUtil.getOptions((function(_this) {
      return function(opts) {
        _this.notifyOfTrack(track, opts);
        _this.scrobbleTrack(track, opts);
      };
    })(this));
  };

  SomaPlayerBackground.prototype.notifyOfTrack = function(track, opts) {
    if (opts.notifications === false) {
      return;
    }
    var notificationOpts = {
      type: 'basic',
      title: track.artist,
      message: track.title,
      iconUrl: 'icon48.png'
    };
    return chrome.notifications.create('', notificationOpts, function() {});
  };

  SomaPlayerBackground.prototype.scrobbleTrack = function(track, opts) {
    if (!(opts.lastfm_session_key && opts.lastfm_user && opts.scrobbling)) {
      return;
    }
    console.debug('scrobbling track for Last.fm user', opts.lastfm_user, track);
    var scrobbleData = {
      artist: (track.artist || '').replace(/"/g, "'"),
      track: (track.title || '').replace(/"/g, "'"),
      user: opts.lastfm_user,
      chosenByUser: 0,
      timestamp: Math.round((new Date()).getTime() / 1000)
    };
    return this.lastfm.track.scrobble(scrobbleData, {
      key: opts.lastfm_session_key
    }, {
      success: function() {
        var e;
        try {
          $('iframe').contents().find('form').submit();
          return console.debug('scrobbled track');
        } catch (_error) {
          e = _error;
          if (e.name !== 'SecurityError') {
            throw e;
          }
        }
      },
      error: function(data) {
        return console.error('failed to scrobble track; response:', data);
      }
    });
  };

  SomaPlayerBackground.prototype.pause = function(station) {
    console.debug('pausing station', station);
    this.unsubscribe(station);
    var audioTag = this.audio[0];
    audioTag.pause();
    audioTag.currentTime = 0;
    this.audio.attr('data-paused', 'true');
  };

  SomaPlayerBackground.prototype.clear = function() {
    var info = this.getInfo();
    this.unsubscribe(info.station);
    var audioTag = this.audio[0];
    audioTag.pause();
    audioTag.currentTime = 0;
    this.audio.attr('data-station', '');
    this.audio.removeAttr('data-paused');
  };

  SomaPlayerBackground.prototype.unsubscribe = function(station) {
    if (!(typeof station === 'string' && station.length > 0)) {
      return;
    }
    console.debug('unsubscribing from', station, '...');
    this.socket.emit('unsubscribe', station, function(response) {
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
    var station = '';
    if (this.audio.length >= 1) {
      station = this.audio.attr('data-station') || '';
    }
    return {
      station: station,
      artist: this.artistEl.text(),
      title: this.titleEl.text(),
      paused: this.audio.is('[data-paused]') || station === ''
    };
  };

  SomaPlayerBackground.prototype.setStations = function(stations) {
    console.debug('set stations', stations);
    SomaPlayerUtil.getOptions(function(opts) {
      opts.stations = stations;
      SomaPlayerUtil.setOptions(opts);
    });
  };

  SomaPlayerBackground.prototype.getStations = function(callback) {
    SomaPlayerUtil.getOptions(function(opts) {
      return callback(opts.stations);
    });
  };

  SomaPlayerBackground.prototype.fetchStations = function(callback) {
    var url;
    url = SomaPlayerConfig.somafm_api_url + 'channels.json';
    console.debug('fetching channels list from ' + url);
    return $.getJSON(url).
             done(this.onStationsFetched.bind(this, callback)).
             fail(this.onStationFetchError.bind(this, callback));
  };

  SomaPlayerBackground.prototype.onStationsFetched = function(callback, data) {
    console.debug('fetched stations list', data);
    var stations = data.channels;
    var simpleStations = [];
    for (var i = 0; i < stations.length; i++) {
      simpleStations.push({
        id: stations[i].id,
        title: stations[i].title
      });
    }
    this.setStations(simpleStations);
    callback(simpleStations);
  };

  SomaPlayerBackground.prototype.onStationFetchError = function(callback, xhr, status, error) {
    console.error('failed to fetch stations list', error);
    callback(null, true);
  };

  return SomaPlayerBackground;
})();

$(function() {
  somaPlayerBG = new SomaPlayerBackground();
});

SomaPlayerUtil.receiveMessage(function(request, sender, sendResponse) {
  var info;
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
    somaPlayerBG.fetchStations(function(stations, error) {
      return sendResponse(stations, error);
    });
    return true;
  }
  if (request.action === 'get_stations') {
    somaPlayerBG.getStations(function(stations) {
      console.debug('got saved list of stations:', stations);
      return sendResponse(stations);
    });
    return true;
  }
});

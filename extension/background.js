var SomaPlayerBackground, soma_player_bg,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

soma_player_bg = void 0;

SomaPlayerBackground = (function() {
  function SomaPlayerBackground() {
    this.on_track = __bind(this.on_track, this);
    console.debug('initializing SomaPlayer background script');
    this.lastfm = SomaPlayerUtil.get_lastfm_connection();
    this.audio = $('audio');
    if (this.audio.length < 1) {
      console.debug('adding new audio tag');
      $('body').append($('<audio autoplay="true" data-station=""></audio>'));
      this.audio = $('audio');
    }
    this.title_el = $('div#title');
    if (this.title_el.length < 1) {
      $('body').append($('<div id="title"></div>'));
      this.title_el = $('div#title');
    }
    this.artist_el = $('div#artist');
    if (this.artist_el.length < 1) {
      $('body').append($('<div id="artist"></div>'));
      this.artist_el = $('div#artist');
    }
    this.socket = io.connect(SomaPlayerConfig.scrobbler_api_url);
  }

  SomaPlayerBackground.prototype.play = function(station) {
    console.debug('playing station', station);
    this.reset_track_info_if_necessary(station);
    this.subscribe(station);
    console.debug('adding track listener');
    this.socket.on('track', this.on_track);
    this.audio.attr('src', "http://ice.somafm.com/" + station);
    this.audio.attr('data-station', station);
    return this.audio.removeAttr('data-paused');
  };

  SomaPlayerBackground.prototype.reset_track_info_if_necessary = function(station) {
    if (this.audio.attr('data-station') === station) {
      return;
    }
    console.debug('changed station from', this.audio.attr('data-station'), 'to', station, ', clearing current track info');
    this.title_el.text('');
    return this.artist_el.text('');
  };

  SomaPlayerBackground.prototype.get_current_track_info = function(station) {
    return SomaPlayerUtil.get_current_track_info(station, (function(_this) {
      return function(track) {
        _this.title_el.text(track.title);
        return _this.artist_el.text(track.artist);
      };
    })(this));
  };

  SomaPlayerBackground.prototype.subscribe = function(station) {
    var emit_subscribe;
    emit_subscribe = (function(_this) {
      return function() {
        console.debug('subscribing to', station, '...');
        return _this.socket.emit('subscribe', station, function(response) {
          if (response.subscribed) {
            console.debug('subscribed to', station);
            return _this.get_current_track_info(station);
          } else {
            return console.error('failed to subscribe to', station, response);
          }
        });
      };
    })(this);
    if (this.socket.connected) {
      return emit_subscribe();
    } else {
      return this.socket.on('connect', function() {
        return emit_subscribe();
      });
    }
  };

  SomaPlayerBackground.prototype.on_track = function(track) {
    console.debug('new track:', track);
    this.title_el.text(track.title);
    this.artist_el.text(track.artist);
    return SomaPlayerUtil.get_options((function(_this) {
      return function(opts) {
        _this.notify_of_track(track, opts);
        return _this.scrobble_track(track, opts);
      };
    })(this));
  };

  SomaPlayerBackground.prototype.notify_of_track = function(track, opts) {
    var notification_opt;
    if (opts.notifications === false) {
      return;
    }
    notification_opt = {
      type: 'basic',
      title: track.artist,
      message: track.title,
      iconUrl: 'icon48.png'
    };
    return chrome.notifications.create('', notification_opt, function(notification_id) {});
  };

  SomaPlayerBackground.prototype.scrobble_track = function(track, opts) {
    var scrobble_data;
    if (!(opts.lastfm_session_key && opts.lastfm_user && opts.scrobbling)) {
      return;
    }
    console.debug('scrobbling track for Last.fm user', opts.lastfm_user);
    scrobble_data = {
      artist: (track.artist || '').replace(/"/g, "'"),
      track: (track.title || '').replace(/"/g, "'"),
      user: opts.lastfm_user,
      timestamp: Math.round((new Date()).getTime() / 1000)
    };
    return this.lastfm.track.scrobble(scrobble_data, {
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
    var audio_tag;
    console.debug('pausing station', station);
    this.unsubscribe(station);
    audio_tag = this.audio[0];
    audio_tag.pause();
    audio_tag.currentTime = 0;
    return this.audio.attr('data-paused', 'true');
  };

  SomaPlayerBackground.prototype.clear = function() {
    var audio_tag, info;
    info = this.get_info();
    this.unsubscribe(info.station);
    audio_tag = this.audio[0];
    audio_tag.pause();
    audio_tag.currentTime = 0;
    this.audio.attr('data-station', '');
    return this.audio.removeAttr('data-paused');
  };

  SomaPlayerBackground.prototype.unsubscribe = function(station) {
    if (!(typeof station === 'string' && station.length > 0)) {
      return;
    }
    console.debug('unsubscribing from', station, '...');
    this.socket.emit('unsubscribe', station, function(response) {
      if (response.unsubscribed) {
        return console.debug('unsubscribed from', station);
      } else {
        return console.error('failed to unsubscribe from', station);
      }
    });
    console.debug('removing track listener');
    return this.socket.removeListener('track', this.on_track);
  };

  SomaPlayerBackground.prototype.get_info = function() {
    var station;
    station = '';
    if (this.audio.length >= 1) {
      station = this.audio.attr('data-station') || '';
    }
    return {
      station: station,
      artist: this.artist_el.text(),
      title: this.title_el.text(),
      is_paused: this.audio.is('[data-paused]') || station === ''
    };
  };

  SomaPlayerBackground.prototype.set_stations = function(stations) {
    console.debug('set stations', stations);
    return SomaPlayerUtil.get_options(function(opts) {
      opts.stations = stations;
      return SomaPlayerUtil.set_options(opts);
    });
  };

  SomaPlayerBackground.prototype.get_stations = function(callback) {
    return SomaPlayerUtil.get_options(function(opts) {
      return callback(opts.stations);
    });
  };

  SomaPlayerBackground.prototype.fetch_stations = function(callback) {
    var url;
    url = 'http://api.somafm.com/channels.json';
    console.debug('fetching channels list from ' + url);
    return $.getJSON(url).done(this.on_stations_fetched.bind(this, callback)).fail(this.on_station_fetch_error.bind(this, callback));
  };

  SomaPlayerBackground.prototype.on_stations_fetched = function(callback, data) {
    var simple_stations, station, stations, _i, _len;
    console.debug('fetched stations list', data);
    stations = data.channels;
    simple_stations = [];
    for (_i = 0, _len = stations.length; _i < _len; _i++) {
      station = stations[_i];
      simple_stations.push({
        id: station.id,
        title: station.title
      });
    }
    this.set_stations(simple_stations);
    return callback(simple_stations);
  };

  SomaPlayerBackground.prototype.on_station_fetch_error = function(callback, xhr, status, error) {
    console.error('failed to fetch stations list', error);
    return callback(null, true);
  };

  return SomaPlayerBackground;

})();

$(function() {
  return soma_player_bg = new SomaPlayerBackground();
});

SomaPlayerUtil.receive_message(function(request, sender, send_response) {
  var info;
  console.debug('received message in background:', request);
  if (request.action === 'play') {
    soma_player_bg.play(request.station);
    send_response();
    return true;
  } else if (request.action === 'pause') {
    soma_player_bg.pause(request.station);
    send_response();
    return true;
  } else if (request.action === 'info') {
    info = soma_player_bg.get_info();
    console.debug('info:', info);
    send_response(info);
    return true;
  } else if (request.action === 'clear') {
    soma_player_bg.clear();
    send_response();
    return true;
  } else if (request.action === 'fetch_stations') {
    soma_player_bg.fetch_stations(function(stations, error) {
      return send_response(stations, error);
    });
    return true;
  } else if (request.action === 'get_stations') {
    soma_player_bg.get_stations(function(stations) {
      console.debug('got saved list of stations:', stations);
      return send_response(stations);
    });
    return true;
  }
});

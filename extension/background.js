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

  SomaPlayerBackground.prototype.subscribe = function(station) {
    var emit_subscribe;
    emit_subscribe = (function(_this) {
      return function() {
        console.debug('subscribing to', station, '...');
        return _this.socket.emit('subscribe', station, function(response) {
          if (response.subscribed) {
            return console.debug('subscribed to', station);
          } else {
            return console.error('failed to subscribe to', station);
          }
        });
      };
    })(this);
    if (this.socket.socket.connected) {
      return emit_subscribe();
    } else {
      return this.socket.on('connect', (function(_this) {
        return function() {
          return emit_subscribe();
        };
      })(this));
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
    var notice;
    if (opts.notifications === false) {
      return;
    }
    var opt = {
     type: "basic",
     title: track.artist,
     message: track.title,
     iconUrl: 'icon48.png'
    };
   chrome.notifications.create("", opt, function(id) {
     console.error(chrome.runtime.lastError);
   });
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

  SomaPlayerBackground.prototype.unsubscribe = function(station) {
    console.debug('unsubscribing from', station, '...');
    this.socket.emit('unsubscribe', station, (function(_this) {
      return function(response) {
        if (response.unsubscribed) {
          return console.debug('unsubscribed from', station);
        } else {
          return console.error('failed to unsubscribe from', station);
        }
      };
    })(this));
    console.debug('removing track listener');
    return this.socket.removeListener('track', this.on_track);
  };

  SomaPlayerBackground.prototype.get_info = function() {
    var station;
    station = this.audio.length < 1 ? '' : this.audio.attr('data-station') || '';
    return {
      station: station,
      artist: this.artist_el.text(),
      title: this.title_el.text(),
      is_paused: this.audio.is('[data-paused]') || station === ''
    };
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
  }
});

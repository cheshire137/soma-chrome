var SomaPlayerBackground;

SomaPlayerBackground = (function() {
  function SomaPlayerBackground() {
    this.lastfm = SomaPlayerUtil.get_lastfm_connection();
    this.audio = $('audio');
    if (this.audio.length < 1) {
      console.debug('adding new audio tag');
      $('body').append($('<audio autoplay="true"></audio>'));
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
  }

  SomaPlayerBackground.prototype.play = function(station) {
    console.debug('playing station', station);
    this.socket = io.connect(SomaPlayerConfig.scrobbler_api_url);
    this.reset_track_info_if_necessary(station);
    this.subscribe(station);
    this.listen_for_track_changes();
    this.audio.attr('src', "http://ice.somafm.com/" + station);
    return this.audio.data('station', station);
  };

  SomaPlayerBackground.prototype.reset_track_info_if_necessary = function(station) {
    if (this.audio.data('station') === station) {
      return;
    }
    console.debug('changed station from', this.audio.data('station'), 'to', station, ', clearing current track info');
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

  SomaPlayerBackground.prototype.listen_for_track_changes = function() {
    return this.socket.on('track', (function(_this) {
      return function(track) {
        console.debug('new track:', track);
        _this.title_el.text(track.title);
        _this.artist_el.text(track.artist);
        return chrome.storage.sync.get('somaplayer_options', function(opts) {
          opts = opts.somaplayer_options || {};
          _this.notify_of_track(track, opts);
          return _this.scrobble_track(track, opts);
        });
      };
    })(this));
  };

  SomaPlayerBackground.prototype.notify_of_track = function(track, opts) {
    var notice;
    if (opts.notifications === false) {
      return;
    }
    notice = webkitNotifications.createNotification('icon48.png', track.title, track.artist);
    notice.show();
    return setTimeout((function() {
      return notice.cancel();
    }), 3000);
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
    return audio_tag.currentTime = 0;
  };

  SomaPlayerBackground.prototype.unsubscribe = function(station) {
    console.debug('unsubscribing from', station, '...');
    return this.socket.emit('unsubscribe', station, (function(_this) {
      return function(response) {
        if (response.unsubscribed) {
          return console.debug('unsubscribed from', station);
        } else {
          return console.error('failed to unsubscribe from', station);
        }
      };
    })(this));
  };

  SomaPlayerBackground.prototype.get_info = function() {
    return {
      station: this.audio.length < 1 ? '' : this.audio.data('station'),
      artist: this.artist_el.text(),
      title: this.title_el.text()
    };
  };

  return SomaPlayerBackground;

})();

SomaPlayerUtil.receive_message(function(request, sender, send_response) {
  var bg, info;
  console.debug('received message in background:', request);
  if (request.action === 'play') {
    bg = new SomaPlayerBackground();
    bg.play(request.station);
    send_response();
    return true;
  } else if (request.action === 'pause') {
    bg = new SomaPlayerBackground();
    bg.pause(request.station);
    send_response();
    return true;
  } else if (request.action === 'info') {
    bg = new SomaPlayerBackground();
    info = bg.get_info();
    console.debug('info:', info);
    send_response(info);
    return true;
  }
});

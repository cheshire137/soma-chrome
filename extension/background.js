var SomaPlayerBackground;

SomaPlayerBackground = (function() {
  function SomaPlayerBackground(station) {
    this.scrobbler_api_url = 'http://api.somascrobbler.com';
    this.station = station;
    this.audio = $('audio');
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
    if (this.station) {
      this.playlist_url = "http://somafm.com/" + this.station + ".pls";
      this.stream_url = "http://ice.somafm.com/" + this.station;
      this.socket = io.connect(this.scrobbler_api_url);
      this.subscribe();
      this.listen_for_track_changes();
    }
  }

  SomaPlayerBackground.prototype.subscribe = function() {
    return this.socket.on('connect', (function(_this) {
      return function() {
        console.debug('subscribing to', _this.station, '...');
        return _this.socket.emit('subscribe', _this.station, function(response) {
          if (response.subscribed) {
            return console.debug('subscribed to', _this.station);
          } else {
            return console.error('failed to subscribe to', _this.station);
          }
        });
      };
    })(this));
  };

  SomaPlayerBackground.prototype.listen_for_track_changes = function() {
    return this.socket.on('track', (function(_this) {
      return function(track) {
        var notice;
        console.debug('new track:', track);
        _this.title_el.text(track.title);
        _this.artist_el.text(track.artist);
        notice = webkitNotifications.createNotification('icon48.png', track.title, track.artist);
        notice.show();
        return setTimeout((function() {
          return notice.cancel();
        }), 3000);
      };
    })(this));
  };

  SomaPlayerBackground.prototype.play = function() {
    console.debug('playing station', this.station);
    return $('body').append($("<audio src='" + this.stream_url + "' autoplay='true' data-station='" + this.station + "'></audio>"));
  };

  SomaPlayerBackground.prototype.pause = function() {
    console.debug('pausing station', this.station);
    this.audio.remove();
    this.title_el.text('');
    return this.artist_el.text('');
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
    bg = new SomaPlayerBackground(request.station);
    bg.play();
    send_response();
    return true;
  } else if (request.action === 'pause') {
    bg = new SomaPlayerBackground(request.station);
    bg.pause();
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

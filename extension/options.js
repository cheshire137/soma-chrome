var SomaPlayerOptions;

SomaPlayerOptions = (function() {
  function SomaPlayerOptions() {
    this.status_area = $('#status-message');
    this.lastfm_button = $('button#lastfm-auth');
    this.lastfm_connected_message = $('#lastfm-is-authenticated');
    this.lastfm_user = $('#lastfm-user');
    this.lastfm_api_key = 'cbf33bb9eef14a25b0e08cd47530706c';
    this.lastfm_api_secret = '797d623a73501d358f6ca0e5f8fd3cf0';
    this.lastfm_token = SomaPlayerUtil.get_url_param('token');
    this.options = {};
    console.debug('Last.fm token:', this.lastfm_token);
    this.lastfm_button.click((function(_this) {
      return function() {
        return _this.init_authenticate_lastfm();
      };
    })(this));
    this.restore_options();
    this.authenticate_lastfm();
  }

  SomaPlayerOptions.prototype.restore_options = function() {
    return chrome.storage.sync.get('somaplayer_options', (function(_this) {
      return function(opts) {
        var key, value;
        opts = opts.somaplayer_options || {};
        if (opts.lastfm_session_key) {
          _this.lastfm_connected_message.removeClass('hidden');
        }
        if (opts.lastfm_user) {
          _this.lastfm_user.text(opts.lastfm_user);
        }
        for (key in opts) {
          value = opts[key];
          _this.options[key] = value;
        }
        console.log('SomaPlayer options:', _this.options);
        return _this.lastfm_button.removeClass('hidden');
      };
    })(this));
  };

  SomaPlayerOptions.prototype.init_authenticate_lastfm = function() {
    return window.location.href = 'http://www.last.fm/api/auth/' + '?api_key=' + this.lastfm_api_key + '&cb=' + window.location.href;
  };

  SomaPlayerOptions.prototype.authenticate_lastfm = function() {
    var lastfm;
    if (this.lastfm_token === '') {
      return;
    }
    console.debug('authenticating with Last.fm token...');
    lastfm = new LastFM({
      apiKey: this.lastfm_api_key,
      apiSecret: this.lastfm_api_secret,
      apiUrl: 'https://ws.audioscrobbler.com/2.0/',
      cache: new LastFMCache()
    });
    return lastfm.auth.getSession({
      token: this.lastfm_token
    }, {
      success: (function(_this) {
        return function(data) {
          _this.options.lastfm_session_key = data.session.key;
          _this.options.lastfm_user = data.session.name;
          return chrome.storage.sync.set({
            'somaplayer_options': _this.options
          }, function() {
            _this.status_area.text('Connected to Last.fm!').fadeIn(function() {
              return setTimeout((function() {
                return _this.status_area.fadeOut();
              }), 2000);
            });
            _this.lastfm_user.text(_this.options.lastfm_user);
            return _this.lastfm_connected_message.removeClass('hidden');
          });
        };
      })(this),
      error: (function(_this) {
        return function(data) {
          console.error('Last.fm error:', data.error, ',', data.message);
          delete _this.options['lastfm_session_key'];
          delete _this.options['lastfm_user'];
          return chrome.storage.sync.set({
            'somaplayer_options': _this.options
          }, function() {
            return _this.status_area.text('Error authenticating with Last.fm.').fadeIn(function() {
              return setTimeout((function() {
                return _this.status_area.fadeOut();
              }), 2000);
            });
          });
        };
      })(this)
    });
  };

  return SomaPlayerOptions;

})();

$(function() {
  return new SomaPlayerOptions();
});

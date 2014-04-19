var SomaPlayerOptions;

SomaPlayerOptions = (function() {
  function SomaPlayerOptions() {
    this.status_area = $('#status-message');
    this.lastfm_button = $('button#lastfm-auth');
    this.disable_scrobbling = $('#disable_scrobbling');
    this.enable_scrobbling = $('#enable_scrobbling');
    this.lastfm_connected_message = $('#lastfm-is-authenticated');
    this.lastfm_user = $('#lastfm-user');
    this.lastfm_token = SomaPlayerUtil.get_url_param('token');
    this.options = {
      scrobbling: false
    };
    console.debug('Last.fm token:', this.lastfm_token);
    this.lastfm_button.click((function(_this) {
      return function() {
        return _this.init_authenticate_lastfm();
      };
    })(this));
    $('input[name="scrobbling"]').change((function(_this) {
      return function() {
        return _this.save_options();
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
          _this.enable_scrobbling.removeAttr('disabled');
          _this.options.lastfm_session_key = opts.lastfm_session_key;
        }
        if (opts.lastfm_user) {
          _this.lastfm_user.text(opts.lastfm_user);
          _this.options.lastfm_user = opts.lastfm_user;
        }
        if (opts.scrobbling) {
          _this.enable_scrobbling.attr('checked', 'checked');
          _this.options.scrobbling = true;
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

  SomaPlayerOptions.prototype.save_options = function() {
    this.options.scrobbling = $('input[name="scrobbling"]:checked').val() === 'enabled';
    return chrome.storage.sync.set({
      'somaplayer_options': this.options
    }, (function(_this) {
      return function() {
        return _this.status_area.text('Saved your options!').fadeIn(function() {
          return setTimeout((function() {
            return _this.status_area.fadeOut();
          }), 2000);
        });
      };
    })(this));
  };

  SomaPlayerOptions.prototype.init_authenticate_lastfm = function() {
    return window.location.href = 'http://www.last.fm/api/auth/' + '?api_key=' + SomaPlayerConfig.lastfm_api_key + '&cb=' + window.location.href;
  };

  SomaPlayerOptions.prototype.authenticate_lastfm = function() {
    var lastfm;
    if (this.lastfm_token === '') {
      return;
    }
    console.debug('authenticating with Last.fm token...');
    lastfm = SomaPlayerUtil.get_lastfm_connection();
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
            _this.lastfm_connected_message.removeClass('hidden');
            return _this.enable_scrobbling.removeAttr('disabled');
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

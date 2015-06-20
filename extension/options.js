var SomaPlayerOptions;

SomaPlayerOptions = (function() {
  function SomaPlayerOptions() {
    this.status_area = $('#status-message');
    this.lastfm_button = $('button#lastfm-auth');
    this.disable_scrobbling = $('#disable_scrobbling');
    this.enable_scrobbling = $('#enable_scrobbling');
    this.disable_notifications = $('#disable_notifications');
    this.enable_notifications = $('#enable_notifications');
    this.lastfm_connected_message = $('#lastfm-is-authenticated');
    this.lastfm_user = $('#lastfm-user');
    this.lastfm_token = SomaPlayerUtil.get_url_param('token');
    this.options = {
      scrobbling: false,
      notifications: true
    };
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
    $('input[name="notifications"]').change((function(_this) {
      return function() {
        return _this.save_options();
      };
    })(this));
    this.restore_options();
    this.authenticate_lastfm();
  }

  SomaPlayerOptions.prototype.restore_options = function() {
    return SomaPlayerUtil.get_options((function(_this) {
      return function(opts) {
        var key, value;
        if (opts.lastfm_session_key) {
          _this.lastfm_connected_message.removeClass('hidden');
          _this.enable_scrobbling.removeAttr('disabled');
        }
        if (opts.lastfm_user) {
          _this.lastfm_user.text(opts.lastfm_user);
        }
        if (opts.scrobbling) {
          _this.enable_scrobbling.attr('checked', 'checked');
        }
        if (opts.notifications === false) {
          _this.disable_notifications.attr('checked', 'checked');
        }
        for (key in opts) {
          value = opts[key];
          _this.options[key] = value;
        }
        $('.controls.hidden').removeClass('hidden');
        console.debug('SomaPlayer options:', _this.options);
        return _this.lastfm_button.removeClass('hidden');
      };
    })(this));
  };

  SomaPlayerOptions.prototype.save_options = function() {
    this.options.scrobbling = $('input[name="scrobbling"]:checked').val() === 'enabled';
    this.options.notifications = $('input[name="notifications"]:checked').val() === 'enabled';
    return SomaPlayerUtil.set_options(this.options, (function(_this) {
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
          _this.options.scrobbling = true;
          return SomaPlayerUtil.set_options(_this.options, function() {
            _this.status_area.text('Connected to Last.fm!').fadeIn(function() {
              return setTimeout((function() {
                return _this.status_area.fadeOut();
              }), 2000);
            });
            _this.lastfm_user.text(_this.options.lastfm_user);
            _this.lastfm_connected_message.removeClass('hidden');
            _this.enable_scrobbling.removeAttr('disabled');
            return _this.enable_scrobbling.attr('checked', 'checked');
          });
        };
      })(this),
      error: (function(_this) {
        return function(data) {
          console.error('Last.fm error:', data.error, ',', data.message);
          delete _this.options['lastfm_session_key'];
          delete _this.options['lastfm_user'];
          return SomaPlayerUtil.set_options(_this.options, function() {
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

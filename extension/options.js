var SomaPlayerOptions = (function() {
  function SomaPlayerOptions() {
    this.findElements();
    this.lastfmToken = SomaPlayerUtil.getUrlParam('token');
    this.options = { scrobbling: false, notifications: true };
    this.listenForLastfmClicks();
    this.listenForChanges();
    this.listenForRefresh();
    this.restoreOptions();
    this.authenticateLastfm();
  }

  SomaPlayerOptions.prototype.listenForRefresh = function() {
    this.refreshStationsButton.click((function(_this) {
      return function() {
        return _this.refreshStations();
      };
    })(this));
  };

  SomaPlayerOptions.prototype.listenForChanges = function() {
    var radioSelector = 'input[name="scrobbling"], ' +
                        'input[name="notifications"], ' +
                        'input[name="theme"]';
    $(radioSelector).change((function(_this) {
      return function() {
        return _this.saveOptions();
      };
    })(this));
  };

  SomaPlayerOptions.prototype.listenForLastfmClicks = function() {
    this.lastfmAuthButtons.click((function(_this) {
      return function() {
        return _this.initAuthenticateLastfm();
      };
    })(this));
    this.lastfmDisconnect.click((function(_this) {
      return function(event) {
        event.preventDefault();
        return _this.disconnectFromLastfm();
      };
    })(this));
  };

  SomaPlayerOptions.prototype.findElements = function() {
    this.statusArea = $('#status-message');
    this.lastfmAuthButtons = $('button.lastfm-auth');
    this.disableScrobbling = $('#disable_scrobbling');
    this.enableScrobbling = $('#enable_scrobbling');
    this.disableNotifications = $('#disable_notifications');
    this.darkTheme = $('#dark_theme');
    this.lastfmConnectedMessage = $('#lastfm-is-authenticated');
    this.lastfmNotConnectedMessage = $('#lastfm-is-not-authenticated');
    this.lastfmUser = $('#lastfm-user');
    this.lastfmDisconnect = $('#lastfm-disconnect');
    this.stationsDivider = $('.stations-divider');
    this.stationsOptions = $('.stations-options');
    this.stationCount = $('.station-count');
    this.stationsList = $('.stations-list');
    this.refreshStationsButton = $('button.refresh-stations');
  };

  SomaPlayerOptions.prototype.restoreOptions = function() {
    return SomaPlayerUtil.getOptions((function(_this) {
      return function(opts) {
        if (opts.lastfm_session_key) {
          _this.lastfmConnectedMessage.removeClass('hidden');
          _this.enableScrobbling.removeAttr('disabled');
        } else {
          _this.lastfmNotConnectedMessage.removeClass('hidden');
        }
        if (opts.lastfmUser) {
          _this.lastfmUser.text(opts.lastfmUser);
          _this.lastfmUser.attr('href',
                                'http://last.fm/user/' + opts.lastfmUser);
        }
        if (opts.scrobbling) {
          _this.enableScrobbling.attr('checked', 'checked');
        }
        if (opts.notifications === false) {
          _this.disableNotifications.attr('checked', 'checked');
        }
        if (opts.stations && opts.stations.length > 0) {
          _this.showCachedStations(opts.stations);
        }
        if (opts.theme === 'dark') {
          _this.darkTheme.attr('checked', 'checked');
        }
        for (var key in opts) {
          if (opts.hasOwnProperty(key)) {
            _this.options[key] = opts[key];
          }
        }
        $('.controls.hidden').removeClass('hidden');
        console.debug('SomaPlayer options:', _this.options);
        _this.lastfmAuthButtons.removeClass('hidden');
        _this.applyTheme();
      };
    })(this));
  };

  SomaPlayerOptions.prototype.applyTheme = function() {
    var theme = this.options.theme || 'light';
    if (theme === 'light') {
      document.body.classList.remove('theme-dark');
    } else {
      document.body.classList.remove('theme-light');
    }
    document.body.classList.add('theme-' + theme);
  };

  SomaPlayerOptions.prototype.showCachedStations = function(stations) {
    this.stationsDivider.show();
    this.stationsOptions.show();
    this.stationCount.text(stations.length);
    var titles = (function() {
      var _results = [];
      for (var _i = 0; _i < stations.length; _i++) {
        _results.push(stations[_i].title);
      }
      return _results;
    })();
    titles.sort();
    var textList = titles.slice(0, titles.length - 1).join(', ');
    textList += ', and ' + titles[titles.length - 1] + '.';
    return this.stationsList.text(textList);
  };

  SomaPlayerOptions.prototype.refreshStations = function() {
    var msg;
    console.debug('refreshing stations list');
    this.stationsList.text('');
    this.refreshStationsButton.prop('disabled', true);
    msg = { action: 'fetch_stations' };
    return SomaPlayerUtil.sendMessage(msg, (function(_this) {
      return function(stations, error) {
        if (error) {
          _this.stationsList.text('Could not fetch station list. :(');
        } else {
          _this.showCachedStations(stations);
        }
        _this.options.stations = stations;
        return _this.refreshStationsButton.prop('disabled', false);
      };
    })(this));
  };

  SomaPlayerOptions.prototype.disconnectFromLastfm = function() {
    console.debug('disconnecting from Last.fm...');
    this.options.lastfm_session_key = null;
    this.options.lastfmUser = null;
    this.options.scrobbling = false;
    return SomaPlayerUtil.setOptions(this.options, (function(_this) {
      return function() {
        _this.statusArea.text('Disconnected from Last.fm!').fadeIn(function() {
          return setTimeout((function() {
            return _this.statusArea.fadeOut();
          }), 2000);
        });
        _this.lastfmUser.text('');
        _this.lastfmConnectedMessage.addClass('hidden');
        _this.lastfmNotConnectedMessage.removeClass('hidden');
        _this.enableScrobbling.attr('disabled', 'disabled');
        _this.enableScrobbling.removeAttr('checked');
        return _this.disableScrobbling.attr('checked', 'checked');
      };
    })(this));
  };

  SomaPlayerOptions.prototype.saveOptions = function() {
    var checkedScrobbling = $('input[name="scrobbling"]:checked');
    this.options.scrobbling = checkedScrobbling.val() === 'enabled';
    var checkedNotifications = $('input[name="notifications"]:checked');
    this.options.notifications = checkedNotifications.val() === 'enabled';
    var checkedTheme = $('input[name="theme"]:checked');
    this.options.theme = checkedTheme.val();
    return SomaPlayerUtil.setOptions(this.options, (function(_this) {
      return function() {
        return _this.statusArea.text('Saved your options!').fadeIn(function() {
          window.scrollTo(0, 0);
          setTimeout((function() {
            return _this.statusArea.fadeOut();
          }), 2000);
          return _this.applyTheme();
        });
      };
    })(this));
  };

  SomaPlayerOptions.prototype.initAuthenticateLastfm = function() {
    window.location.href = SomaPlayerConfig.lastfm_auth_url +
                           '?api_key=' + SomaPlayerConfig.lastfm_api_key +
                           '&cb=' + window.location.href;
  };

  SomaPlayerOptions.prototype.authenticateLastfm = function() {
    var lastfm;
    if (this.lastfmToken === '') {
      return;
    }
    console.debug('authenticating with Last.fm token...');
    lastfm = SomaPlayerUtil.getLastfmConnection();
    return lastfm.auth.getSession({
      token: this.lastfmToken
    }, {
      success: (function(_this) {
        return function(data) {
          _this.options.lastfm_session_key = data.session.key;
          _this.options.lastfmUser = data.session.name;
          _this.options.scrobbling = true;
          return SomaPlayerUtil.setOptions(_this.options, function() {
            _this.statusArea.text('Connected to Last.fm!').fadeIn(function() {
              return setTimeout((function() {
                return _this.statusArea.fadeOut();
              }), 2000);
            });
            _this.lastfmUser.text(_this.options.lastfmUser);
            _this.lastfmConnectedMessage.removeClass('hidden');
            _this.lastfmNotConnectedMessage.addClass('hidden');
            _this.enableScrobbling.removeAttr('disabled');
            return _this.enableScrobbling.attr('checked', 'checked');
          });
        };
      })(this),
      error: (function(_this) {
        return function(data) {
          console.error('Last.fm error:', data.error, ',', data.message);
          delete _this.options.lastfm_session_key;
          delete _this.options.lastfm_user;
          return SomaPlayerUtil.setOptions(_this.options, function() {
            return _this.statusArea.text('Error authenticating with Last.fm.').fadeIn(function() {
              return setTimeout((function() {
                return _this.statusArea.fadeOut();
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
  new SomaPlayerOptions();
});

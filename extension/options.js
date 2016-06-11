const SomaPlayerOptions = (function() {
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
    this.refreshStationsButton.addEventListener('click', () => {
      this.refreshStations();
    });
  };

  SomaPlayerOptions.prototype.listenForChanges = function() {
    const selectors = ['input[name="scrobbling"]',
                       'input[name="notifications"]',
                       'input[name="theme"]'];
    selectors.forEach(selector => {
      const inputs = Array.from(document.querySelectorAll(selector));
      inputs.forEach(input => {
        input.addEventListener('change', () => this.saveOptions());
      });
    });
  };

  SomaPlayerOptions.prototype.listenForLastfmClicks = function() {
    this.lastfmAuthButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.initAuthenticateLastfm();
      });
    });
    this.lastfmDisconnect.addEventListener('click', event => {
      event.preventDefault();
      return this.disconnectFromLastfm();
    });
  };

  SomaPlayerOptions.prototype.findElements = function() {
    this.statusArea = document.getElementById('status-message');
    this.lastfmAuthButtons =
        Array.from(document.querySelectorAll('button.lastfm-auth'));
    this.disableScrobbling = document.getElementById('disable_scrobbling');
    this.enableScrobbling = document.getElementById('enable_scrobbling');
    this.disableNotifications =
        document.getElementById('disable_notifications');
    this.darkTheme = document.getElementById('dark_theme');
    this.lastfmConnectedMessage =
        document.getElementById('lastfm-is-authenticated');
    this.lastfmNotConnectedMessage =
        document.getElementById('lastfm-is-not-authenticated');
    this.lastfmUser = document.getElementById('lastfm-user');
    this.lastfmDisconnect = document.getElementById('lastfm-disconnect');
    this.stationsDivider = document.querySelector('.stations-divider');
    this.stationsOptions = document.querySelector('.stations-options');
    this.stationCount = document.querySelector('.station-count');
    this.stationsList = document.querySelector('.stations-list');
    this.refreshStationsButton = document.querySelector('.refresh-stations');
  };

  SomaPlayerOptions.prototype.restoreOptions = function() {
    return SomaPlayerUtil.getOptions(opts => {
      if (opts.lastfm_session_key) {
        this.lastfmConnectedMessage.classList.remove('hidden');
        this.enableScrobbling.removeAttribute('disabled');
      } else {
        this.lastfmNotConnectedMessage.classList.remove('hidden');
      }
      if (opts.lastfmUser) {
        this.lastfmUser.textContent = opts.lastfmUser;
        this.lastfmUser.href = `http://last.fm/user/${opts.lastfmUser}`;
      }
      if (opts.scrobbling) {
        this.enableScrobbling.checked = true;
      }
      if (opts.notifications === false) {
        this.disableNotifications.checked = true;
      }
      if (opts.stations && opts.stations.length > 0) {
        this.showCachedStations(opts.stations);
      }
      if (opts.theme === 'dark') {
        this.darkTheme.checked = true;
      }
      for (const key in opts) {
        if (opts.hasOwnProperty(key)) {
          this.options[key] = opts[key];
        }
      }
      Array.from(document.querySelectorAll('.controls.hidden')).
            forEach(control => {
              control.classList.remove('hidden');
            });
      console.debug('SomaPlayer options:', this.options);
      this.lastfmAuthButtons.forEach(button => {
        button.classList.remove('hidden');
      });
      this.applyTheme();
    });
  };

  SomaPlayerOptions.prototype.applyTheme = function() {
    const theme = this.options.theme || 'light';
    if (theme === 'light') {
      document.body.classList.remove('theme-dark');
    } else {
      document.body.classList.remove('theme-light');
    }
    document.body.classList.add(`theme-${theme}`);
  };

  SomaPlayerOptions.prototype.showCachedStations = function(stations) {
    this.stationsDivider.classList.remove('hidden');
    this.stationsOptions.classList.remove('hidden');
    this.stationCount.textContent = stations.length;
    const titles = stations.map(s => s.title);
    titles.sort();
    let textList = titles.slice(0, titles.length - 1).join(', ');
    textList += `, and ${titles[titles.length - 1]}.`;
    this.stationsList.textContent = textList;
  };

  SomaPlayerOptions.prototype.refreshStations = function() {
    console.debug('refreshing stations list');
    this.stationsList.textContent = '';
    this.refreshStationsButton.disabled = true;
    const msg = { action: 'fetch_stations' };
    return SomaPlayerUtil.sendMessage(msg, (stations, error) => {
      if (error) {
        this.stationsList.textContent = 'Could not fetch station list. :(';
      } else {
        this.showCachedStations(stations);
      }
      this.options.stations = stations;
      this.refreshStationsButton.disabled = false;
    });
  };

  SomaPlayerOptions.prototype.disconnectFromLastfm = function() {
    console.debug('disconnecting from Last.fm...');
    this.options.lastfm_session_key = null;
    this.options.lastfmUser = null;
    this.options.scrobbling = false;
    return SomaPlayerUtil.setOptions(this.options, () => {
      this.flashNotice('Disconnected from Last.fm!');
      this.lastfmUser.textContent = '';
      this.lastfmConnectedMessage.classList.add('hidden');
      this.lastfmNotConnectedMessage.classList.remove('hidden');
      this.enableScrobbling.disabled = true;
      this.enableScrobbling.removeAttribute('checked');
      this.disableScrobbling.checked = true;
    });
  };

  SomaPlayerOptions.prototype.dismissNotice = function() {
    this.statusArea.classList.add('hidden');
    while (this.statusArea.hasChildNodes()) {
      this.statusArea.removeChild(this.statusArea.lastChild);
    }
  };

  SomaPlayerOptions.prototype.flashNotice = function(message) {
    this.dismissNotice();
    this.statusArea.textContent = message;
    this.statusArea.classList.remove('hidden');
    setTimeout(this.dismissNotice.bind(this), 10000);
  };

  SomaPlayerOptions.prototype.saveOptions = function() {
    const checkedScrobbling =
        document.querySelector('input[name="scrobbling"]:checked');
    this.options.scrobbling = checkedScrobbling.value === 'enabled';
    const checkedNotifications =
        document.querySelector('input[name="notifications"]:checked');
    this.options.notifications = checkedNotifications.value === 'enabled';
    const checkedTheme = document.querySelector('input[name="theme"]:checked');
    this.options.theme = checkedTheme.value;
    return SomaPlayerUtil.setOptions(this.options, () => {
      this.flashNotice('Saved your options!');
      this.applyTheme();
    });
  };

  SomaPlayerOptions.prototype.initAuthenticateLastfm = function() {
    window.location.href = `${SomaPlayerConfig.lastfm_auth_url}?api_key=${SomaPlayerConfig.lastfm_api_key}&cb=${window.location.href}`;
  };

  SomaPlayerOptions.prototype.authenticateLastfm = function() {
    if (this.lastfmToken === '') {
      return;
    }
    console.debug('authenticating with Last.fm token...');
    const lastfm = SomaPlayerUtil.getLastfmConnection();
    return lastfm.auth.getSession({
      token: this.lastfmToken
    }, {
      success: data => {
        this.options.lastfm_session_key = data.session.key;
        this.options.lastfmUser = data.session.name;
        this.options.scrobbling = true;
        return SomaPlayerUtil.setOptions(this.options, () => {
          this.flashNotice('Connected to Last.fm!');
          this.lastfmUser.textContent = this.options.lastfmUser;
          this.lastfmConnectedMessage.classList.remove('hidden');
          this.lastfmNotConnectedMessage.classList.add('hidden');
          this.enableScrobbling.removeAttribute('disabled');
          this.enableScrobbling.checked = true;
        });
      },
      error: data => {
        console.error('Last.fm error:', data.error, ',', data.message);
        delete this.options.lastfm_session_key;
        delete this.options.lastfm_user;
        SomaPlayerUtil.setOptions(this.options, () => {
          this.flashNotice('Error authenticating with Last.fm.');
        });
      }
    });
  };

  return SomaPlayerOptions;
})();

document.addEventListener('DOMContentLoaded', () => {
  new SomaPlayerOptions();
});

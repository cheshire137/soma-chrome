class SomaPlayerOptions {
  constructor() {
    this.findElements();
    this.lastfmToken = SomaPlayerUtil.getUrlParam('token');
    this.options = { scrobbling: false, notifications: true };
    this.listenForLastfmClicks();
    this.listenForChanges();
    this.listenForRefresh();
    this.restoreOptions();
    this.authenticateLastfm();
  }

  listenForRefresh() {
    this.refreshStationsButton.addEventListener('click', () => {
      this.refreshStations();
    });
  }

  listenForChanges() {
    const selectors = ['input[name="scrobbling"]',
                       'input[name="notifications"]',
                       'input[name="theme"]'];
    selectors.forEach(selector => {
      const inputs = Array.from(document.querySelectorAll(selector));
      inputs.forEach(input => {
        input.addEventListener('change', () => this.saveOptions());
      });
    });
  }

  listenForLastfmClicks() {
    this.lastfmAuthButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.initAuthenticateLastfm();
      });
    });
    this.lastfmDisconnect.addEventListener('click', event => {
      event.preventDefault();
      return this.disconnectFromLastfm();
    });
  }

  findElements() {
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
    this.stationsOptions = document.querySelector('.stations-options');
    this.stationCount = document.querySelector('.station-count');
    this.stationsList = document.querySelector('.stations-list');
    this.refreshStationsButton = document.querySelector('.refresh-stations');
  }

  restoreOptions() {
    return SomaPlayerUtil.getOptions().then(opts => {
      if (opts.lastfm_session_key) {
        this.lastfmConnectedMessage.classList.remove('hidden');
        this.enableScrobbling.removeAttribute('disabled');
      } else {
        this.lastfmNotConnectedMessage.classList.remove('hidden');
      }
      if (opts.lastfmUser) {
        this.lastfmUser.textContent = opts.lastfm_user;
        this.lastfmUser.href = `http://last.fm/user/${opts.lastfm_user}`;
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
      Array.from(document.querySelectorAll('.control.hidden')).
            forEach(control => {
              control.classList.remove('hidden');
            });
      console.debug('SomaPlayer options:', this.options);
      this.lastfmAuthButtons.forEach(button => {
        button.classList.remove('hidden');
      });
      this.applyTheme();
    });
  }

  applyTheme() {
    const theme = this.options.theme || 'light';
    if (theme === 'light') {
      document.body.classList.remove('theme-dark');
    } else {
      document.body.classList.remove('theme-light');
    }
    document.body.classList.add(`theme-${theme}`);
  }

  showCachedStations(stations) {
    this.stationsOptions.classList.remove('hidden');
    this.stationCount.textContent = stations.length;
    const titles = stations.map(s => s.title);
    const commaSeparated = titles.slice(0, titles.length - 1).join(', ');
    const textList = `${commaSeparated}, and ${titles[titles.length - 1]}.`;
    this.stationsList.textContent = textList;
  }

  refreshStations() {
    console.debug('refreshing stations list');
    this.stationsList.textContent = '';
    this.refreshStationsButton.disabled = true;
    const msg = { action: 'fetch_stations' };
    chrome.runtime.sendMessage(msg, (stations, error) => {
      if (error) {
        this.stationsList.textContent = 'Could not fetch station list. :(';
      } else {
        this.showCachedStations(stations);
      }
      this.options.stations = stations;
      this.refreshStationsButton.disabled = false;
    });
  }

  disconnectFromLastfm() {
    console.debug('disconnecting from Last.fm...');
    this.options.lastfm_session_key = null;
    this.options.lastfm_user = null;
    this.options.scrobbling = false;
    SomaPlayerUtil.setOptions(this.options).then(() => {
      this.flashNotice('Disconnected from Last.fm!');
      this.lastfmUser.textContent = '';
      this.lastfmConnectedMessage.classList.add('hidden');
      this.lastfmNotConnectedMessage.classList.remove('hidden');
      this.enableScrobbling.disabled = true;
      this.enableScrobbling.removeAttribute('checked');
      this.disableScrobbling.checked = true;
    });
  }

  dismissNotice() {
    this.statusArea.classList.add('hidden');
    while (this.statusArea.hasChildNodes()) {
      this.statusArea.removeChild(this.statusArea.lastChild);
    }
  }

  flashNotice(message) {
    const show = () => {
      this.statusArea.appendChild(this.getDismissButton());
      const span = document.createElement('span');
      span.textContent = message;
      this.statusArea.appendChild(span);
      this.statusArea.classList.remove('hidden');
      setTimeout(this.dismissNotice.bind(this), 10000);
    };
    if (this.statusArea.classList.contains('hidden')) {
      show();
    } else {
      this.dismissNotice();
      setTimeout(show, 250);
    }
  }

  getDismissButton() {
    const button = document.createElement('button');
    button.className = 'delete';
    button.addEventListener('click', event => {
      event.preventDefault();
      this.dismissNotice();
    });
    return button;
  }

  saveOptions() {
    const checkedScrobbling =
        document.querySelector('input[name="scrobbling"]:checked');
    this.options.scrobbling = checkedScrobbling.value === 'enabled';
    const checkedNotifications =
        document.querySelector('input[name="notifications"]:checked');
    this.options.notifications = checkedNotifications.value === 'enabled';
    const checkedTheme = document.querySelector('input[name="theme"]:checked');
    this.options.theme = checkedTheme.value;
    return SomaPlayerUtil.setOptions(this.options).then(() => {
      this.flashNotice('Saved your options!');
      this.applyTheme();
    });
  }

  initAuthenticateLastfm() {
    window.location.href = `${SomaPlayerConfig.lastfm_auth_url}?api_key=${SomaPlayerConfig.lastfm_api_key}&cb=${window.location.href}`;
  }

  authenticateLastfm() {
    if (this.lastfmToken === '') {
      return;
    }
    console.debug('authenticating with Last.fm token...');
    const lastfm = SomaPlayerUtil.getLastfmConnection();
    lastfm.auth.getSession({ token: this.lastfmToken }, {
      success: data => {
        this.options.lastfm_session_key = data.session.key;
        this.options.lastfm_user = data.session.name;
        this.options.scrobbling = true;
        SomaPlayerUtil.setOptions(this.options).then(() => {
          this.flashNotice('Connected to Last.fm!');
          this.lastfmUser.textContent = this.options.lastfm_user;
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
        SomaPlayerUtil.setOptions(this.options).then(() => {
          this.flashNotice('Error authenticating with Last.fm.');
        });
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SomaPlayerOptions();
});

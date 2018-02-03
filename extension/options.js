class SomaPlayerOptions {
  constructor() {
    this.findElements();
    this.options = { scrobbling: false, notifications: true };
    this.listenForChanges();
    this.listenForRefresh();
    this.restoreOptions();
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

  findElements() {
    this.statusArea = document.getElementById('status-message');
    this.disableScrobbling = document.getElementById('disable_scrobbling');
    this.enableScrobbling = document.getElementById('enable_scrobbling');
    this.disableNotifications =
        document.getElementById('disable_notifications');
    this.darkTheme = document.getElementById('dark_theme');
    this.stationOptions = document.getElementById('stations-options');
    this.stationCount = document.getElementById('station-count');
    this.stationsList = document.getElementById('stations-list');
    this.refreshStationsButton = document.getElementById('refresh-stations');
  }

  restoreOptions() {
    const stations = SomaPlayerUtil.getStations()
    if (stations && stations.length > 0) {
      this.showCachedStations(stations)
    }

    return SomaPlayerUtil.getOptions().then(opts => {
      if (opts.notifications === false) {
        this.disableNotifications.checked = true;
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
    this.stationOptions.classList.remove('hidden');
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
    const msg = { action: 'refresh_stations' };
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
}

document.addEventListener('DOMContentLoaded', () => {
  new SomaPlayerOptions();
});

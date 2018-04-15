class SomaPlayerOptions {
  constructor() {
    this.findElements()
    this.options = { scrobbling: false, notifications: true }
    this.listenForChanges()
    this.listenForRefresh()
    this.restoreOptions()
    this.hookUpLinks()
    this.showShortcutTip()
  }

  listenForRefresh() {
    this.refreshStationsButton.addEventListener('click', () => {
      this.refreshStations();
    });
  }

  listenForChanges() {
    const selectors = ['input[name="scrobbling"]',
                       'input[name="notifications"]',
                       'input[name="theme"]',
                       'input[name="tips"]'];
    selectors.forEach(selector => {
      const inputs = Array.from(document.querySelectorAll(selector));
      inputs.forEach(input => {
        input.addEventListener('change', () => this.saveOptions());
      });
    });
  }

  findElements() {
    this.shortcutTipContainer = document.getElementById('shortcut-tip-container')
    this.noShortcutTipContainer = document.getElementById('no-shortcut-tip-container')
    this.shortcut = document.getElementById('shortcut')
    this.stationListItemTpl = document.getElementById('station-list-item-template')
    this.chromeExtensionsLinks = document.querySelectorAll('.chrome-extensions-link')
    this.statusArea = document.getElementById('status-message');
    this.disableScrobbling = document.getElementById('disable_scrobbling');
    this.enableScrobbling = document.getElementById('enable_scrobbling');
    this.disableNotifications =
        document.getElementById('disable_notifications');
    this.darkTheme = document.getElementById('dark_theme');
    this.tipsOff = document.getElementById('tips_off')
    this.stationOptions = document.getElementById('stations-options');
    this.stationCount = document.getElementById('station-count');
    this.stationListEl = document.getElementById('stations-list');
    this.refreshStationsButton = document.getElementById('refresh-stations');
  }

  hookUpLinks() {
    for (const link of this.chromeExtensionsLinks) {
      link.addEventListener('click', e => this.openChromeExtensions(e))
    }
  }

  openChromeExtensions(event) {
    event.preventDefault()
    event.target.blur()

    chrome.tabs.create({ url: 'chrome://extensions' })
  }

  showShortcutTip() {
    chrome.commands.getAll(commands => {
      const popupCommand = commands.filter(c => c.name === '_execute_browser_action')[0]

      if (popupCommand && popupCommand.shortcut && popupCommand.shortcut.length > 0) {
        this.shortcut.textContent = popupCommand.shortcut
        this.shortcutTipContainer.classList.remove('d-none')
      } else {
        this.noShortcutTipContainer.classList.remove('d-none')
      }
    })
  }

  createStationListItem(data) {
    const el = this.stationListItemTpl.content.cloneNode(true)
    const link = el.querySelector('.station-link')

    link.href = `http://somafm.com/${data.id}/`
    link.textContent = data.title

    return el
  }

  restoreOptions() {
    const stations = SomaLocalStorage.getStations()
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
      if (opts.tips === 'off') {
        this.tipsOff.checked = true
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

    for (const data of stations) {
      const listItem = this.createStationListItem(data)
      this.stationListEl.appendChild(listItem)
    }
  }

  refreshStations() {
    console.debug('refreshing stations list')

    this.stationListEl.textContent = ''
    this.refreshStationsButton.disabled = true

    const msg = { action: 'refresh_stations' }
    chrome.runtime.sendMessage(msg, (stations, error) => {
      if (error) {
        this.stationListEl.textContent = 'Could not fetch station list. :('
      } else {
        this.showCachedStations(stations)
      }

      this.options.stations = stations
      this.refreshStationsButton.disabled = false
    })
  }

  dismissNotice() {
    this.statusArea.textContent = ''
    this.statusArea.classList.add('d-none')
  }

  flashNotice(message) {
    const show = () => {
      this.statusArea.textContent = message
      this.statusArea.classList.remove('d-none')
      setTimeout(() => this.dismissNotice(), 5000)
    }

    if (this.statusArea.classList.contains('d-none')) {
      show()
    } else {
      this.dismissNotice()
      setTimeout(show, 250)
    }
  }

  saveOptions() {
    const checkedNotifications =
        document.querySelector('input[name="notifications"]:checked');
    this.options.notifications = checkedNotifications.value === 'enabled';

    const checkedTheme = document.querySelector('input[name="theme"]:checked');
    this.options.theme = checkedTheme.value;

    const checkedTips = document.querySelector('input[name="tips"]:checked')
    this.options.tips = checkedTips.value

    return SomaPlayerUtil.setOptions(this.options).then(() => {
      this.flashNotice('Saved your options!');
      this.applyTheme();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SomaPlayerOptions();
});

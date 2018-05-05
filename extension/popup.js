class SomaPlayerPopup {
  constructor() {
    this.stationFilter = ''
    this.findElements()
    this.handleLinks()
    this.initializeVolume()
    this.hookupMenu()
    this.applyTheme()
    this.fetchSomaStations()
    this.listenForPlayback()
    this.listenForVolumeChange()
    this.addShortcutTip()
    this.displayTip()
  }

  hookupMenu() {
    this.stationMenuToggle.addEventListener('click', () => {
      if (this.stationMenuToggle.classList.contains('disabled')) {
        return
      }

      this.toggleStationMenu()
    })

    window.addEventListener('keydown', event => this.onKeydown(event))

    window.addEventListener('click', event => {
      const dropdown = event.target.closest('.dropdown')

      if (!dropdown) {
        this.closeStationMenu()
      }
    })
  }

  onKeydown(event) {
    switch (event.key) {
      case 'ArrowDown':
        this.focusStationListItem(1)
        this.openStationMenu()
        break
      case 'ArrowUp':
        this.focusStationListItem(-1)
        this.openStationMenu()
        break
      case 'Enter':
        this.handleEnter(event)
        break
      case ' ':
        this.handleSpace(event)
        break
      case 'Backspace':
        this.handleStationFilterTyping(null)
        break
      default:
        if (/[a-zA-Z0-9]/.test(String.fromCharCode(event.keyCode))) {
          this.handleStationFilterTyping(event.key)
        }
    }
  }

  updateStationFilter(newValue) {
    if (newValue === this.stationFilter) {
      return
    }

    this.stationFilter = newValue
    this.stationFilterEl.textContent = newValue

    const isFilterBlank = newValue === ''
    this.stationFilterEl.classList.toggle('d-none', isFilterBlank)

    if (isFilterBlank) {
      this.closeStationMenu()
      this.noStationMessage.classList.add('d-none')

      const hiddenStationListItems = this.stationListEl.querySelectorAll('.station-list-item.d-none')
      for (const listItem of hiddenStationListItems) {
        listItem.classList.remove('d-none')
      }
    }
  }

  handleStationFilterTyping(character) {
    if (!this.isStationMenuOpen()) {
      this.openStationMenu()
    }
    if (character) {
      this.updateStationFilter(this.stationFilter + character)
    } else {
      this.updateStationFilter(this.stationFilter.slice(0, this.stationFilter.length - 1))
    }
    this.filterStations()
  }

  handleSpace(event) {
    event.preventDefault()

    chrome.runtime.sendMessage({ action: 'info' }, info => {
      if (info.paused) {
        this.play()
      } else {
        this.pause()
      }
    })
  }

  handleEnter(event) {
    if (!this.isStationMenuOpen()) {
      return
    }
    event.preventDefault()

    const focusedItem = this.stationListEl.querySelector('.station-list-item.focused')
    if (focusedItem) {
      const button = focusedItem.querySelector('.station-button')
      this.updateStationFilter('')
      this.playStationFromButton(button)
    } else {
      this.toggleStationMenu()
    }
  }

  filterStations() {
    const focusedItem = this.stationListEl.querySelector('.station-list-item.focused')
    if (focusedItem) {
      focusedItem.classList.remove('focused')
    }

    const listItems = Array.from(this.stationListEl.querySelectorAll('.station-list-item'))
    const showAllStations = this.stationFilter === ''
    let hasListItemBeenFocused = false

    for (const listItem of listItems) {
      const value = listItem.getAttribute('data-station-filter')
      const filterMatchesStation = value.indexOf(this.stationFilter) === 0
      const isVisible = showAllStations || filterMatchesStation

      listItem.classList.toggle('d-none', !isVisible)

      if (isVisible && !hasListItemBeenFocused) {
        listItem.classList.add('focused')
        hasListItemBeenFocused = true
      }
    }

    this.noStationMessage.classList.toggle('d-none', hasListItemBeenFocused)
  }

  focusStationListItem(offset) {
    const focusedItem = this.stationListEl.querySelector('.station-list-item.focused')
    const listItems = Array.from(this.stationListEl.querySelectorAll('.station-list-item'))
    const firstListItem = listItems[0]
    const lastListItem = listItems[listItems.length - 1]
    let newFocusedItem

    if (focusedItem) {
      const index = listItems.indexOf(focusedItem)
      focusedItem.classList.remove('focused')

      if (offset > 0) {
        newFocusedItem = listItems[index + 1] || firstListItem
      } else {
        newFocusedItem = listItems[index - 1] || lastListItem
      }
    } else if (offset > 0) {
      newFocusedItem = firstListItem
    } else {
      newFocusedItem = lastListItem
    }

    if (newFocusedItem) {
      newFocusedItem.classList.add('focused')
      newFocusedItem.scrollIntoView()
    }
  }

  openStationMenu() {
    const container = this.stationMenuToggle.closest('.dropdown')
    container.classList.add('active')
    this.stationMenuToggle.classList.add('selected')

    const rect = this.stationListEl.getBoundingClientRect()
    const height = window.innerHeight - rect.top
    this.stationListEl.style.height = `${height}px`

    const focusedItem = this.stationListEl.querySelector('.station-list-item.focused')
    if (focusedItem) {
      focusedItem.scrollIntoView()
    }
  }

  closeStationMenu() {
    this.updateStationFilter('')
    const container = this.stationMenuToggle.closest('.dropdown')
    container.classList.remove('active')
    this.stationMenuToggle.classList.remove('selected')
  }

  isStationMenuOpen() {
    return this.stationMenuToggle.classList.contains('selected')
  }

  toggleStationMenu() {
    if (this.isStationMenuOpen()) {
      this.closeStationMenu()
    } else {
      this.openStationMenu()
    }
  }

  initializeVolume() {
    chrome.runtime.sendMessage({ action: 'get_volume' }, volume => {
      console.debug('volume restored', volume)
      this.volumeChanged(volume)
    })
  }

  volumeChanged(volume) {
    this.volumeSlider.value = volume
    this.volumeUp.disabled = volume >= 1
    this.volumeDown.disabled = volume <= 0
    this.updateVolumeSliderColors(volume)
  }

  updateVolumeSliderColors(volume) {
    const minVolume = parseFloat(this.volumeSlider.getAttribute('min'))
    const colorStop = volume - minVolume
    const leftColor = this.getVolumeSliderActiveColor()
    const rightColor = this.getVolumeSliderInactiveColor()
    const colorStops = `color-stop(${colorStop}, ${leftColor}), color-stop(${colorStop}, ${rightColor})`
    this.volumeSlider.style.backgroundImage = `-webkit-gradient(linear, left top, right top, ${colorStops})`
  }

  getVolumeSliderActiveColor() {
    if (document.body.classList.contains('theme-dark')) {
      return this.volumeSlider.getAttribute('data-left-dark-color')
    }

    return this.volumeSlider.getAttribute('data-left-color')
  }

  getVolumeSliderInactiveColor() {
    return this.volumeSlider.getAttribute('data-right-color')
  }

  listenForVolumeChange() {
    this.volumeSlider.addEventListener('change', () => this.onVolumeSliderChange())
    this.volumeSlider.addEventListener('input', () => this.onVolumeSliderChange())

    this.volumeUp.addEventListener('click', () => {
      const volume = parseFloat(this.volumeSlider.value) + 0.1
      this.changeVolume(volume)
    })

    this.volumeDown.addEventListener('click', () => {
      const volume = parseFloat(this.volumeSlider.value) - 0.1
      this.changeVolume(volume)
    })
  }

  onVolumeSliderChange() {
    const volume = parseFloat(this.volumeSlider.value)
    this.changeVolume(volume)
  }

  changeVolume(volume) {
    chrome.runtime.sendMessage({ action: 'change_volume', volume }, () => {
      console.debug('volume changed to', volume)
      this.volumeChanged(volume)
    })
  }

  listenForPlayback() {
    this.playButton.addEventListener('click', () => this.play())
    this.pauseButton.addEventListener('click', () => this.pause())
  }

  addShortcutTip() {
    chrome.commands.getAll(commands => {
      const popupCommand = commands.filter(c => c.name === '_execute_browser_action')[0]

      if (popupCommand && popupCommand.shortcut && popupCommand.shortcut.length > 0) {
        this.shortcut.textContent = popupCommand.shortcut
        this.shortcutTip.classList.add('js-tip')
      }
    })
  }

  displayTip() {
    SomaPlayerUtil.getOptions().then(opts => {
      const tipsSetting = opts.tips || 'on'
      if (tipsSetting !== 'on') {
        return
      }

      const tips = Array.from(this.tipsList.querySelectorAll('.js-tip'))
      const index = Math.floor(Math.random() * tips.length)
      const tip = tips[index]
      tip.classList.remove('d-none')
      this.tipsList.classList.remove('d-none')
    })
  }

  findElements() {
    this.stationMenuToggle = document.getElementById('station-menu-toggle')
    this.stationFilterEl = document.getElementById('station-filter')
    this.stationListEl = document.getElementById('station-list')
    this.stationListItemTpl = document.getElementById('station-list-item-template')
    this.noStationMessage = document.getElementById('no-station-message')
    this.playButton = document.getElementById('play')
    this.pauseButton = document.getElementById('pause')
    this.currentInfoEl = document.getElementById('currently-playing')
    this.trackListEl = document.getElementById('track-list')
    this.trackListItemTpl = document.getElementById('track-list-item-template')
    this.stationImg = document.getElementById('station-image')
    this.stationLink = document.getElementById('station-link')
    this.tipsList = document.getElementById('tips-list')
    this.shortcut = document.getElementById('shortcut')
    this.shortcutTip = document.getElementById('shortcut-tip')
    this.volumeSlider = document.getElementById('volume-slider')
    this.volumeDown = document.getElementById('volume-down')
    this.volumeUp = document.getElementById('volume-up')
    this.volumeContainer = document.getElementById('volume-container')
  }

  insertStationOptions(stations) {
    const activeStationID = SomaLocalStorage.getCurrentStation()

    for (const data of stations) {
      const listItem = this.createStationListItem(data, data.id === activeStationID)
      this.stationListEl.appendChild(listItem)
    }

    this.stationMenuToggle.classList.remove('disabled')
    setTimeout(() => this.stationMenuToggle.focus(), 100)
    this.loadCurrentInfo()
  }

  loadDefaultStations() {
    console.debug('loading default station list')
    const url = chrome.extension.getURL('defaultStations.json')
    SomaPlayerUtil.getJSON(url).
      then(defaultStations => this.insertStationOptions(defaultStations))
  }

  fetchSomaStations() {
    chrome.runtime.sendMessage({ action: 'get_stations' }, stations => {
      if (!stations || stations.length < 1) {
        const msg = { action: 'refresh_stations' }

        chrome.runtime.sendMessage(msg, (stations, error) => {
          if (error) {
            console.error('failed to fetch stations, using defaults')
            this.loadDefaultStations()
          } else {
            console.debug('fetched stations', stations)
            this.insertStationOptions(stations)
          }
        })
      } else {
        console.debug('stations already stored', stations)
        this.insertStationOptions(stations)
      }
    })
  }

  emptyTrackList() {
    while (this.trackListEl.hasChildNodes()) {
      this.trackListEl.removeChild(this.trackListEl.lastChild);
    }
  }

  listTracks(tracks) {
    setTimeout(() => {
      this.emptyTrackList()

      for (const track of tracks) {
        const listItem = this.createTrackListItem(track)
        this.trackListEl.appendChild(listItem)
      }
    }, 70)
  }

  onStationButtonClick(event) {
    const button = event.currentTarget
    this.playStationFromButton(button)
  }

  playStationFromButton(button) {
    const stationID = button.value
    const stationName = button.querySelector('.station-name').textContent
    const focusedItem = this.stationListEl.querySelector('.station-list-item.focused')
    const listItem = button.closest('.station-list-item')

    if (focusedItem) {
      focusedItem.classList.remove('focused')
    }
    button.blur()
    this.toggleStationMenu()
    this.stationChanged(stationID, stationName)
    listItem.classList.add('focused')
  }

  filterValueForStation(stationTitle) {
    return stationTitle.toLowerCase().replace(/\s+/g, '')
  }

  createStationListItem(data, isActive) {
    const el = this.stationListItemTpl.content.cloneNode(true)
    const button = el.querySelector('.station-button')
    const nameEl = el.querySelector('.station-name')
    const imageEl = el.querySelector('.station-image')
    const listItem = el.querySelector('.station-list-item')

    if (isActive) {
      listItem.classList.add('focused')
    }

    listItem.setAttribute('data-station-filter', this.filterValueForStation(data.title))
    imageEl.src = `station-images/${data.id}.png`
    button.value = data.id
    nameEl.textContent = data.title
    button.addEventListener('click', e => this.onStationButtonClick(e))

    return el
  }

  createTrackListItem(track) {
    const el = this.trackListItemTpl.content.cloneNode(true)
    const nameEl = el.querySelector('.track-name')
    const artistEl = el.querySelector('.artist')
    const timeEl = el.querySelector('.track-date')
    const date = new Date(track.date)

    nameEl.textContent = track.title
    artistEl.textContent = track.artist
    timeEl.textContent = this.prettyDate(date)

    return el
  }

  prettyDate(date) {
    const fullHours = date.getHours()
    let hours = fullHours
    if (hours > 12) {
      hours -= 12
    }
    let minutes = date.getMinutes()
    if (minutes < 10) {
      minutes = `0${minutes}`
    }
    let amPM = 'am'
    if (fullHours >= 12) {
      amPM = 'pm'
    }
    return `${hours}:${minutes} ${amPM}`
  }

  hideTrackInfo() {
    this.emptyTrackList()
    this.trackListEl.classList.add('d-none')
  }

  loadCurrentInfo() {
    this.stationMenuToggle.classList.add('disabled')

    chrome.runtime.sendMessage({ action: 'info' }, info => {
      console.debug('finished info request, info', info);
      const currentStationButton = document.querySelector(`.station-button[value="${info.station}"]`)
      if (currentStationButton) {
        this.stationMenuToggle.value = info.station
        this.stationMenuToggle.textContent = currentStationButton.textContent
      }

      if (info.paused) {
        this.stationIsPaused()
      } else {
        this.play()
      }

      this.updateStationImage(info.station)
      this.stationMenuToggle.classList.remove('disabled')
      this.listTracks(info.tracks)
    })
  }

  stationIsPlaying() {
    this.pauseButton.classList.remove('d-none')
    this.playButton.classList.add('d-none')
    this.stationMenuToggle.focus()
  }

  stationIsPaused() {
    this.pauseButton.classList.add('d-none')
    this.playButton.classList.remove('d-none')
    this.playButton.disabled = false
    this.stationMenuToggle.focus()
  }

  play() {
    const station = this.stationMenuToggle.value
    if (!station || station.length < 1) {
      return
    }
    console.debug('play', station)
    this.updateStationImage(station)

    chrome.runtime.sendMessage({ action: 'play', station }, () => {
      this.stationIsPlaying()

      chrome.runtime.sendMessage({ action: 'info' }, info => {
        if (info.tracks && info.tracks.length > 0) {
          this.listTracks(info.tracks)
        } else {
          const api = new SomaAPI()
          api.getStationTracks(station).
            then(tracks => this.listTracks(tracks)).
            catch(error => console.error('failed to get tracks', error))
        }
      })
    })
  }

  pause() {
    const station = this.stationMenuToggle.value
    console.debug('pausing station', station)

    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'pause', station }, () => {
        this.stationIsPaused()
        this.stationMenuToggle.focus()
        resolve()
      })
    })
  }

  updateStationImage(station) {
    if (station && station.length > 0) {
      this.stationImg.src = `station-images/${station}.png`
      this.stationLink.classList.remove('d-none')
      this.stationLink.href = `http://somafm.com/${station}/`
    } else {
      this.stationLink.href = '#'
      this.stationLink.classList.add('d-none')
    }
  }

  stationChanged(stationID, stationName) {
    if (stationID === '') {
      chrome.runtime.sendMessage({ action: 'clear' }, () => {
        this.playButton.disabled = true
        this.hideTrackInfo()
        this.pause()
        this.volumeContainer.classList.add('d-none')
      })
      return
    }

    this.stationMenuToggle.value = stationID
    this.stationMenuToggle.textContent = stationName
    this.closeStationMenu()
    this.volumeContainer.classList.remove('d-none')

    chrome.runtime.sendMessage({ action: 'info' }, info => {
      const currentStation = info.station

      if (stationID !== currentStation) {
        console.debug(`station changed to ${stationID}`)
        this.playButton.disabled = false
        this.pause().then(() => this.play())
      }
    })
  }

  handleLinks() {
    const links = Array.from(document.querySelectorAll('a'));
    for (let i = 0; i < links.length; i++) {
      this.handleLink(links[i]);
    }
  }

  handleLink(link) {
    link.addEventListener('click', event => {
      event.preventDefault()
      let url
      const href = link.href
      const optionsSuffix = '#options'
      if (href.indexOf(optionsSuffix) === href.length - optionsSuffix.length) {
        url = chrome.extension.getURL('options.html')
      } else {
        url = href
      }
      chrome.tabs.create({ url })
      return false
    });
  }

  applyTheme() {
    SomaPlayerUtil.getOptions().then(opts => {
      const theme = opts.theme || 'light'
      document.body.classList.add(`theme-${theme}`)
    })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SomaPlayerPopup();
});

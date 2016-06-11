class SomaPlayerPopup {
  constructor() {
    this.base = this;
    this.findElements();
    this.handleLinks();
    this.applyTheme();
    this.fetchSomaStations();
    this.listenForPlayback();
    this.listenForStationChange();
  }

  listenForStationChange() {
    this.stationSelect.addEventListener('change', () => {
      this.stationChanged();
    });
    this.stationSelect.addEventListener('keypress', e => {
      this.onStationKeypress(e.keyCode);
    });
  }

  listenForPlayback() {
    this.playButton.addEventListener('click', () => {
      this.play();
    });
    this.pauseButton.addEventListener('click', () => {
      this.pause();
    });
  }

  findElements() {
    this.stationSelect = document.getElementById('station');
    this.playButton = document.getElementById('play');
    this.pauseButton = document.getElementById('pause');
    this.currentInfoEl = document.getElementById('currently-playing');
    this.titleEl = document.getElementById('title');
    this.artistEl = document.getElementById('artist');
  }

  onStationKeypress(keyCode) {
    if (keyCode !== 13) { // Enter
      return;
    }
    if (this.stationSelect.value === '') {
      return;
    }
    if (!(this.playButton.disabled ||
          this.playButton.classList.contains('hidden'))) {
      console.debug('pressing play button');
      this.play();
    }
    if (!(this.pauseButton.disabled ||
          this.pauseButton.classList.contains('hidden'))) {
      console.debug('pressing pause button');
      this.pause();
    }
  }

  insertStationOptions(stations) {
    for (let i = 0; i < stations.length; i++) {
      const option = document.createElement('option');
      option.value = stations[i].id;
      option.textContent = stations[i].title;
      this.stationSelect.appendChild(option);
    }
    this.stationSelect.disabled = false;
    this.loadCurrentInfo();
  }

  loadDefaultStations() {
    console.debug('loading default station list');
    const defaultStations = [
      {
        id: 'bagel',
        title: 'BAGeL Radio'
      }, {
        id: 'beatblender',
        title: 'Beat Blender'
      }, {
        id: 'bootliquor',
        title: 'Boot Liquor'
      }, {
        id: 'brfm',
        title: 'Black Rock FM'
      }, {
        id: 'christmas',
        title: 'Christmas Lounge'
      }, {
        id: 'xmasrocks',
        title: 'Christmas Rocks!'
      }, {
        id: 'cliqhop',
        title: 'cliqhop idm'
      }, {
        id: 'covers',
        title: 'Covers'
      }, {
        id: 'events',
        title: 'DEF CON Radio'
      }, {
        id: 'deepspaceone',
        title: 'Deep Space One'
      }, {
        id: 'digitalis',
        title: 'Digitalis'
      }, {
        id: 'doomed',
        title: 'Doomed'
      }, {
        id: 'dronezone',
        title: 'Drone Zone'
      }, {
        id: 'dubstep',
        title: 'Dub Step Beyond'
      }, {
        id: 'earwaves',
        title: 'Earwaves'
      }, {
        id: 'folkfwd',
        title: 'Folk Forward'
      }, {
        id: 'groovesalad',
        title: 'Groove Salad'
      }, {
        id: 'illstreet',
        title: 'Illinois Street Lounge'
      }, {
        id: 'indiepop',
        title: 'Indie Pop Rocks!'
      }, {
        id: 'jollysoul',
        title: "Jolly Ol' Soul"
      }, {
        id: 'lush',
        title: 'Lush'
      }, {
        id: 'missioncontrol',
        title: 'Mission Control'
      }, {
        id: 'poptron',
        title: 'PopTron'
      }, {
        id: 'secretagent',
        title: 'Secret Agent'
      }, {
        id: '7soul',
        title: 'Seven Inch Soul'
      }, {
        id: 'sf1033',
        title: 'SF 10-33'
      }, {
        id: 'live',
        title: 'SomaFM Live'
      }, {
        id: 'sonicuniverse',
        title: 'Sonic Universe'
      }, {
        id: 'sxfm',
        title: 'South by Soma'
      }, {
        id: 'spacestation',
        title: 'Space Station Soma'
      }, {
        id: 'suburbsofgoa',
        title: 'Suburbs of Goa'
      }, {
        id: 'thetrip',
        title: 'The Trip'
      }, {
        id: 'thistle',
        title: 'ThistleRadio'
      }, {
        id: 'u80s',
        title: 'Underground 80s'
      }, {
        id: 'xmasinfrisko',
        title: 'Xmas in Frisko'
      }
    ];
    this.insertStationOptions(defaultStations);
  }

  fetchSomaStations() {
    SomaPlayerUtil.sendMessage({ action: 'get_stations' }).then(cache => {
      console.log('stations already stored', cache);
      if (!cache || cache.length < 1) {
        const msg = { action: 'fetch_stations' };
        SomaPlayerUtil.sendMessage(msg).then((stations, error) => {
          if (error) {
            this.loadDefaultStations();
          } else {
            this.insertStationOptions(stations);
          }
        });
      } else {
        this.insertStationOptions(cache);
      }
    });
  }

  displayTrackInfo(info) {
    if (info.artist || info.title) {
      this.titleEl.textContent = info.title;
      this.artistEl.textContent = info.artist;
      this.currentInfoEl.classList.remove('hidden');
    }
  }

  hideTrackInfo() {
    this.titleEl.textContent = '';
    this.artistEl.textContent = '';
    this.currentInfoEl.classList.add('hidden');
  }

  loadCurrentInfo() {
    this.stationSelect.disabled = true;
    return SomaPlayerUtil.sendMessage({ action: 'info' }).then(info => {
      console.debug('finished info request, info', info);
      this.stationSelect.value = info.station;
      if (info.paused) {
        this.stationIsPaused();
      } else {
        this.stationIsPlaying();
      }
      this.stationSelect.disabled = false;
      this.displayTrackInfo(info);
    });
  }

  stationIsPlaying() {
    this.pauseButton.classList.remove('hidden');
    this.playButton.classList.add('hidden');
    this.stationSelect.focus();
  }

  stationIsPaused() {
    this.pauseButton.classList.add('hidden');
    this.playButton.classList.remove('hidden');
    this.playButton.disabled = false;
    this.stationSelect.focus();
  }

  play() {
    const station = this.stationSelect.value;
    console.debug('play button clicked, station', station);
    SomaPlayerUtil.sendMessage({ action: 'play', station }).then(() => {
      console.debug('finishing telling station to play');
      this.stationIsPlaying();
      SomaPlayerUtil.sendMessage({ action: 'info' }).then(info => {
        if (info.artist !== '' || info.title !== '') {
          this.displayTrackInfo(info);
        } else {
          SomaPlayerUtil.getCurrentTrackInfo(station).then(info => {
            this.displayTrackInfo(info);
          });
        }
      });
    });
  }

  pause() {
    const station = this.stationSelect.value;
    console.debug('pause button clicked, station', station);
    return new Promise(resolve => {
      SomaPlayerUtil.sendMessage({ action: 'pause', station }).then(() => {
        console.debug('finished telling station to pause');
        this.stationIsPaused();
        this.stationSelect.focus();
        resolve();
      });
    });
  }

  stationChanged() {
    const newStation = this.stationSelect.value;
    if (newStation === '') {
      SomaPlayerUtil.sendMessage({ action: 'clear' }).then(() => {
        console.debug('station cleared');
        this.playButton.disabled = true;
        this.hideTrackInfo();
        this.pause();
      });
    } else {
      SomaPlayerUtil.sendMessage({ action: 'info' }).then(info => {
        const currentStation = info.station;
        if (newStation !== '' && newStation !== currentStation) {
          console.debug(`station changed to ${newStation}`);
          this.playButton.disabled = false;
          this.pause().then(this.play.bind(this));
        }
      });
    }
  }

  handleLinks() {
    const links = Array.from(document.querySelectorAll('a'));
    for (let i = 0; i < links.length; i++) {
      this.handleLink(links[i]);
    }
  }

  handleLink(link) {
    link.addEventListener('click', event => {
      event.preventDefault();
      let url;
      const href = link.href;
      const optionsSuffix = '#options';
      if (href.indexOf(optionsSuffix) === href.length - optionsSuffix.length) {
        url = chrome.extension.getURL('options.html');
      } else {
        url = href;
      }
      chrome.tabs.create({ url });
      return false;
    });
  }

  applyTheme() {
    return SomaPlayerUtil.getOptions().then(opts => {
      const theme = opts.theme || 'light';
      return document.body.classList.add(`theme-${theme}`);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SomaPlayerPopup();
});

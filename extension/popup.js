var SomaPlayerPopup = (function() {
  function SomaPlayerPopup() {
    this.base = this;
    this.findElements();
    this.handleLinks();
    this.applyTheme();
    this.fetchSomaStations();
    this.listenForPlayback();
    this.listenForStationChange();
  }

  SomaPlayerPopup.prototype.listenForStationChange = function() {
    this.stationSelect.change((function(_this) {
      return function() {
        return _this.station_changed();
      };
    })(this));
    this.stationSelect.keypress((function(_this) {
      return function(e) {
        return _this.onStationKeypress(e.keyCode);
      };
    })(this));
  };

  SomaPlayerPopup.prototype.listenForPlayback = function() {
    this.playButton.click((function(_this) {
      return function() {
        return _this.play();
      };
    })(this));
    this.pauseButton.click((function(_this) {
      return function() {
        return _this.pause();
      };
    })(this));
  };

  SomaPlayerPopup.prototype.findElements = function() {
    this.stationSelect = $('#station');
    this.playButton = $('#play');
    this.pauseButton = $('#pause');
    this.currentInfoEl = $('#currently-playing');
    this.titleEl = $('span#title');
    this.artistEl = $('span#artist');
  };

  SomaPlayerPopup.prototype.onStationKeypress = function(keyCode) {
    if (keyCode !== 13) { // Enter
      return;
    }
    if (this.stationSelect.val() === '') {
      return;
    }
    if (!(this.playButton.is(':disabled') ||
          this.playButton.hasClass('hidden'))) {
      console.debug('pressing play button');
      this.play();
    }
    if (!(this.pauseButton.is(':disabled') ||
          this.pauseButton.hasClass('hidden'))) {
      console.debug('pressing pause button');
      return this.pause();
    }
  };

  SomaPlayerPopup.prototype.insertStationOptions = function(stations) {
    for (var i = 0; i < stations.length; i++) {
      this.stationSelect.append('<option value="' + stations[i].id + '">' +
                                 stations[i].title + '</option>');
    }
    this.stationSelect.prop('disabled', false);
    this.loadCurrentInfo();
  };

  SomaPlayerPopup.prototype.loadDefaultStations = function() {
    console.debug('loading default station list');
    var defaultStations = [
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
  };

  SomaPlayerPopup.prototype.fetchSomaStations = function() {
    return SomaPlayerUtil.sendMessage({
      action: 'get_stations'
    }, (function(_this) {
      return function(cachedList) {
        console.log('stations already stored', cachedList);
        if (!cachedList || cachedList.length < 1) {
          var msg = { action: 'fetch_stations' };
          SomaPlayerUtil.sendMessage(msg, function(stations, error) {
            if (error) {
              _this.loadDefaultStations();
            } else {
              _this.insertStationOptions(stations);
            }
          });
        } else {
          _this.insertStationOptions(cachedList);
        }
      };
    })(this));
  };

  SomaPlayerPopup.prototype.displayTrackInfo = function(info) {
    if (info.artist || info.title) {
      this.titleEl.text(info.title);
      this.artistEl.text(info.artist);
      this.currentInfoEl.removeClass('hidden');
    }
  };

  SomaPlayerPopup.prototype.hideTrackInfo = function() {
    this.titleEl.text('');
    this.artistEl.text('');
    this.currentInfoEl.addClass('hidden');
  };

  SomaPlayerPopup.prototype.loadCurrentInfo = function() {
    this.stationSelect.prop('disabled', true);
    return SomaPlayerUtil.sendMessage({
      action: 'info'
    }, (function(_this) {
      return function(info) {
        console.debug('finished info request, info', info);
        _this.stationSelect.val(info.station);
        _this.stationSelect.trigger('change');
        if (info.paused) {
          _this.stationIsPaused();
        } else {
          _this.stationIsPlaying();
        }
        _this.stationSelect.prop('disabled', false);
        _this.displayTrackInfo(info);
      };
    })(this));
  };

  SomaPlayerPopup.prototype.stationIsPlaying = function() {
    this.pauseButton.removeClass('hidden');
    this.playButton.addClass('hidden');
    return this.stationSelect.focus();
  };

  SomaPlayerPopup.prototype.stationIsPaused = function() {
    this.pauseButton.addClass('hidden');
    this.playButton.removeClass('hidden').prop('disabled', false);
    return this.stationSelect.focus();
  };

  SomaPlayerPopup.prototype.play = function() {
    var station;
    station = this.stationSelect.val();
    console.debug('play button clicked, station', station);
    return SomaPlayerUtil.sendMessage({
      action: 'play',
      station: station
    }, (function(_this) {
      return function() {
        console.debug('finishing telling station to play');
        _this.stationIsPlaying();
        SomaPlayerUtil.sendMessage({
          action: 'info'
        }, function(info) {
          if (info.artist !== '' || info.title !== '') {
            _this.displayTrackInfo(info);
          } else {
            SomaPlayerUtil.getCurrentTrackInfo(station, function(info) {
              _this.displayTrackInfo(info);
            });
          }
        });
      };
    })(this));
  };

  SomaPlayerPopup.prototype.pause = function(callback) {
    var station = this.stationSelect.val();
    console.debug('pause button clicked, station', station);
    return SomaPlayerUtil.sendMessage({
      action: 'pause',
      station: station
    }, (function(_this) {
      return function() {
        console.debug('finished telling station to pause');
        _this.stationIsPaused();
        _this.stationSelect.focus();
        if (typeof callback === 'function') {
          callback();
        }
      };
    })(this));
  };

  SomaPlayerPopup.prototype.station_changed = function() {
    var newStation = this.stationSelect.val();
    if (newStation === '') {
      SomaPlayerUtil.sendMessage({
        action: 'clear'
      }, (function(_this) {
        return function() {
          console.debug('station cleared');
          _this.playButton.prop('disabled', true);
          _this.hideTrackInfo();
          _this.pause();
        };
      })(this));
    } else {
      SomaPlayerUtil.sendMessage({
        action: 'info'
      }, (function(_this) {
        return function(info) {
          var currentStation = info.station;
          if (newStation !== '' && newStation !== currentStation) {
            console.debug('station changed to ' + newStation);
            _this.playButton.prop('disabled', false);
            _this.pause(function() {
              _this.play();
            });
          }
        };
      })(this));
    }
  };

  SomaPlayerPopup.prototype.handleLinks = function() {
    return $('a').click(function(e) {
      e.preventDefault();
      var link = $(this);
      var url;
      if (link.attr('href') === '#options') {
        url = chrome.extension.getURL('options.html');
      } else {
        url = link.attr('href');
      }
      chrome.tabs.create({ url: url });
      return false;
    });
  };

  SomaPlayerPopup.prototype.applyTheme = function() {
    return SomaPlayerUtil.getOptions(function(opts) {
      var theme = opts.theme || 'light';
      return document.body.classList.add('theme-' + theme);
    });
  };

  return SomaPlayerPopup;
})();

document.addEventListener('DOMContentLoaded', function() {
  return new SomaPlayerPopup();
});

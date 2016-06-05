var SomaPlayerPopup;

SomaPlayerPopup = (function() {
  function SomaPlayerPopup() {
    this.base = this;
    this.station_select = $('#station');
    this.play_button = $('#play');
    this.pause_button = $('#pause');
    this.current_info_el = $('#currently-playing');
    this.title_el = $('span#title');
    this.artist_el = $('span#artist');
    this.handle_links();
    this.apply_theme();
    this.fetch_soma_channels();
    this.station_select.change((function(_this) {
      return function() {
        return _this.station_changed();
      };
    })(this));
    this.play_button.click((function(_this) {
      return function() {
        return _this.play();
      };
    })(this));
    this.pause_button.click((function(_this) {
      return function() {
        return _this.pause();
      };
    })(this));
    this.station_select.keypress((function(_this) {
      return function(e) {
        return _this.on_station_keypress(e.keyCode);
      };
    })(this));
  }

  SomaPlayerPopup.prototype.on_station_keypress = function(keyCode) {
    if (keyCode !== 13) {
      return;
    }
    if (this.station_select.val() === '') {
      return;
    }
    if (!(this.play_button.is(':disabled') || this.play_button.hasClass('hidden'))) {
      console.debug('pressing play button');
      this.play();
    }
    if (!(this.pause_button.is(':disabled') || this.pause_button.hasClass('hidden'))) {
      console.debug('pressing pause button');
      return this.pause();
    }
  };

  SomaPlayerPopup.prototype.insert_station_options = function(stations) {
    var station, _i, _len;
    for (_i = 0, _len = stations.length; _i < _len; _i++) {
      station = stations[_i];
      this.station_select.append('<option value="' + station.id + '">' + station.title + '</option>');
    }
    this.station_select.prop('disabled', false);
    return this.load_current_info();
  };

  SomaPlayerPopup.prototype.load_default_stations = function() {
    var default_stations;
    console.debug('loading default station list');
    default_stations = [
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
    return this.insert_station_options(default_stations);
  };

  SomaPlayerPopup.prototype.fetch_soma_channels = function() {
    return SomaPlayerUtil.send_message({
      action: 'get_stations'
    }, (function(_this) {
      return function(cached_list) {
        var msg;
        console.log('stations already stored', cached_list);
        if (cached_list === null || cached_list.length < 1) {
          msg = {
            action: 'fetch_stations'
          };
          return SomaPlayerUtil.send_message(msg, function(stations, error) {
            if (error) {
              return _this.load_default_stations();
            } else {
              return _this.insert_station_options(stations);
            }
          });
        } else {
          return _this.insert_station_options(cached_list);
        }
      };
    })(this));
  };

  SomaPlayerPopup.prototype.display_track_info = function(info) {
    if (info.artist || info.title) {
      this.title_el.text(info.title);
      this.artist_el.text(info.artist);
      return this.current_info_el.removeClass('hidden');
    }
  };

  SomaPlayerPopup.prototype.hide_track_info = function() {
    this.title_el.text('');
    this.artist_el.text('');
    return this.current_info_el.addClass('hidden');
  };

  SomaPlayerPopup.prototype.load_current_info = function() {
    this.station_select.prop('disabled', true);
    return SomaPlayerUtil.send_message({
      action: 'info'
    }, (function(_this) {
      return function(info) {
        console.debug('finished info request, info', info);
        _this.station_select.val(info.station);
        _this.station_select.trigger('change');
        if (info.is_paused) {
          _this.station_is_paused();
        } else {
          _this.station_is_playing();
        }
        _this.station_select.prop('disabled', false);
        return _this.display_track_info(info);
      };
    })(this));
  };

  SomaPlayerPopup.prototype.station_is_playing = function() {
    this.pause_button.removeClass('hidden');
    this.play_button.addClass('hidden');
    return this.station_select.focus();
  };

  SomaPlayerPopup.prototype.station_is_paused = function() {
    this.pause_button.addClass('hidden');
    this.play_button.removeClass('hidden').prop('disabled', false);
    return this.station_select.focus();
  };

  SomaPlayerPopup.prototype.play = function() {
    var station;
    station = this.station_select.val();
    console.debug('play button clicked, station', station);
    return SomaPlayerUtil.send_message({
      action: 'play',
      station: station
    }, (function(_this) {
      return function() {
        console.debug('finishing telling station to play');
        _this.station_is_playing();
        return SomaPlayerUtil.send_message({
          action: 'info'
        }, function(info) {
          if (info.artist !== '' || info.title !== '') {
            return _this.display_track_info(info);
          } else {
            return SomaPlayerUtil.get_current_track_info(station, function(info) {
              return _this.display_track_info(info);
            });
          }
        });
      };
    })(this));
  };

  SomaPlayerPopup.prototype.pause = function(callback) {
    var station;
    station = this.station_select.val();
    console.debug('pause button clicked, station', station);
    return SomaPlayerUtil.send_message({
      action: 'pause',
      station: station
    }, (function(_this) {
      return function() {
        console.debug('finished telling station to pause');
        _this.station_is_paused();
        _this.station_select.focus();
        if (typeof callback === 'function') {
          return callback();
        }
      };
    })(this));
  };

  SomaPlayerPopup.prototype.station_changed = function() {
    var new_station;
    new_station = this.station_select.val();
    if (new_station === '') {
      return SomaPlayerUtil.send_message({
        action: 'clear'
      }, (function(_this) {
        return function() {
          console.debug('station cleared');
          _this.play_button.prop('disabled', true);
          _this.hide_track_info();
          return _this.pause();
        };
      })(this));
    } else {
      return SomaPlayerUtil.send_message({
        action: 'info'
      }, (function(_this) {
        return function(info) {
          var current_station;
          current_station = info.station;
          if (new_station !== '' && new_station !== current_station) {
            console.debug('station changed to ' + new_station);
            _this.play_button.prop('disabled', false);
            return _this.pause(function() {
              return _this.play();
            });
          }
        };
      })(this));
    }
  };

  SomaPlayerPopup.prototype.handle_links = function() {
    return $('a').click(function(e) {
      var link, url;
      e.preventDefault();
      link = $(this);
      if (link.attr('href') === '#options') {
        url = chrome.extension.getURL('options.html');
      } else {
        url = link.attr('href');
      }
      chrome.tabs.create({
        url: url
      });
      return false;
    });
  };

  SomaPlayerPopup.prototype.apply_theme = function() {
    return SomaPlayerUtil.get_options(function(opts) {
      var theme;
      theme = opts.theme || 'light';
      return document.body.classList.add('theme-' + theme);
    });
  };

  return SomaPlayerPopup;

})();

document.addEventListener('DOMContentLoaded', function() {
  return new SomaPlayerPopup();
});

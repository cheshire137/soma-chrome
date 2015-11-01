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
        if (e.keyCode === 13) {
          if (_this.station_select.val() === '') {
            return;
          }
          if (!(_this.play_button.is(':disabled') || _this.play_button.hasClass('hidden'))) {
            console.debug('pressing play button');
            _this.play_button.click();
          }
          if (!(_this.pause_button.is(':disabled') || _this.pause_button.hasClass('hidden'))) {
            console.debug('pressing pause button');
            return _this.pause_button.click();
          }
        }
      };
    })(this));
  }

  SomaPlayerPopup.prototype.insert_station_options = function(stations) {
    var station, _i, _len;
    for (_i = 0, _len = stations.length; _i < _len; _i++) {
      station = stations[_i];
      this.station_select.append('<option value="' + station.id + '">' + station.title + '</option>');
    }
    this.station_select.prop('disabled', false);
    return this.load_current_info();
  };

  SomaPlayerPopup.prototype.on_channels_fetched = function(data) {
    var simple_stations, station, stations, _i, _len;
    console.log('stations', data);
    stations = data.channels;
    this.insert_station_options(stations);
    simple_stations = [];
    for (_i = 0, _len = stations.length; _i < _len; _i++) {
      station = stations[_i];
      simple_stations.push({
        id: station.id,
        title: station.title
      });
    }
    return SomaPlayerUtil.send_message({
      action: 'set_stations',
      stations: simple_stations
    });
  };

  SomaPlayerPopup.prototype.on_channel_fetch_error = function(jq_xhr, status, error) {
    var default_stations;
    console.error('failed to fetch Soma.fm channels', error);
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
      return function(stations) {
        var url;
        console.log('stations already stored', stations);
        if (stations === null || stations.length < 1) {
          url = 'http://api.somafm.com/channels.json';
          console.debug('Fetching channels list from ' + url);
          return $.getJSON(url).done(_this.on_channels_fetched.bind(_this)).fail(_this.on_channel_fetch_error.bind(_this));
        } else {
          return _this.insert_station_options(stations);
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
        return _this.display_track_info(info);
      };
    })(this));
  };

  SomaPlayerPopup.prototype.station_is_playing = function() {
    this.pause_button.removeClass('hidden');
    this.play_button.addClass('hidden');
    this.station_select.prop('disabled', true);
    return this.pause_button.focus();
  };

  SomaPlayerPopup.prototype.station_is_paused = function() {
    this.pause_button.addClass('hidden');
    this.play_button.removeClass('hidden');
    this.station_select.prop('disabled', false);
    return this.play_button.focus();
  };

  SomaPlayerPopup.prototype.play = function() {
    var station;
    this.station_select.prop('disabled', true);
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

  SomaPlayerPopup.prototype.pause = function() {
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
        _this.hide_track_info();
        return _this.station_select.focus();
      };
    })(this));
  };

  SomaPlayerPopup.prototype.station_changed = function() {
    var station;
    station = this.station_select.val();
    if (station === '') {
      console.debug('station cleared');
      return this.play_button.prop('disabled', true);
    } else {
      console.debug('station changed to ' + station);
      return this.play_button.prop('disabled', false);
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

  return SomaPlayerPopup;

})();

document.addEventListener('DOMContentLoaded', function() {
  return new SomaPlayerPopup();
});

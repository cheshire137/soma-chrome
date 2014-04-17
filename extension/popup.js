var SomaPlayerPopup;

SomaPlayerPopup = (function() {
  function SomaPlayerPopup() {
    console.debug('popup opened');
    this.station_select = $('#station');
    this.play_button = $('#play');
    this.pause_button = $('#pause');
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
  }

  SomaPlayerPopup.prototype.play = function() {
    var station;
    station = this.station_select.val();
    console.debug('play button clicked, station', station);
    this.pause_button.removeClass('hidden');
    return this.play_button.addClass('hidden');
  };

  SomaPlayerPopup.prototype.pause = function() {
    var station;
    station = this.station_select.val();
    console.debug('pause button clicked, station', station);
    this.pause_button.addClass('hidden');
    return this.play_button.removeClass('hidden');
  };

  SomaPlayerPopup.prototype.station_changed = function() {
    var station;
    station = this.station_select.val();
    console.debug('station changed to', station);
    if (station === '') {
      return this.play_button.attr('disabled', 'disabled');
    } else {
      return this.play_button.removeAttr('disabled');
    }
  };

  return SomaPlayerPopup;

})();

document.addEventListener('DOMContentLoaded', function() {
  return new SomaPlayerPopup();
});

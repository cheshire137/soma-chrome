var SomaPlayerBackground;

SomaPlayerBackground = (function() {
  function SomaPlayerBackground(station) {
    this.station = station;
    this.playlist_url = "http://somafm.com/" + this.station + ".pls";
    this.stream_url = "http://ice.somafm.com/" + this.station;
  }

  SomaPlayerBackground.prototype.play = function() {
    console.debug('playing station', this.station);
    return $('body').append($("<audio src='" + this.stream_url + "' autoplay='true' data-station='" + this.station + "'></audio>"));
  };

  SomaPlayerBackground.prototype.pause = function() {
    console.debug('pausing station', this.station);
    return $('audio').remove();
  };

  SomaPlayerBackground.get_current_station = function() {
    var audio;
    audio = $('audio');
    if (audio.length < 1) {
      return '';
    } else {
      return audio.data('station');
    }
  };

  return SomaPlayerBackground;

})();

SomaPlayerUtil.receive_message(function(request, sender, send_response) {
  var bg, station;
  console.debug('received message:', request);
  if (request.action === 'play') {
    bg = new SomaPlayerBackground(request.station);
    bg.play();
    send_response();
    return true;
  } else if (request.action === 'pause') {
    bg = new SomaPlayerBackground(request.station);
    bg.pause();
    send_response();
    return true;
  } else if (request.action === 'info') {
    station = SomaPlayerBackground.get_current_station();
    console.debug('current station:', station);
    send_response(station);
    return true;
  }
});

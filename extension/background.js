var SomaPlayerBackground;

SomaPlayerBackground = (function() {
  function SomaPlayerBackground(station) {
    this.station = station;
    this.playlist_url = "http://somafm.com/" + this.station + ".pls";
    this.stream_url = "http://ice.somafm.com/" + this.station;
  }

  SomaPlayerBackground.prototype.play = function() {
    console.debug('playing station', this.station);
    return $('body').append($("<audio src='" + this.stream_url + "' autoplay='true'></audio>"));
  };

  SomaPlayerBackground.prototype.pause = function() {
    console.debug('pausing station', this.station);
    return $('audio').remove();
  };

  return SomaPlayerBackground;

})();

SomaPlayerUtil.receive_message(function(request, sender, send_response) {
  var bg;
  console.debug('received message:', request);
  bg = new SomaPlayerBackground(request.station);
  if (request.action === 'play') {
    bg.play();
    send_response({});
    return true;
  } else if (request.action === 'pause') {
    bg.pause();
    send_response({});
    return true;
  }
});

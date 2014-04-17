var SomaPlayerBackground;

SomaPlayerBackground = (function() {
  function SomaPlayerBackground(station) {
    this.station = station;
  }

  SomaPlayerBackground.prototype.play = function() {
    return console.debug('playing station', this.station);
  };

  SomaPlayerBackground.prototype.pause = function() {
    return console.debug('pausing station', this.station);
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

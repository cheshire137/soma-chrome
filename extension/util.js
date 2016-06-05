var SomaPlayerUtil;

SomaPlayerUtil = (function() {
  function SomaPlayerUtil() {}

  SomaPlayerUtil.get_lastfm_connection = function() {
    return new LastFM({
      apiKey: SomaPlayerConfig.lastfm_api_key,
      apiSecret: SomaPlayerConfig.lastfm_api_secret,
      apiUrl: SomaPlayerConfig.lastfm_api_url,
      cache: new LastFMCache()
    });
  };

  SomaPlayerUtil.send_message = function(message, on_response) {
    console.debug('sending message:', message);
    return chrome.runtime.sendMessage(message, on_response);
  };

  SomaPlayerUtil.receive_message = function(handler) {
    console.log('setting up message receiver');
    return chrome.runtime.onMessage.addListener(handler);
  };

  SomaPlayerUtil.get_current_track_info = function(station, callback) {
    var url;
    url = SomaPlayerConfig.scrobbler_api_url + '/api/v1/nowplaying/' + station;
    console.debug('getting current track info from', url);
    return $.getJSON(url, function(track) {
      console.debug('got track info', track);
      return callback(track);
    });
  };

  SomaPlayerUtil.get_url_param = function(name) {
    var regex, results;
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    results = regex.exec(location.search);
    if (results === null) {
      return "";
    }
    return decodeURIComponent(results[1].replace(/\+/g, " "));
  };

  SomaPlayerUtil.get_options = function(callback) {
    return chrome.storage.sync.get('somaplayer_options', function(opts) {
      opts = opts.somaplayer_options || {};
      return callback(opts);
    });
  };

  SomaPlayerUtil.set_options = function(opts, callback) {
    return chrome.storage.sync.set({
      'somaplayer_options': opts
    }, function() {
      if (callback) {
        return callback();
      }
    });
  };

  return SomaPlayerUtil;

})();

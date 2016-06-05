window.SomaPlayerUtil = (function() {
  function SomaPlayerUtil() {
  }

  SomaPlayerUtil.getLastfmConnection = function() {
    return new LastFM({
      apiKey: SomaPlayerConfig.lastfm_api_key,
      apiSecret: SomaPlayerConfig.lastfm_api_secret,
      apiUrl: SomaPlayerConfig.lastfm_api_url,
      cache: new LastFMCache()
    });
  };

  SomaPlayerUtil.sendMessage = function(message, onResponse) {
    console.debug('sending message:', message);
    return chrome.runtime.sendMessage(message, onResponse);
  };

  SomaPlayerUtil.receiveMessage = function(handler) {
    console.log('setting up message receiver');
    return chrome.runtime.onMessage.addListener(handler);
  };

  SomaPlayerUtil.getCurrentTrackInfo = function(station, callback) {
    var url = SomaPlayerConfig.scrobbler_api_url + '/api/v1/nowplaying/' +
              station;
    console.debug('getting current track info from', url);
    return $.getJSON(url, function(track) {
      console.debug('got track info', track);
      return callback(track);
    });
  };

  SomaPlayerUtil.getUrlParam = function(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(window.location.search);
    if (results === null) {
      return '';
    }
    return decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  SomaPlayerUtil.getOptions = function(callback) {
    return chrome.storage.sync.get('somaplayer_options', function(opts) {
      opts = opts.somaplayer_options || {};
      return callback(opts);
    });
  };

  SomaPlayerUtil.setOptions = function(opts, callback) {
    return chrome.storage.sync.set({ somaplayer_options: opts }, function() {
      if (callback) {
        return callback();
      }
    });
  };

  return SomaPlayerUtil;
})();

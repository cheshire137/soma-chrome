var SomaPlayerUtil;

SomaPlayerUtil = (function() {
  function SomaPlayerUtil() {}

  SomaPlayerUtil.config = function() {
    return {
      lastfm_api_key: 'cbf33bb9eef14a25b0e08cd47530706c',
      lastfm_api_secret: '797d623a73501d358f6ca0e5f8fd3cf0',
      lastfm_api_url: 'https://ws.audioscrobbler.com/2.0/',
      scrobbler_api_url: 'http://api.somascrobbler.com'
    };
  };

  SomaPlayerUtil.get_lastfm_connection = function() {
    var config;
    config = SomaPlayerUtil.config();
    return new LastFM({
      apiKey: config.lastfm_api_key,
      apiSecret: config.lastfm_api_secret,
      apiUrl: config.lastfm_api_url,
      cache: new LastFMCache()
    });
  };

  SomaPlayerUtil.get_chrome_runtime_or_extension = function() {
    if (chrome.runtime && chrome.runtime.sendMessage) {
      return 'runtime';
    }
    return 'extension';
  };

  SomaPlayerUtil.send_message = function(message, on_response) {
    var runtime_or_extension;
    console.debug('sending message:', message);
    runtime_or_extension = this.get_chrome_runtime_or_extension();
    return chrome[runtime_or_extension].sendMessage(message, on_response);
  };

  SomaPlayerUtil.receive_message = function(handler) {
    var runtime_or_extension;
    console.log('setting up message receiver');
    runtime_or_extension = this.get_chrome_runtime_or_extension();
    return chrome[runtime_or_extension].onMessage.addListener(handler);
  };

  SomaPlayerUtil.scrobble_encode = function(str) {
    return str.toString().replace(/\s/g, "+");
  };

  SomaPlayerUtil.get_url_param = function(name) {
    var regex, results;
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    results = regex.exec(location.search);
    if (results === null) {
      return "";
    } else {
      return decodeURIComponent(results[1].replace(/\+/g, " "));
    }
  };

  return SomaPlayerUtil;

})();

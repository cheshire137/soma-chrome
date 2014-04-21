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

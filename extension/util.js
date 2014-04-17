var SomaPlayerUtil;

SomaPlayerUtil = (function() {
  function SomaPlayerUtil() {}

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

  return SomaPlayerUtil;

})();

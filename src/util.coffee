class SomaPlayerUtil
  @get_chrome_runtime_or_extension: ->
    return 'runtime' if chrome.runtime && chrome.runtime.sendMessage
    'extension'

  @send_message: (message, on_response) ->
    console.debug 'sending message:', message
    runtime_or_extension = @get_chrome_runtime_or_extension()
    chrome[runtime_or_extension].sendMessage(message, on_response)

  @receive_message: (handler) ->
    console.log 'setting up message receiver'
    runtime_or_extension = @get_chrome_runtime_or_extension()
    chrome[runtime_or_extension].onMessage.addListener(handler)

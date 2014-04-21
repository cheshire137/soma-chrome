class SomaPlayerUtil
  @get_lastfm_connection: ->
    new LastFM
      apiKey: SomaPlayerConfig.lastfm_api_key
      apiSecret: SomaPlayerConfig.lastfm_api_secret
      apiUrl: SomaPlayerConfig.lastfm_api_url
      cache: new LastFMCache()

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

  @get_url_param: (name) ->
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]")
    regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
    results = regex.exec(location.search)
    if results == null
      ""
    else
      decodeURIComponent(results[1].replace(/\+/g, " "))

  @get_options: (callback) ->
    chrome.storage.sync.get 'somaplayer_options', (opts) ->
      opts = opts.somaplayer_options || {}
      callback(opts)

  @set_options: (opts, callback) ->
    chrome.storage.sync.set {'somaplayer_options': opts}, ->
      callback() if callback

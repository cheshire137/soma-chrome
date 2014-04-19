class SomaPlayerUtil
  @config: ->
    lastfm_api_key: 'cbf33bb9eef14a25b0e08cd47530706c'
    lastfm_api_secret: '797d623a73501d358f6ca0e5f8fd3cf0'
    lastfm_api_url: 'https://ws.audioscrobbler.com/2.0/'
    scrobbler_api_url: 'http://api.somascrobbler.com'

  @get_lastfm_connection: ->
    config = SomaPlayerUtil.config()
    new LastFM
      apiKey: config.lastfm_api_key
      apiSecret: config.lastfm_api_secret
      apiUrl: config.lastfm_api_url
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

  @scrobble_encode: (str) ->
    str.toString().replace(/\s/g, "+")

  @get_url_param: (name) ->
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]")
    regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
    results = regex.exec(location.search)
    if results == null
      ""
    else
      decodeURIComponent(results[1].replace(/\+/g, " "))

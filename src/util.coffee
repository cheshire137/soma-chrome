class SomaPlayerUtil
  @get_lastfm_connection: ->
    new LastFM
      apiKey: SomaPlayerConfig.lastfm_api_key
      apiSecret: SomaPlayerConfig.lastfm_api_secret
      apiUrl: SomaPlayerConfig.lastfm_api_url
      cache: new LastFMCache()

  @send_message: (message, on_response) ->
    console.debug 'sending message:', message
    chrome.runtime.sendMessage(message, on_response)

  @receive_message: (handler) ->
    console.log 'setting up message receiver'
    chrome.runtime.onMessage.addListener(handler)

  @get_current_track_info: (station, callback) ->
    url = SomaPlayerConfig.scrobbler_api_url + '/api/v1/nowplaying/' + station
    console.debug 'getting current track info from', url
    $.getJSON url, (track) =>
      console.debug 'got track info', track
      callback track

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

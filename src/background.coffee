soma_player_bg = undefined

class SomaPlayerBackground
  constructor: ->
    console.debug 'initializing SomaPlayer background script'
    @lastfm = SomaPlayerUtil.get_lastfm_connection()
    @audio = $('audio')
    if @audio.length < 1
      console.debug 'adding new audio tag'
      $('body').append $('<audio autoplay="true" data-station=""></audio>')
      @audio = $('audio')
    @title_el = $('div#title')
    if @title_el.length < 1
      $('body').append($('<div id="title"></div>'))
      @title_el = $('div#title')
    @artist_el = $('div#artist')
    if @artist_el.length < 1
      $('body').append($('<div id="artist"></div>'))
      @artist_el = $('div#artist')
    @socket = io.connect(SomaPlayerConfig.scrobbler_api_url)

  play: (station) ->
    console.debug 'playing station', station
    @reset_track_info_if_necessary(station)
    @subscribe(station)
    console.debug 'adding track listener'
    @socket.on 'track', @on_track
    # playlist_url = "http://somafm.com/#{station}.pls"
    # TODO: download playlist and read stream URL from it
    @audio.attr 'src', "http://ice.somafm.com/#{station}"
    @audio.attr 'data-station', station
    @audio.removeAttr 'data-paused'

  reset_track_info_if_necessary: (station) ->
    return if @audio.attr('data-station') == station
    console.debug 'changed station from', @audio.attr('data-station'), 'to',
                  station, ', clearing current track info'
    @title_el.text ''
    @artist_el.text ''

  get_current_track_info: (station) ->
    SomaPlayerUtil.get_current_track_info station, (track) =>
      @title_el.text track.title
      @artist_el.text track.artist

  subscribe: (station) ->
    emit_subscribe = =>
      console.debug 'subscribing to', station, '...'
      @socket.emit 'subscribe', station, (response) =>
        if response.subscribed
          console.debug 'subscribed to', station
          @get_current_track_info station
        else
          console.error 'failed to subscribe to', station, response
    if @socket.connected
      emit_subscribe()
    else
      @socket.on 'connect', =>
        emit_subscribe()

  on_track: (track) =>
    console.debug 'new track:', track
    @title_el.text track.title
    @artist_el.text track.artist
    SomaPlayerUtil.get_options (opts) =>
      @notify_of_track(track, opts)
      @scrobble_track(track, opts)

  notify_of_track: (track, opts) ->
    # Default to showing notifications, so if user has not saved preferences,
    # assume they want notifications.
    return if opts.notifications == false
    notification_opt =
      type: 'basic'
      title: track.artist
      message: track.title
      iconUrl: 'icon48.png'
    chrome.notifications.create '', notification_opt, (notification_id) ->

  scrobble_track: (track, opts) ->
    return unless opts.lastfm_session_key && opts.lastfm_user && opts.scrobbling
    console.debug 'scrobbling track for Last.fm user', opts.lastfm_user
    scrobble_data =
      artist: (track.artist || '').replace(/"/g, "'")
      track: (track.title || '').replace(/"/g, "'")
      user: opts.lastfm_user
      timestamp: Math.round((new Date()).getTime() / 1000)
    @lastfm.track.scrobble scrobble_data, {key: opts.lastfm_session_key},
      success: ->
        try
          $('iframe').contents().find('form').submit()
          console.debug 'scrobbled track'
        catch e
          # Mysterious second submit after scrobble form has already POSTed
          # to Last.fm and the iframe has its origin changed to
          # ws.audioscrobbler.com, which can't be touched by the extension.
          unless e.name == 'SecurityError'
            throw e
      error: (data) ->
        console.error 'failed to scrobble track; response:', data

  pause: (station) ->
    console.debug 'pausing station', station
    @unsubscribe(station)
    audio_tag = @audio[0]
    audio_tag.pause()
    audio_tag.currentTime = 0
    @audio.attr 'data-paused', 'true'

  unsubscribe: (station) ->
    console.debug 'unsubscribing from', station, '...'
    @socket.emit 'unsubscribe', station, (response) =>
      if response.unsubscribed
        console.debug 'unsubscribed from', station
      else
        console.error 'failed to unsubscribe from', station
    console.debug 'removing track listener'
    @socket.removeListener 'track', @on_track

  get_info: ->
    station = if @audio.length < 1 then '' else @audio.attr('data-station') || ''
    station: station
    artist: @artist_el.text()
    title: @title_el.text()
    is_paused: @audio.is('[data-paused]') || station == ''

  set_stations: (stations) ->
    console.debug 'set stations', stations
    SomaPlayerUtil.get_options (opts) =>
      opts.stations = stations
      SomaPlayerUtil.set_options opts

  get_stations: (callback) ->
    SomaPlayerUtil.get_options (opts) =>
      callback opts.stations

  fetch_stations: (callback) ->
    url = 'http://api.somafm.com/channels.json'
    console.debug 'fetching channels list from ' + url
    $.getJSON(url).done(@on_stations_fetched.bind(@, callback)).
                   fail(@on_station_fetch_error.bind(@, callback))

  on_stations_fetched: (callback, data) ->
    console.debug 'fetched stations list', data
    stations = data.channels
    simple_stations = []
    for station in stations
      simple_stations.push
        id: station.id
        title: station.title
    @set_stations simple_stations
    callback simple_stations

  on_station_fetch_error: (callback, xhr, status, error) ->
    console.error 'failed to fetch stations list', error
    callback null, true

$ ->
  soma_player_bg = new SomaPlayerBackground()

SomaPlayerUtil.receive_message (request, sender, send_response) ->
  console.debug 'received message in background:', request
  if request.action == 'play'
    soma_player_bg.play(request.station)
    send_response()
    return true
  else if request.action == 'pause'
    soma_player_bg.pause(request.station)
    send_response()
    return true
  else if request.action == 'info'
    info = soma_player_bg.get_info()
    console.debug 'info:', info
    send_response(info)
    return true
  else if request.action == 'fetch_stations'
    soma_player_bg.fetch_stations (stations, error) ->
      send_response stations, error
    return true
  else if request.action == 'get_stations'
    soma_player_bg.get_stations (stations) ->
      console.debug 'got saved list of stations:', stations
      send_response stations
    return true

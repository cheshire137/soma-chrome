class SomaPlayerBackground
  constructor: ->
    @lastfm = SomaPlayerUtil.get_lastfm_connection()
    @audio = $('audio')
    if @audio.length < 1
      console.debug 'adding new audio tag'
      $('body').append $('<audio autoplay="true"></audio>')
      @audio = $('audio')
    @title_el = $('div#title')
    if @title_el.length < 1
      $('body').append($('<div id="title"></div>'))
      @title_el = $('div#title')
    @artist_el = $('div#artist')
    if @artist_el.length < 1
      $('body').append($('<div id="artist"></div>'))
      @artist_el = $('div#artist')

  play: (station) ->
    console.debug 'playing station', station
    @socket = io.connect(SomaPlayerConfig.scrobbler_api_url)
    @reset_track_info_if_necessary(station)
    @subscribe(station)
    @listen_for_track_changes()
    # playlist_url = "http://somafm.com/#{station}.pls"
    # TODO: download playlist and read stream URL from it
    @audio.attr 'src', "http://ice.somafm.com/#{station}"
    @audio.data 'station', station

  reset_track_info_if_necessary: (station) ->
    return if @audio.data('station') == station
    console.debug 'changed station from', @audio.data('station'), 'to',
                  station, ', clearing current track info'
    @title_el.text ''
    @artist_el.text ''

  subscribe: (station) ->
    emit_subscribe = =>
      console.debug 'subscribing to', station, '...'
      @socket.emit 'subscribe', station, (response) =>
        if response.subscribed
          console.debug 'subscribed to', station
        else
          console.error 'failed to subscribe to', station
    if @socket.socket.connected
      emit_subscribe()
    else
      @socket.on 'connect', =>
        emit_subscribe()

  listen_for_track_changes: ->
    @socket.on 'track', (track) =>
      console.debug 'new track:', track
      @title_el.text track.title
      @artist_el.text track.artist
      chrome.storage.sync.get 'somaplayer_options', (opts) =>
        opts = opts.somaplayer_options || {}
        @notify_of_track(track, opts)
        @scrobble_track(track, opts)

  notify_of_track: (track, opts) ->
    # Default to showing notifications, so if user has not saved preferences,
    # assume they want notifications.
    return if opts.notifications == false
    notice = webkitNotifications.createNotification('icon48.png', track.title,
                                                    track.artist)
    notice.show()
    setTimeout (-> notice.cancel()), 3000

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

  unsubscribe: (station) ->
    console.debug 'unsubscribing from', station, '...'
    @socket.emit 'unsubscribe', station, (response) =>
      if response.unsubscribed
        console.debug 'unsubscribed from', station
      else
        console.error 'failed to unsubscribe from', station

  get_info: ->
    station: if @audio.length < 1 then '' else @audio.data('station')
    artist: @artist_el.text()
    title: @title_el.text()

SomaPlayerUtil.receive_message (request, sender, send_response) ->
  console.debug 'received message in background:', request
  if request.action == 'play'
    bg = new SomaPlayerBackground()
    bg.play(request.station)
    send_response()
    return true
  else if request.action == 'pause'
    bg = new SomaPlayerBackground()
    bg.pause(request.station)
    send_response()
    return true
  else if request.action == 'info'
    bg = new SomaPlayerBackground()
    info = bg.get_info()
    console.debug 'info:', info
    send_response(info)
    return true

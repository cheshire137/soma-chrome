class SomaPlayerBackground
  constructor: (station, should_connect) ->
    @lastfm = SomaPlayerUtil.get_lastfm_connection()
    @station = station
    @audio = $('audio')
    @title_el = $('div#title')
    if @title_el.length < 1
      $('body').append($('<div id="title"></div>'))
      @title_el = $('div#title')
    @artist_el = $('div#artist')
    if @artist_el.length < 1
      $('body').append($('<div id="artist"></div>'))
      @artist_el = $('div#artist')
    if @station
      @playlist_url = "http://somafm.com/#{@station}.pls"
      # TODO: download playlist and read stream URL from it
      @stream_url = "http://ice.somafm.com/#{@station}"
      @socket = io.connect(SomaPlayerConfig.scrobbler_api_url)
      if should_connect
        @subscribe()
        @listen_for_track_changes()

  subscribe: ->
    @socket.on 'connect', =>
      console.debug 'subscribing to', @station, '...'
      @socket.emit 'subscribe', @station, (response) =>
        if response.subscribed
          console.debug 'subscribed to', @station
        else
          console.error 'failed to subscribe to', @station

  unsubscribe: ->
    console.debug 'unsubscribing from', @station, '...'
    @socket.emit 'unsubscribe', @station, (response) =>
      if response.unsubscribed
        console.debug 'unsubscribed from', @station
      else
        console.error 'failed to unsubscribe from', @station

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

  notify_of_track: (track, opts) ->
    # Default to showing notifications, so if user has not saved preferences,
    # assume they want notifications.
    return if opts.notifications == false
    notice = webkitNotifications.createNotification('icon48.png', track.title,
                                                    track.artist)
    notice.show()
    setTimeout (-> notice.cancel()), 3000

  listen_for_track_changes: ->
    @socket.on 'track', (track) =>
      console.debug 'new track:', track
      @title_el.text track.title
      @artist_el.text track.artist
      chrome.storage.sync.get 'somaplayer_options', (opts) =>
        opts = opts.somaplayer_options || {}
        @notify_of_track(track, opts)
        @scrobble_track(track, opts)

  play: ->
    console.debug 'playing station', @station
    $('body').append $("<audio src='#{@stream_url}' autoplay='true' data-station='#{@station}'></audio>")

  pause: ->
    console.debug 'pausing station', @station
    @unsubscribe()
    @audio.remove()
    @title_el.text ''
    @artist_el.text ''

  get_info: ->
    station: if @audio.length < 1 then '' else @audio.data('station')
    artist: @artist_el.text()
    title: @title_el.text()

SomaPlayerUtil.receive_message (request, sender, send_response) ->
  console.debug 'received message in background:', request
  if request.action == 'play'
    bg = new SomaPlayerBackground(request.station, true)
    bg.play()
    send_response()
    return true
  else if request.action == 'pause'
    bg = new SomaPlayerBackground(request.station, false)
    bg.pause()
    send_response()
    return true
  else if request.action == 'info'
    bg = new SomaPlayerBackground()
    info = bg.get_info()
    console.debug 'info:', info
    send_response(info)
    return true

class SomaPlayerBackground
  constructor: (station) ->
    @scrobbler_api_url = 'http://api.somascrobbler.com'
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
      @socket = io.connect(@scrobbler_api_url)
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

  listen_for_track_changes: ->
    @socket.on 'track', (track) =>
      console.debug 'new track:', track
      @title_el.text track.title
      @artist_el.text track.artist
      notice = webkitNotifications.createNotification('icon48.png', track.title,
                                                      track.artist)
      notice.show()
      setTimeout (-> notice.cancel()), 3000

  play: ->
    console.debug 'playing station', @station
    $('body').append $("<audio src='#{@stream_url}' autoplay='true' data-station='#{@station}'></audio>")

  pause: ->
    console.debug 'pausing station', @station
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
    bg = new SomaPlayerBackground(request.station)
    bg.play()
    send_response()
    return true
  else if request.action == 'pause'
    bg = new SomaPlayerBackground(request.station)
    bg.pause()
    send_response()
    return true
  else if request.action == 'info'
    bg = new SomaPlayerBackground()
    info = bg.get_info()
    console.debug 'info:', info
    send_response(info)
    return true

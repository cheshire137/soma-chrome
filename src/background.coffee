class SomaPlayerBackground
  constructor: (station) ->
    @station = station
    @playlist_url = "http://somafm.com/#{@station}.pls"
    # TODO: download playlist and read stream URL from it
    @stream_url = "http://ice.somafm.com/#{@station}"

  play: ->
    console.debug 'playing station', @station
    $('body').append $("<audio src='#{@stream_url}' autoplay='true' data-station='#{@station}'></audio>")

  pause: ->
    console.debug 'pausing station', @station
    $('audio').remove()

  @get_current_station: ->
    audio = $('audio')
    if audio.length < 1
      ''
    else
      audio.data('station')

SomaPlayerUtil.receive_message (request, sender, send_response) ->
  console.debug 'received message:', request
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
    station = SomaPlayerBackground.get_current_station()
    console.debug 'current station:', station
    send_response(station)
    return true

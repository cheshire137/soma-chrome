class SomaPlayerBackground
  constructor: (station) ->
    @station = station
    @playlist_url = "http://somafm.com/#{@station}.pls"
    # TODO: download playlist and read stream URL from it
    @stream_url = "http://ice.somafm.com/#{@station}"

  play: ->
    console.debug 'playing station', @station
    $('body').append $("<audio src='#{@stream_url}' autoplay='true'></audio>")

  pause: ->
    console.debug 'pausing station', @station
    $('audio').remove()

SomaPlayerUtil.receive_message (request, sender, send_response) ->
  console.debug 'received message:', request
  bg = new SomaPlayerBackground(request.station)
  if request.action == 'play'
    bg.play()
    send_response({})
    return true
  else if request.action == 'pause'
    bg.pause()
    send_response({})
    return true

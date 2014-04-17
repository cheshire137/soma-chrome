class SomaPlayerBackground
  constructor: (station) ->
    @station = station

  play: ->
    console.debug 'playing station', @station

  pause: ->
    console.debug 'pausing station', @station

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

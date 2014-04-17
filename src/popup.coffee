class SomaPlayerPopup
  constructor: ->
    console.debug 'popup opened'
    @station_select = $('#station')
    @play_button = $('#play')
    @pause_button = $('#pause')
    @station_select.change =>
      @station_changed()
    @play_button.click =>
      @play()
    @pause_button.click =>
      @pause()

  play: ->
    @station_select.attr('disabled', 'disabled')
    station = @station_select.val()
    console.debug 'play button clicked, station', station
    SomaPlayerUtil.send_message {action: 'play', station: station}, =>
      console.debug 'finishing telling station to play'
      @pause_button.removeClass('hidden')
      @play_button.addClass('hidden')

  pause: ->
    station = @station_select.val()
    console.debug 'pause button clicked, station', station
    SomaPlayerUtil.send_message {action: 'pause', station: station}, =>
      console.debug 'finished telling station to pause'
      @pause_button.addClass('hidden')
      @play_button.removeClass('hidden')
      @station_select.removeAttr('disabled')

  station_changed: ->
    station = @station_select.val()
    console.debug 'station changed to', station
    if station == ''
      @play_button.attr('disabled', 'disabled')
    else
      @play_button.removeAttr('disabled')

document.addEventListener 'DOMContentLoaded', ->
  new SomaPlayerPopup()

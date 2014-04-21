class SomaPlayerPopup
  constructor: ->
    console.debug 'popup opened'
    @station_select = $('#station')
    @play_button = $('#play')
    @pause_button = $('#pause')
    @current_info_el = $('#currently-playing')
    @title_el = $('span#title')
    @artist_el = $('span#artist')
    @station_select.change =>
      @station_changed()
    @play_button.click =>
      @play()
    @pause_button.click =>
      @pause()
    @station_select.keypress (e) =>
      if e.keyCode == 13 # Enter
        unless @play_button.is(':disabled') || @play_button.hasClass('hidden')
          console.debug 'pressing play button'
          @play_button.click()
        unless @pause_button.is(':disabled') || @pause_button.hasClass('hidden')
          console.debug 'pressing pause button'
          @pause_button.click()
    @load_current_info()
    @handle_links()

  load_current_info: ->
    @station_select.attr('disabled', 'disabled')
    SomaPlayerUtil.send_message {action: 'info'}, (info) =>
      console.debug 'finished info request, info', info
      @station_select.val(info.station)
      @station_select.removeAttr('disabled')
      @station_select.trigger('change')
      @station_is_playing() unless info.station == ''
      if info.artist || info.title
        @title_el.text info.title
        @artist_el.text info.artist
        @current_info_el.removeClass('hidden')

  station_is_playing: ->
    @pause_button.removeClass('hidden')
    @play_button.addClass('hidden')

  play: ->
    @station_select.attr('disabled', 'disabled')
    station = @station_select.val()
    console.debug 'play button clicked, station', station
    SomaPlayerUtil.send_message {action: 'play', station: station}, =>
      console.debug 'finishing telling station to play'
      @station_is_playing()

  pause: ->
    station = @station_select.val()
    console.debug 'pause button clicked, station', station
    SomaPlayerUtil.send_message {action: 'pause', station: station}, =>
      console.debug 'finished telling station to pause'
      @pause_button.addClass('hidden')
      @play_button.removeClass('hidden')
      @station_select.removeAttr('disabled')
      @current_info_el.addClass 'hidden'
      @title_el.text ''
      @artist_el.text ''

  station_changed: ->
    station = @station_select.val()
    console.debug 'station changed to', station
    if station == ''
      @play_button.attr('disabled', 'disabled')
    else
      @play_button.removeAttr('disabled')

  handle_links: ->
    $('a').click (e) ->
      e.preventDefault()
      link = $(this)
      if link.attr('href') == '#options'
        url = chrome.extension.getURL('options.html')
      else
        url = link.attr('href')
      chrome.tabs.create({url: url})
      false

document.addEventListener 'DOMContentLoaded', ->
  new SomaPlayerPopup()

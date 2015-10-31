class SomaPlayerPopup

  constructor: ->
    @base = this
    @station_list = @fetch_soma_channels
    @station_select = $('#station')
    @play_button = $('#play')
    @pause_button = $('#pause')
    @current_info_el = $('#currently-playing')
    @title_el = $('span#title')
    @artist_el = $('span#artist')
    @load_current_info()
    @handle_links()
    @station_select.change =>
      @station_changed()
    @play_button.click =>
      @fetch_soma_channels() #play
    @pause_button.click =>
      @pause()
    @station_select.keypress (e) =>
      if e.keyCode == 13 # Enter
        return if @station_select.val() == ''
        unless @play_button.is(':disabled') || @play_button.hasClass('hidden')
          console.debug 'pressing play button'
          @play_button.click()
        unless @pause_button.is(':disabled') || @pause_button.hasClass('hidden')
          console.debug 'pressing pause button'
          @pause_button.click()

  fetch_soma_channels: ->
    # Github Issue #5 fix by code-for-coffee
    # Fetching from the soma.fm channels JSON now that CORS is enabled
    console.log 'Fetching channels.json...'
    url = 'http://api.somafm.com/channels.json'
    on_success = (data) ->
      console.log 'Retrieved channels.json successfully!'
      console.log data.channels

      for station in data.channels
        console.log station
      # iterate through return object
      # for k, v of data
      #   @temp_accessor = ''
      #   console.log k
      #   console.log v
      #   consoe.log
      #   # now iteratethrough array of channels

        # #console.log data[station]
        # for item of station
        #   console.log station[item]

      # @station_option = $('option')
      # @station_option.prop 'value': station.id
      # console.log @station_option
        #append to @station_select.append('<option value="test">hi</option>')


    on_error = (jq_xhr, status, error) ->
      console.error 'failed to fetch Soma.fm channels', error
      alert 'failed to fetch Soma.fm channels'
    $.ajax
      dataType: 'json'
      url: url
      success: on_success
      error: on_error

  display_track_info: (info) ->
    if info.artist || info.title
      @title_el.text info.title
      @artist_el.text info.artist
      @current_info_el.removeClass('hidden')

  hide_track_info: ->
    @title_el.text ''
    @artist_el.text ''
    @current_info_el.addClass('hidden')

  load_current_info: ->
    @station_select.attr 'disabled', 'disabled'
    SomaPlayerUtil.send_message {action: 'info'}, (info) =>
      console.debug 'finished info request, info', info
      @station_select.val(info.station)
      @station_select.trigger('change')
      if info.is_paused
        @station_is_paused()
      else
        @station_is_playing()
      @display_track_info info

  station_is_playing: ->
    @pause_button.removeClass('hidden')
    @play_button.addClass('hidden')
    @station_select.attr 'disabled', 'disabled'
    @pause_button.focus()

  station_is_paused: ->
    @pause_button.addClass('hidden')
    @play_button.removeClass('hidden')
    @station_select.removeAttr 'disabled'
    @play_button.focus()

  play: ->
    @station_select.attr('disabled', 'disabled')
    station = @station_select.val()
    console.debug 'play button clicked, station', station
    SomaPlayerUtil.send_message {action: 'play', station: station}, =>
      console.debug 'finishing telling station to play'
      @station_is_playing()
      SomaPlayerUtil.send_message {action: 'info'}, (info) =>
        if info.artist != '' || info.title != ''
          @display_track_info info
        else
          SomaPlayerUtil.get_current_track_info station, (info) =>
            @display_track_info info

  pause: ->
    station = @station_select.val()
    console.debug 'pause button clicked, station', station
    SomaPlayerUtil.send_message {action: 'pause', station: station}, =>
      console.debug 'finished telling station to pause'
      @station_is_paused()
      @hide_track_info()
      @station_select.focus()

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

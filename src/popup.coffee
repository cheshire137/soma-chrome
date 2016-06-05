class SomaPlayerPopup
  constructor: ->
    @base = this
    @station_select = $('#station')
    @play_button = $('#play')
    @pause_button = $('#pause')
    @current_info_el = $('#currently-playing')
    @title_el = $('span#title')
    @artist_el = $('span#artist')
    @handle_links()
    @apply_theme()
    @fetch_soma_channels()
    @station_select.change =>
      @station_changed()
    @play_button.click =>
      @play()
    @pause_button.click =>
      @pause()
    @station_select.keypress (e) =>
      @on_station_keypress e.keyCode

  on_station_keypress: (keyCode) ->
    return unless keyCode == 13 # Enter
    return if @station_select.val() == ''
    unless @play_button.is(':disabled') || @play_button.hasClass('hidden')
      console.debug 'pressing play button'
      @play()
    unless @pause_button.is(':disabled') || @pause_button.hasClass('hidden')
      console.debug 'pressing pause button'
      @pause()

  insert_station_options: (stations) ->
    for station in stations
      @station_select.append('<option value="' + station.id + '">' +
                             station.title + '</option>')
    @station_select.prop 'disabled', false
    @load_current_info()

  load_default_stations: ->
    console.debug 'loading default station list'
    default_stations = [
      {id: 'bagel', title: 'BAGeL Radio'}
      {id: 'beatblender', title: 'Beat Blender'}
      {id: 'bootliquor', title: 'Boot Liquor'}
      {id: 'brfm', title: 'Black Rock FM'}
      {id: 'christmas', title: 'Christmas Lounge'}
      {id: 'xmasrocks', title: 'Christmas Rocks!'}
      {id: 'cliqhop', title: 'cliqhop idm'}
      {id: 'covers', title: 'Covers'}
      {id: 'events', title: 'DEF CON Radio'}
      {id: 'deepspaceone', title: 'Deep Space One'}
      {id: 'digitalis', title: 'Digitalis'}
      {id: 'doomed', title: 'Doomed'}
      {id: 'dronezone', title: 'Drone Zone'}
      {id: 'dubstep', title: 'Dub Step Beyond'}
      {id: 'earwaves', title: 'Earwaves'}
      {id: 'folkfwd', title: 'Folk Forward'}
      {id: 'groovesalad', title: 'Groove Salad'}
      {id: 'illstreet', title: 'Illinois Street Lounge'}
      {id: 'indiepop', title: 'Indie Pop Rocks!'}
      {id: 'jollysoul', title: "Jolly Ol' Soul"}
      {id: 'lush', title: 'Lush'}
      {id: 'missioncontrol', title: 'Mission Control'}
      {id: 'poptron', title: 'PopTron'}
      {id: 'secretagent', title: 'Secret Agent'}
      {id: '7soul', title: 'Seven Inch Soul'}
      {id: 'sf1033', title: 'SF 10-33'}
      {id: 'live', title: 'SomaFM Live'}
      {id: 'sonicuniverse', title: 'Sonic Universe'}
      {id: 'sxfm', title: 'South by Soma'}
      {id: 'spacestation', title: 'Space Station Soma'}
      {id: 'suburbsofgoa', title: 'Suburbs of Goa'}
      {id: 'thetrip', title: 'The Trip'}
      {id: 'thistle', title: 'ThistleRadio'}
      {id: 'u80s', title: 'Underground 80s'}
      {id: 'xmasinfrisko', title: 'Xmas in Frisko'}
    ]
    @insert_station_options default_stations

  fetch_soma_channels: ->
    SomaPlayerUtil.send_message {action: 'get_stations'}, (cached_list) =>
      console.log 'stations already stored', cached_list
      if cached_list == null || cached_list.length < 1
        msg = {action: 'fetch_stations'}
        SomaPlayerUtil.send_message msg, (stations, error) =>
          if error
            @load_default_stations()
          else
            @insert_station_options stations
      else
        @insert_station_options cached_list

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
    @station_select.prop 'disabled', true
    SomaPlayerUtil.send_message {action: 'info'}, (info) =>
      console.debug 'finished info request, info', info
      @station_select.val(info.station)
      @station_select.trigger('change')
      if info.is_paused
        @station_is_paused()
      else
        @station_is_playing()
      @station_select.prop 'disabled', false
      @display_track_info info

  station_is_playing: ->
    @pause_button.removeClass('hidden')
    @play_button.addClass('hidden')
    @station_select.focus()

  station_is_paused: ->
    @pause_button.addClass('hidden')
    @play_button.removeClass('hidden').prop 'disabled', false
    @station_select.focus()

  play: ->
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

  pause: (callback) ->
    station = @station_select.val()
    console.debug 'pause button clicked, station', station
    SomaPlayerUtil.send_message {action: 'pause', station: station}, =>
      console.debug 'finished telling station to pause'
      @station_is_paused()
      @station_select.focus()
      if typeof callback == 'function'
        callback()

  station_changed: ->
    new_station = @station_select.val()
    if new_station == ''
      SomaPlayerUtil.send_message {action: 'clear'}, =>
        console.debug 'station cleared'
        @play_button.prop 'disabled', true
        @hide_track_info()
        @pause()
    else
      SomaPlayerUtil.send_message {action: 'info'}, (info) =>
        current_station = info.station
        if new_station != '' && new_station != current_station
          console.debug 'station changed to ' + new_station
          @play_button.prop 'disabled', false
          @pause =>
            @play()

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

  apply_theme: ->
    SomaPlayerUtil.get_options (opts) ->
      theme = opts.theme || 'light'
      document.body.classList.add 'theme-' + theme

document.addEventListener 'DOMContentLoaded', ->
  new SomaPlayerPopup()

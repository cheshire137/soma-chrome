class SomaPlayerPopup

  constructor: ->
    @base = this
    @station_select = $('#station')
    @play_button = $('#play')
    @pause_button = $('#pause')
    @current_info_el = $('#currently-playing')
    @title_el = $('span#title')
    @artist_el = $('span#artist')
    @load_current_info()
    @handle_links()
    @fetch_soma_channels()
    @station_select.change =>
      @station_changed()
    @play_button.click =>
      @play()
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

  insert_station_options: (channels) ->
    for station in channels
      @station_select.append('<option value="' + station.id + '">' +
                             station.title + '</option>')

  on_channels_fetched: (data) ->
    console.log 'stations', data
    @insert_station_options data.channels

  on_channel_fetch_error: (jq_xhr, status, error) ->
    console.error 'failed to fetch Soma.fm channels', error
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
    url = 'http://api.somafm.com/channels.json'
    console.debug 'Fetching channels list from ' + url
    $.getJSON(url).done(@on_channels_fetched.bind(@)).
                   fail(@on_channel_fetch_error.bind(@))

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

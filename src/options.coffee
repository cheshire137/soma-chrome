class SomaPlayerOptions
  constructor: ->
    @status_area = $('#status-message')
    @lastfm_button = $('button.lastfm-auth')
    @disable_scrobbling = $('#disable_scrobbling')
    @enable_scrobbling = $('#enable_scrobbling')
    @disable_notifications = $('#disable_notifications')
    @enable_notifications = $('#enable_notifications')
    @light_theme = $('#light_theme')
    @dark_theme = $('#dark_theme')
    @lastfm_connected_message = $('#lastfm-is-authenticated')
    @lastfm_not_connected_message = $('#lastfm-is-not-authenticated')
    @lastfm_user = $('#lastfm-user')
    @lastfm_disconnect = $('#lastfm-disconnect')
    @stations_divider = $('.stations-divider')
    @stations_options = $('.stations-options')
    @station_count = $('.station-count')
    @stations_list = $('.stations-list')
    @refresh_stations_button = $('button.refresh-stations')
    @lastfm_token = SomaPlayerUtil.get_url_param('token')
    @options = {scrobbling: false, notifications: true}
    @lastfm_button.click =>
      @init_authenticate_lastfm()
    @lastfm_disconnect.click (event) =>
      event.preventDefault()
      @disconnect_from_lastfm()
    radio_selector = 'input[name="scrobbling"], input[name="notifications"], ' +
                     'input[name="theme"]'
    $(radio_selector).change =>
      @save_options()
    @refresh_stations_button.click =>
      @refresh_stations()
    @restore_options()
    @authenticate_lastfm()

  restore_options: ->
    SomaPlayerUtil.get_options (opts) =>
      if opts.lastfm_session_key
        @lastfm_connected_message.removeClass 'hidden'
        @enable_scrobbling.removeAttr 'disabled'
      else
        @lastfm_not_connected_message.removeClass 'hidden'
      if opts.lastfm_user
        @lastfm_user.text opts.lastfm_user
        @lastfm_user.attr 'href', "http://last.fm/user/#{opts.lastfm_user}"
      if opts.scrobbling
        @enable_scrobbling.attr 'checked', 'checked'
      if opts.notifications == false
        @disable_notifications.attr 'checked', 'checked'
      if opts.stations != null && opts.stations.length > 0
        @show_cached_stations opts.stations
      if opts.theme == 'dark'
        @dark_theme.attr 'checked', 'checked'
      for key, value of opts
        @options[key] = value
      $('.controls.hidden').removeClass 'hidden'
      console.debug 'SomaPlayer options:', @options
      @lastfm_button.removeClass 'hidden'
      @apply_theme()

  apply_theme: ->
    document.body.classList.add "theme-" + @options.theme

  show_cached_stations: (stations) ->
    @stations_divider.show()
    @stations_options.show()
    @station_count.text stations.length
    titles = (s.title for s in stations)
    titles.sort()
    text_list = titles.slice(0, titles.length - 1).join(', ')
    text_list += ', and ' + titles[titles.length - 1] + '.'
    @stations_list.text text_list

  refresh_stations: ->
    console.debug 'refreshing stations list'
    @stations_list.text ''
    @refresh_stations_button.prop 'disabled', true
    msg = {action: 'fetch_stations'}
    SomaPlayerUtil.send_message msg, (stations, error) =>
      if error
        @stations_list.text 'Could not fetch station list. :('
      else
        @show_cached_stations stations
      @options.stations = stations
      @refresh_stations_button.prop 'disabled', false

  disconnect_from_lastfm: ->
    console.debug 'disconnecting from Last.fm...'
    @options.lastfm_session_key = null
    @options.lastfm_user = null
    @options.scrobbling = false
    SomaPlayerUtil.set_options @options, =>
      @status_area.text('Disconnected from Last.fm!').fadeIn =>
        setTimeout (=> @status_area.fadeOut()), 2000
      @lastfm_user.text ''
      @lastfm_connected_message.addClass 'hidden'
      @lastfm_not_connected_message.removeClass 'hidden'
      @enable_scrobbling.attr 'disabled', 'disabled'
      @enable_scrobbling.removeAttr 'checked'
      @disable_scrobbling.attr 'checked', 'checked'

  save_options: ->
    checked_scrobbling = $('input[name="scrobbling"]:checked')
    @options.scrobbling = checked_scrobbling.val() == 'enabled'
    checked_notifications = $('input[name="notifications"]:checked')
    @options.notifications = checked_notifications.val() == 'enabled'
    checked_theme = $('input[name="theme"]:checked')
    @options.theme = checked_theme.val()
    SomaPlayerUtil.set_options @options, =>
      @status_area.text('Saved your options!').fadeIn =>
        window.scrollTo 0, 0
        setTimeout (=> @status_area.fadeOut()), 2000

  init_authenticate_lastfm: ->
    window.location.href = 'http://www.last.fm/api/auth/' +
                           '?api_key=' + SomaPlayerConfig.lastfm_api_key +
                           '&cb=' + window.location.href

  authenticate_lastfm: ->
    return if @lastfm_token == ''
    console.debug 'authenticating with Last.fm token...'
    lastfm = SomaPlayerUtil.get_lastfm_connection()
    lastfm.auth.getSession {token: @lastfm_token},
      success: (data) =>
        @options.lastfm_session_key = data.session.key
        @options.lastfm_user = data.session.name
        @options.scrobbling = true
        SomaPlayerUtil.set_options @options, =>
          @status_area.text('Connected to Last.fm!').fadeIn =>
            setTimeout (=> @status_area.fadeOut()), 2000
          @lastfm_user.text @options.lastfm_user
          @lastfm_connected_message.removeClass 'hidden'
          @lastfm_not_connected_message.addClass 'hidden'
          @enable_scrobbling.removeAttr 'disabled'
          @enable_scrobbling.attr 'checked', 'checked'
      error: (data) =>
        console.error 'Last.fm error:', data.error, ',', data.message
        delete @options['lastfm_session_key']
        delete @options['lastfm_user']
        SomaPlayerUtil.set_options @options, =>
          @status_area.text('Error authenticating with Last.fm.').fadeIn =>
            setTimeout (=> @status_area.fadeOut()), 2000

$ ->
  new SomaPlayerOptions()

class SomaPlayerOptions
  constructor: ->
    @status_area = $('#status-message')
    @lastfm_button = $('button#lastfm-auth')
    @disable_scrobbling = $('#disable_scrobbling')
    @enable_scrobbling = $('#enable_scrobbling')
    @disable_notifications = $('#disable_notifications')
    @enable_notifications = $('#enable_notifications')
    @lastfm_connected_message = $('#lastfm-is-authenticated')
    @lastfm_user = $('#lastfm-user')
    @lastfm_token = SomaPlayerUtil.get_url_param('token')
    @options = {scrobbling: false, notifications: true}
    @lastfm_button.click =>
      @init_authenticate_lastfm()
    $('input[name="scrobbling"]').change =>
      @save_options()
    $('input[name="notifications"]').change =>
      @save_options()
    @restore_options()
    @authenticate_lastfm()

  restore_options: ->
    SomaPlayerUtil.get_options (opts) =>
      if opts.lastfm_session_key
        @lastfm_connected_message.removeClass 'hidden'
        @enable_scrobbling.removeAttr 'disabled'
      if opts.lastfm_user
        @lastfm_user.text opts.lastfm_user
      if opts.scrobbling
        @enable_scrobbling.attr 'checked', 'checked'
      if opts.notifications == false
        @disable_notifications.attr 'checked', 'checked'
      for key, value of opts
        @options[key] = value
      $('.controls.hidden').removeClass 'hidden'
      console.debug 'SomaPlayer options:', @options
      @lastfm_button.removeClass 'hidden'

  save_options: ->
    @options.scrobbling = $('input[name="scrobbling"]:checked').val() == 'enabled'
    @options.notifications = $('input[name="notifications"]:checked').val() == 'enabled'
    SomaPlayerUtil.set_options @options, =>
      @status_area.text('Saved your options!').fadeIn =>
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
        SomaPlayerUtil.set_options @options, =>
          @status_area.text('Connected to Last.fm!').fadeIn =>
            setTimeout (=> @status_area.fadeOut()), 2000
          @lastfm_user.text @options.lastfm_user
          @lastfm_connected_message.removeClass 'hidden'
          @enable_scrobbling.removeAttr 'disabled'
      error: (data) =>
        console.error 'Last.fm error:', data.error, ',', data.message
        delete @options['lastfm_session_key']
        delete @options['lastfm_user']
        SomaPlayerUtil.set_options @options, =>
          @status_area.text('Error authenticating with Last.fm.').fadeIn =>
            setTimeout (=> @status_area.fadeOut()), 2000

$ ->
  new SomaPlayerOptions()

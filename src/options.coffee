class SomaPlayerOptions
  constructor: ->
    @config = SomaPlayerUtil.config()
    @status_area = $('#status-message')
    @lastfm_button = $('button#lastfm-auth')
    @disable_scrobbling = $('#disable_scrobbling')
    @enable_scrobbling = $('#enable_scrobbling')
    @lastfm_connected_message = $('#lastfm-is-authenticated')
    @lastfm_user = $('#lastfm-user')
    @lastfm_token = SomaPlayerUtil.get_url_param('token')
    @options = {scrobbling: false}
    console.debug 'Last.fm token:', @lastfm_token
    @lastfm_button.click =>
      @init_authenticate_lastfm()
    $('input[name="scrobbling"]').change =>
      @save_options()
    @restore_options()
    @authenticate_lastfm()

  restore_options: ->
    chrome.storage.sync.get 'somaplayer_options', (opts) =>
      opts = opts.somaplayer_options || {}
      if opts.lastfm_session_key
        @lastfm_connected_message.removeClass 'hidden'
        @enable_scrobbling.removeAttr 'disabled'
        @options.lastfm_session_key = opts.lastfm_session_key
      if opts.lastfm_user
        @lastfm_user.text opts.lastfm_user
        @options.lastfm_user = opts.lastfm_user
      if opts.scrobbling
        @enable_scrobbling.attr 'checked', 'checked'
        @options.scrobbling = true
      for key, value of opts
        @options[key] = value
      console.log 'SomaPlayer options:', @options
      @lastfm_button.removeClass 'hidden'

  save_options: ->
    @options.scrobbling = $('input[name="scrobbling"]:checked').val() == 'enabled'
    chrome.storage.sync.set {'somaplayer_options': @options}, =>
      @status_area.text('Saved your options!').fadeIn =>
        setTimeout (=> @status_area.fadeOut()), 2000

  init_authenticate_lastfm: ->
    window.location.href = 'http://www.last.fm/api/auth/' +
                           '?api_key=' + @config.lastfm_api_key +
                           '&cb=' + window.location.href

  authenticate_lastfm: ->
    return if @lastfm_token == ''
    console.debug 'authenticating with Last.fm token...'
    lastfm = SomaPlayerUtil.get_lastfm_connection()
    lastfm.auth.getSession {token: @lastfm_token},
      success: (data) =>
        @options.lastfm_session_key = data.session.key
        @options.lastfm_user = data.session.name
        chrome.storage.sync.set {'somaplayer_options': @options}, =>
          @status_area.text('Connected to Last.fm!').fadeIn =>
            setTimeout (=> @status_area.fadeOut()), 2000
          @lastfm_user.text @options.lastfm_user
          @lastfm_connected_message.removeClass 'hidden'
          @enable_scrobbling.removeAttr 'disabled'
      error: (data) =>
        console.error 'Last.fm error:', data.error, ',', data.message
        delete @options['lastfm_session_key']
        delete @options['lastfm_user']
        chrome.storage.sync.set {'somaplayer_options': @options}, =>
          @status_area.text('Error authenticating with Last.fm.').fadeIn =>
            setTimeout (=> @status_area.fadeOut()), 2000

$ ->
  new SomaPlayerOptions()

class SomaPlayerOptions
  constructor: ->
    @status_area = $('#status-message')
    @lastfm_button = $('button#lastfm-auth')
    @lastfm_connected_message = $('#lastfm-is-authenticated')
    @lastfm_user = $('#lastfm-user')
    @lastfm_api_key = 'cbf33bb9eef14a25b0e08cd47530706c'
    @lastfm_api_secret = '797d623a73501d358f6ca0e5f8fd3cf0'
    @lastfm_token = SomaPlayerUtil.get_url_param('token')
    @options = {}
    console.debug 'Last.fm token:', @lastfm_token
    @lastfm_button.click =>
      @init_authenticate_lastfm()
    @restore_options()
    @authenticate_lastfm()

  restore_options: ->
    chrome.storage.sync.get 'somaplayer_options', (opts) =>
      opts = opts.somaplayer_options || {}
      if opts.lastfm_session_key
        @lastfm_connected_message.removeClass 'hidden'
      if opts.lastfm_user
        @lastfm_user.text opts.lastfm_user
      for key, value of opts
        @options[key] = value
      console.log 'SomaPlayer options:', @options
      @lastfm_button.removeClass 'hidden'

  init_authenticate_lastfm: ->
    window.location.href = 'http://www.last.fm/api/auth/' +
                           '?api_key=' + @lastfm_api_key +
                           '&cb=' + window.location.href

  authenticate_lastfm: ->
    return if @lastfm_token == ''
    console.debug 'authenticating with Last.fm token...'
    lastfm = new LastFM
      apiKey: @lastfm_api_key
      apiSecret: @lastfm_api_secret
      apiUrl: 'https://ws.audioscrobbler.com/2.0/'
      cache: new LastFMCache()
    lastfm.auth.getSession {token: @lastfm_token},
      success: (data) =>
        @options.lastfm_session_key = data.session.key
        @options.lastfm_user = data.session.name
        chrome.storage.sync.set {'somaplayer_options': @options}, =>
          @status_area.text('Connected to Last.fm!').fadeIn =>
            setTimeout (=> @status_area.fadeOut()), 2000
          @lastfm_user.text @options.lastfm_user
          @lastfm_connected_message.removeClass 'hidden'
      error: (data) =>
        console.error 'Last.fm error:', data.error, ',', data.message
        delete @options['lastfm_session_key']
        delete @options['lastfm_user']
        chrome.storage.sync.set {'somaplayer_options': @options}, =>
          @status_area.text('Error authenticating with Last.fm.').fadeIn =>
            setTimeout (=> @status_area.fadeOut()), 2000

$ ->
  new SomaPlayerOptions()

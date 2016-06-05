# SomaPlayer for Chrome

SomaPlayer is a Chrome extension for playing and scrobbling stations from [SomaFM](http://somafm.com).

**[Install from the Chrome Web Store](https://chrome.google.com/webstore/detail/somaplayer/dpcghdgbhjkihgnnbojldhjmcbieofgo?hl=en&gl=US&authuser=1)**

See the [change log](CHANGELOG.md). You might also be interested in my [desktop app](https://github.com/cheshire137/huxleyfm) for OS X, Windows, and Linux.

## Screenshots

The popup using the dark theme:

![Screenshot 1 - the popup dark](https://raw.githubusercontent.com/cheshire137/soma-chrome/master/screenshot.png)

The popup using the light theme with a song playing:

![Screenshot 4 - the popup light](https://raw.githubusercontent.com/cheshire137/soma-chrome/master/screenshot4.png)

The options page using the dark theme:

![Screenshot 2 - the options page](https://raw.githubusercontent.com/cheshire137/soma-chrome/master/screenshot2.png)

A song notification:

![Screenshot 3 - a song notification](https://raw.githubusercontent.com/cheshire137/soma-chrome/master/screenshot3.png)

## How to Develop

Pull requests welcome!

1. `npm install` to install necessary packages and get a config.js to customize.
1. Customize extension/config.js by filling in [your Last.fm API key and secret](http://www.last.fm/api/accounts).
1. In Chrome at `chrome://extensions/`, click 'Load unpacked extension...' and choose the extension/ directory.

## How to Check Code Style

    npm install
    npm test

## Thanks

- [SomaFM](http://somafm.com/) - where all the music comes from!
- [SomaScrobbler API](http://api.somascrobbler.com/) - for information about current tracks, used for knowing what to scrobble to Last.fm.
- [Last.fm Web Services](http://www.last.fm/api)
- [example-lastfm-api](https://github.com/soundsuggest/example-lastfm-api)

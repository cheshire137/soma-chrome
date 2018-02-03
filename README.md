# SomaPlayer for Chrome

[![Build status](https://travis-ci.org/cheshire137/soma-chrome.svg?branch=master)](https://travis-ci.org/cheshire137/soma-chrome)

SomaPlayer is a Chrome extension for playing stations from [SomaFM](http://somafm.com).

**[Install from the Chrome Web Store](https://chrome.google.com/webstore/detail/somaplayer/dpcghdgbhjkihgnnbojldhjmcbieofgo?hl=en&gl=US&authuser=1)**

See the [change log](CHANGELOG.md). You might also be interested in my [desktop app](https://github.com/cheshire137/huxleyfm) for macOS, Windows, and Linux.

## Screenshots

The popup using the dark theme with a song playing:

![Screenshot - the popup dark](https://raw.githubusercontent.com/cheshire137/soma-chrome/master/screenshots/popup-dark.png)

The popup using the light theme with a song playing:

![Screenshot - the popup light](https://raw.githubusercontent.com/cheshire137/soma-chrome/master/screenshots/popup-light.png)

The options page using the light theme:

![Screenshot - the options page](https://raw.githubusercontent.com/cheshire137/soma-chrome/master/screenshots/options-light.png)

A song notification:

![Screenshot - a song notification](https://raw.githubusercontent.com/cheshire137/soma-chrome/master/screenshots/notification.png)

## How to Develop

Pull requests welcome!

1. `npm install` to install necessary packages and get a config.js to customize.
1. In Chrome at `chrome://extensions/`, click 'Load unpacked extension...' and choose the extension/ directory.

## How to Check Code Style

    npm install
    npm test

## Thanks

- [SomaFM](http://somafm.com/) - where all the music comes from!
- [SomaScrobbler API](http://api.somascrobbler.com/) - for information about current tracks, used for knowing what to scrobble to Last.fm.
- [Google Material Icons](https://design.google.com/icons/) - for pause and play icons.

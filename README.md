# SomaPlayer for Chrome

SomaPlayer is a Chrome extension for playing and scrobbling stations from [SomaFM](http://somafm.com).

**This is a work in progress, the extension isn't available in the Chrome Store yet.**

![Screenshot of extension popup](http://github.com/moneypenny/soma-chrome/raw/master/screenshot.png)

## How to Build

1. `npm install -g gulp` to globally install Gulp
1. `npm install` to install necessary Gulp modules
1. `bundle` to install necessary gems
1. `gulp` to watch CoffeeScript, LESS, and Haml files for changes
1. `cp extension/config.js.example extension/config.js`
1. Customize extension/config.js by filling in [your Last.fm API key and secret](http://www.last.fm/api/accounts).
1. In Chrome at `chrome://extensions/`, click 'Load unpacked extension...' and choose the extension directory.

## To Do

1. Add 'donate to SomaFM' link.
1. Add link to Options page from popup.
1. Scrobble to Last.fm
1. Add option to disable notifications of new tracks.
1. Some magic to get Mac media keys to work?

## Thanks

- [SomaFM](http://somafm.com/)
- [SomaScrobbler API](http://api.somascrobbler.com/)
- [Last.fm Web Services](http://www.last.fm/api)
- [example-lastfm-api](https://github.com/soundsuggest/example-lastfm-api)

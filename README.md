# SomaPlayer for Chrome

SomaPlayer is a Chrome extension for playing and scrobbling stations from [SomaFM](http://somafm.com).

**[Install from the Chrome Web Store](https://chrome.google.com/webstore/detail/somaplayer/dpcghdgbhjkihgnnbojldhjmcbieofgo?hl=en&gl=US&authuser=1)**

*Pop-up:*

![Screenshot of extension popup](http://github.com/moneypenny/soma-chrome/raw/master/screenshot.png)

*Options page:*

![Screenshot of extension options page](http://github.com/moneypenny/soma-chrome/raw/master/screenshot2.png)

*Desktop notification of track:*

![Screenshot of extension track notification](http://github.com/moneypenny/soma-chrome/raw/master/screenshot3.png)

## How to Build

Pull requests welcome! If you're making a change to the JavaScript, HTML, or CSS, you want to edit the CoffeeScript, Haml, and LESS files in src/, because the stuff in extension/ is generated.

1. `npm install -g gulp` to globally install Gulp
1. `npm install` to install necessary Gulp modules
1. `bundle` to install necessary gems
1. `gulp` to watch CoffeeScript, LESS, and Haml files for changes
1. `cp config.js.example extension/config.js`
1. Customize extension/config.js by filling in [your Last.fm API key and secret](http://www.last.fm/api/accounts).
1. In Chrome at `chrome://extensions/`, click 'Load unpacked extension...' and choose the extension directory.

## To Do

1. Some magic to get Mac media keys to work?
1. New icon.
1. Remove unused plugins from gulpfile.js.
1. Tests!

## Thanks

- [SomaFM](http://somafm.com/)
- [SomaScrobbler API](http://api.somascrobbler.com/)
- [Last.fm Web Services](http://www.last.fm/api)
- [example-lastfm-api](https://github.com/soundsuggest/example-lastfm-api)

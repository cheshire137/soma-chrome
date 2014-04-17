class SomaPlayerPopup
  constructor: ->
    console.debug 'popup opened'

document.addEventListener 'DOMContentLoaded', ->
  new SomaPlayerPopup()

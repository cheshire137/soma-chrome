class SomaAPI {
  constructor() {
    this.baseUrl = SomaPlayerConfig.somafm_api_url
  }

  getStations() {
    const url = `${this.baseUrl}/channels.json`
    console.debug(`fetching station list from ${url}`)

    return new Promise((resolve, reject) => {
      SomaPlayerUtil.getJSON(url).then(data => {
        console.debug('fetched stations list', data)
        const stations = data.channels.map(station => {
          return { id: station.id, title: station.title }
        })
        stations.sort((a, b) => {
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase())
        })
        resolve(stations)

      }).catch(error => {
        console.error('failed to fetch stations list', error)
        reject(error)
      })
    })
  }

  getStationTracks(station) {
    const url = `${this.baseUrl}/songs/${station}.json`

    return new Promise((resolve, reject) => {
      window.fetch(url).then(response => {
        response.json().then(json => {
          const tracks = json.songs.map(song => {
            if (typeof song.date === 'string') {
              song.date = new Date(parseInt(song.date, 10) * 1000)
            }

            return song
          })

          tracks.sort((a, b) => {
            if (a.date && b.date) {
              if (a.date < b.date) {
                return 1
              }

              return a.date > b.date ? -1 : 0
            }

            return a.title.toLowerCase().localeCompare(b.title.toLowerCase())
          })

          resolve(tracks)
        })
      }).catch(reject)
    })
  }
}

window.SomaAPI = SomaAPI

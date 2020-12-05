const { DeckGL, ScatterplotLayer } = deck

const fetchData = async () => {
  const xhr = await fetch('/api/movebank/wildebeest/')
  const arr = await xhr.json()

  let minLng, minLat, maxLng, maxLat

  for (let i = 0; i < arr.length; i++) {
    const row = arr[i]
    minLng = minLng ? Math.min(minLng, row.location_long) : row.location_long
    maxLng = maxLng ? Math.max(maxLng, row.location_long) : row.location_long
    minLat = minLat ? Math.min(minLat, row.location_lat) : row.location_lat
    maxLat = maxLat ? Math.max(maxLat, row.location_lat) : row.location_lat
  }

  const longitude = (minLng + maxLng) / 2
  const latitude = (minLat + maxLat) / 2

  new DeckGL({
    container: 'map',
    mapStyle: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    initialViewState: {
      longitude,
      latitude,
      zoom: 8,
      maxZoom: 16,
    },
    controller: true,
    layers: [
      new ScatterplotLayer({
        id: 'scatter-plot',
        data: arr,
        pickable: true,
        radiusScale: 10,
        radiusMinPixels: 2,
        getPosition: (d) => [d.location_long, d.location_lat, 0],
        getFillColor: [255, 0, 255],
      }),
    ],
    getTooltip: ({ object }) =>
      object && {
        html: `<b>${object.individual_local_identifier}</b><br/>${object.timestamp}`,
        style: {
          fontFamily: 'Arial, Helvetica, sans-serif',
        },
      },
  })
}

const fetchArrowData = async () => {
  const xhr = await fetch('/api/movebank/wildebeest/arrow', {
    responseType: 'arraybuffer',
  })
  const buf = await xhr.arrayBuffer()
  const table = Arrow.Table.from(buf)
  const lngs = table.getColumn('location_long').toArray()
  const lats = table.getColumn('location_lat').toArray()

  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)

  const longitude = (minLng + maxLng) / 2
  const latitude = (minLat + maxLat) / 2

  new DeckGL({
    container: 'map',
    mapStyle: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    initialViewState: {
      longitude,
      latitude,
      zoom: 8,
      maxZoom: 16,
    },
    controller: true,
    layers: [
      new ScatterplotLayer({
        id: 'scatter-plot',
        data: {
          length: table.count(),
        },
        pickable: true,
        radiusScale: 10,
        radiusMinPixels: 2,
        getPosition: (d, i) => [lngs[i.index], lats[i.index], 0],
        getFillColor: [255, 0, 255],
      }),
    ],
    getTooltip: ({ index }) => {
      if (index < 0) return
      const name = table.getColumn('individual_local_identifier').get(index)
      const ts = table.getColumn('timestamp').get(index)
      return (
        (
        index > -1 && {
            html: `<b>${name}</b><br/>${new Date(ts).toISOString()}`,
            style: {
              fontFamily: 'Arial, Helvetica, sans-serif',
            },
          }
      )
      )
    },
  })
}

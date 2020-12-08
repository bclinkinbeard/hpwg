const { DeckGL, ScatterplotLayer } = deck
const dataset = 'movebank'

function init() {
  fetchData()
}

function columnStats(column) {
  let max = column.get(0)
  let min = max
  for (let value of column) {
    if (value === null) continue
    if (value > max) {
      max = value
    } else if (value < min) {
      min = value
    }
  }
  return { min, max, range: max - min }
}

const fetchDatasetTables = async (dataset) => {
  const xhr = await fetch(`/api/dataset/${dataset}/`, {
    responseType: 'arraybuffer',
  })
  const buf = await xhr.arrayBuffer()
  const table = Arrow.Table.from(buf)
  console.log(table.getColumn('table_name').toArray());
}

const fetchData = async () => {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('map').textContent = ''
  const animal = document.getElementById('animal').value
  const useArrow = document.getElementById('useArrow').checked
  const limit = document.getElementById('limit').value
  if (useArrow) {
    fetchArrowData(animal, limit)
  } else {
    fetchJsonData(animal, limit)
  }
}

const fetchJsonData = async (animal, limit) => {
  const xhr = await fetch(`/api/movebank/${animal}/json/${+limit}/`)
  const arr = await xhr.json()
  document.getElementById('loading').style.display = 'none';

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

const fetchArrowData = async (animal, limit) => {
  const xhr = await fetch(`/api/movebank/${animal}/arrow/${+limit}/`, {
    responseType: 'arraybuffer',
  })
  const buf = await xhr.arrayBuffer()
  document.getElementById('loading').style.display = 'none'
  const table = Arrow.Table.from(buf)
  const lngs = table.getColumn('location_long')
  const lats = table.getColumn('location_lat')
  const lngStats = columnStats(table.getColumn('location_long'))
  const latStats = columnStats(table.getColumn('location_lat'))
  const timeStats = columnStats(table.getColumn('timestamp'))
  console.log(
    new Date(timeStats.min).toISOString(),
    '-',
    new Date(timeStats.max).toISOString(),
  )

  const longitude = (lngStats.min + lngStats.max) / 2
  const latitude = (latStats.min + latStats.max) / 2

  new DeckGL({
    container: 'map',
    mapStyle: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    initialViewState: {
      longitude,
      latitude,
      zoom: 15,
      maxZoom: 20,
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
        getPosition: (d, i) => [lngs.get(i.index), lats.get(i.index), 0],
        getFillColor: [255, 40, 255],
      }),
    ],
    getTooltip: ({ index }) => {
      if (index < 0) return
      const name = table.getColumn('individual_local_identifier').get(index)
      const ts = table.getColumn('timestamp').get(index)
      return (
        index > -1 && {
          html: `<b>${name}</b><br/>${new Date(ts).toISOString()}`,
          style: {
            fontFamily: 'Arial, Helvetica, sans-serif',
          },
        }
      )
    },
  })
}

init()

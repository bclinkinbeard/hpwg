// import * as deck from '@deck.gl/core';
// import * as layers from '@deck.gl/layers';
// const { Deck } = deck
// const {ScatterplotLayer} = layers
const { DeckGL, ScatterplotLayer } = (window as any).deck
import * as Arrow from 'apache-arrow'
import { $, columnStats } from './helpers'
import { initTimeScrubber } from './time-scrubber'

// shortcuts to DOM elements
const dom = {
  animalSelect: $<HTMLSelectElement>('#animal'),
  fetchBtn: $<HTMLButtonElement>('#fetchBtn'),
  limitSelect: $<HTMLSelectElement>('#limit'),
  loading: $('#loading'),
  map: $('#map'),
}

// set the initial DOM values
const initDOM = () => {
  dom.animalSelect.value = 'wildebeest'
  dom.limitSelect.value = '5e3'
  dom.fetchBtn.onclick = updateMap
}

const fetchData = async (animal: string, limit: number) => {
  dom.loading.style.display = 'block'
  dom.map.textContent = ''

  const xhr = await fetch(`/api/movebank/${animal}/arrow/${+limit}/`)
  const buf = await xhr.arrayBuffer()

  dom.loading.style.display = 'none'

  return buf
}

const updateMap = async () => {
  const buf = await fetchData(dom.animalSelect.value!, +dom.limitSelect.value!)
  const table = Arrow.Table.from(buf)
  const lngs = table.getColumn('location_long')
  const lats = table.getColumn('location_lat')
  const lngStats = columnStats(table.getColumn('location_long'))
  const latStats = columnStats(table.getColumn('location_lat'))
  const timeStats = columnStats(table.getColumn('timestamp'))
  initTimeScrubber('#scrubber', timeStats.min, timeStats.max)

  const longitude = (lngStats.min + lngStats.max) / 2
  const latitude = (latStats.min + latStats.max) / 2

  new DeckGL({
    container: 'map',
    mapStyle: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    initialViewState: {
      longitude,
      latitude,
      zoom: 8,
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
        getPosition: (d: unknown, i: { index: number }) => {
          return [lngs.get(i.index), lats.get(i.index), 0]
        },
        getFillColor: [255, 40, 255],
      }),
    ],
    getTooltip: (data: { index: number }) => {
      if (data.index < 0) return
      const name = table
        .getColumn('individual_local_identifier')
        .get(data.index)
      const ts = table.getColumn('timestamp').get(data.index)
      return (
        data.index > -1 && {
          html: `<b>${name}</b><br/>${new Date(ts).toISOString()}`,
          style: {
            fontFamily: 'Arial, Helvetica, sans-serif',
          },
        }
      )
    },
  })
}

initDOM()
updateMap()

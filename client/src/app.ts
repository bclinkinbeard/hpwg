// import * as deck from '@deck.gl/core';
// import * as layers from '@deck.gl/layers';
// const { Deck } = deck
// const {ScatterplotLayer} = layers
const { DeckGL, ScatterplotLayer } = (window as any).deck
import * as Arrow from 'apache-arrow'
import { $ } from './helpers'

const dataset = 'movebank'

function init() {
  $<HTMLButtonElement>('#fetchBtn').onclick = fetchData
  fetchData()
}

function columnStats(column: Arrow.Column) {
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

const fetchDatasetTables = async (dataset: string) => {
  const xhr = await fetch(`/api/dataset/${dataset}/`)
  const buf = await xhr.arrayBuffer()
  const table = Arrow.Table.from(buf)
  console.log(table.getColumn('table_name').toArray())
}

const fetchData = async () => {
  document.getElementById('loading')!.style.display = 'block'
  document.getElementById('map')!.textContent = ''
  const animal = $<HTMLSelectElement>('#animal')?.value
  const useArrow = $<HTMLInputElement>('#useArrow')?.checked
  const limit = $<HTMLSelectElement>('#limit')?.value
  if (useArrow) {
    fetchArrowData(animal!, +limit!)
  }
}

const fetchArrowData = async (animal: string, limit: number) => {
  const xhr = await fetch(`/api/movebank/${animal}/arrow/${+limit}/`)
  const buf = await xhr.arrayBuffer()
  document.getElementById('loading')!.style.display = 'none'
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

init()

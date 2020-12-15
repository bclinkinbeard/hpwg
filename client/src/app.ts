// import * as deck from '@deck.gl/core';
// import * as layers from '@deck.gl/layers';
// const { Deck } = deck
// const {ScatterplotLayer} = layers
const { DataFilterExtension, DeckGL, ScatterplotLayer } = (window as any).deck
import * as Arrow from 'apache-arrow'
import { $, columnStats, DURATIONS } from './helpers'
import TimeScrubber from './time-scrubber'

const { DAY, WEEK, MONTH } = DURATIONS

export default class App {
  animalSelect!: HTMLSelectElement
  durations!: HTMLElement
  controls!: HTMLElement
  fetchBtn!: HTMLElement
  limitSelect!: HTMLSelectElement
  loading!: HTMLElement
  map!: HTMLElement
  playPause!: HTMLElement
  loop!: HTMLInputElement
  timeScrubber = new TimeScrubber('#scrubber')

  constructor() {
    this.initDOM()
    this.updateMap()
  }

  initDOM() {
    this.animalSelect = $<HTMLSelectElement>('#animal')
    this.durations = $('#durations')
    this.controls = $('#controls')
    this.fetchBtn = $<HTMLButtonElement>('#fetchBtn')
    this.limitSelect = $<HTMLSelectElement>('#limit')
    this.loading = $('#loading')
    this.map = $('#map')
    this.playPause = $('#playPause')
    this.loop = $<HTMLInputElement>('#loop')

    // set the initial DOM values
    this.animalSelect.value = 'wildebeest'
    this.limitSelect.value = '1e3'
    this.fetchBtn.onclick = this.updateMap

    const durationList = [
      { key: 'One Day', val: DAY },
      { key: 'One Week', val: WEEK },
      { key: 'One Month', val: MONTH },
      { key: 'Six Months', val: MONTH * 6 },
      { key: 'One Year', val: MONTH * 12 },
    ]
    for (let i = 0; i < durationList.length; i++) {
      const duration = durationList[i]
      const btn = document.createElement('button')
      btn.textContent = duration.key
      btn.onclick = () => {
        this.timeScrubber.setDuration(duration.val)
      }
      this.durations.appendChild(btn)
    }

    this.playPause.onclick = () => this.timeScrubber.togglePlay()
    this.loop.checked = this.timeScrubber.loop
    this.loop.onchange = () => (this.timeScrubber.loop = this.loop.checked)
  }

  fetchData = async (animal: string, limit: number) => {
    this.loading.style.display = 'block'
    this.map.textContent = ''

    const xhr = await fetch(`/api/movebank/${animal}/arrow/${+limit}/`)
    const buf = await xhr.arrayBuffer()

    this.loading.style.display = 'none'

    return buf
  }

  updateMap = async () => {
    const buf = await this.fetchData(
      this.animalSelect.value!,
      +this.limitSelect.value!,
    )
    const table = Arrow.Table.from(buf)
    const lngs = table.getColumn('location_long')
    const lats = table.getColumn('location_lat')
    const lngStats = columnStats(table.getColumn('location_long'))
    const latStats = columnStats(table.getColumn('location_lat'))
    const timeStats = columnStats(table.getColumn('timestamp'))

    this.timeScrubber.setTimeBounds(timeStats.min, timeStats.max)

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
}

new App()

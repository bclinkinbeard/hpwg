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
  table?: Arrow.Table<any>

  data: { length: number } = { length: 0 }

  intialLng = 0
  intialLat = 0
  deck!: any

  constructor() {
    this.timeScrubber.onTimeFilterChanged = () => {
      if (!this.deck) return
      this.deck.setProps({ layers: [this.getScatterplotLayer()] })
    }
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

  getIdColumn(column = 'individual_local_identifier') {
    return this.table!.getColumn(column)
  }

  getTimestampColumn(column = 'timestamp') {
    return this.table!.getColumn(column)
  }

  getLngColumn(column = 'location_long') {
    return this.table!.getColumn(column)
  }

  getLatColumn(column = 'location_lat') {
    return this.table!.getColumn(column)
  }

  getScatterplotLayer() {
    const { maxTimeFilter, minTime, minTimeFilter } = this.timeScrubber

    return new ScatterplotLayer({
      id: 'scatter-plot',
      data: this.data,
      pickable: true,
      radiusScale: 10,
      radiusMinPixels: 2,
      getPosition: (d: unknown, i: { index: number }) => {
        return [
          this.getLngColumn().get(i.index),
          this.getLatColumn().get(i.index),
          0,
        ]
      },
      getFillColor: [255, 40, 255],
      updateTriggers: {
        getFilterValue: [maxTimeFilter, minTimeFilter],
      },
      getFilterValue: (d: unknown, i: { index: number }) => {
        return this.getTimestampColumn().get(i.index) - minTime!
      },
      filterRange: [minTimeFilter! - minTime!, maxTimeFilter! - minTime!],
      extensions: [new DataFilterExtension({ filterSize: 1 })],
    })
  }

  updateMap = async () => {
    this.timeScrubber.reset()
    const buf = await this.fetchData(
      this.animalSelect.value!,
      +this.limitSelect.value!,
    )
    this.table = Arrow.Table.from(buf)
    this.data = {  length: this.table.length  }
    const timeStats = columnStats(this.getTimestampColumn())
    this.timeScrubber.setTimeBounds(timeStats.min, timeStats.max)
    const lngStats = columnStats(this.getLngColumn())
    const latStats = columnStats(this.getLatColumn())
    this.intialLng = (lngStats.min + lngStats.max) / 2
    this.intialLat = (latStats.min + latStats.max) / 2

    this.deck = new DeckGL({
      container: 'map',
      mapStyle: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      initialViewState: {
        longitude: this.intialLng,
        latitude: this.intialLat,
        zoom: 9,
        maxZoom: 20,
      },
      controller: true,
      layers: [this.getScatterplotLayer()],
      getTooltip: (data: { index: number }) => {
        if (data.index < 0) return
        const name = this.getIdColumn().get(data.index)
        const ts = this.getTimestampColumn().get(data.index)
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

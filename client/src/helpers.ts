import * as Arrow from 'apache-arrow'

export const $ = <T extends HTMLElement = HTMLElement>(query: string) => {
  if (query.startsWith('#')) {
    return document.getElementById(query.substr(1)) as T
  }
  if (query.startsWith('.')) {
    return document.getElementsByClassName(query.substr(1))[0] as T
  }
  return document.getElementsByTagName(query.substr(1))[0] as T
}

export const $$ = <T extends HTMLElement = HTMLElement>(query: string) => {
  return document.querySelectorAll(query) as NodeListOf<T>
}

export const columnStats = (column: Arrow.Column) => {
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

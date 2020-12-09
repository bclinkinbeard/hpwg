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

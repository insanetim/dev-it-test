export const getRandomInRange = (min: number, max: number) => {
  let rand = min + Math.random() * (max + 1 - min)
  rand = Math.floor(rand)
  return rand
}

export const wait = (ms: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

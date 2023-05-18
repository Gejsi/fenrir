/** $Fixed */
export function count(p) {
  if (p === false) {
    console.log('something went wrong')
    return
  }

  if (p === 1) return

  if (p === 2) {
    console.log('2')
  }

  console.log('foo')

  const add = (a, b) => {
    return a + b
  }

  return 'count'
}

/** $HttpGet */
export let foo = 1

/**
 * $Fixed
 */
export const bar = () => {
  return 'bar'
}

/**
 * $Fixed
 */
export const lok = function () {
  return 'lok'
}

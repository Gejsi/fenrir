/**
 * #Fixed
 * Lorem ipsum
 * dolor sit amet
 * @borrows 2
 */
export const a = 1

/**
 * #Fixed(firstParam, secondParam)
 * dolor sit amet
 * Lorem ipsum
 * @returns 1
 */
export const b = 2

// #\w+\(\w+\)
// #\w+\(\w*(,\w*)*\)
// #\w+(\(\w*(,)*\s*\w*\))?
// #\w+(\((\w+(,)*\s*(\w)+)*\))?
// #\w+(\((\s*\w+(,)*\s*\w+\s*)*\))?

/**
 * #Fixed(
 * dolor sit amet
 * Lorem ipsum
 * @returns 1
 */
export const c = 3

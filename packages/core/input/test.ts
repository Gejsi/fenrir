/** #Fixed */
export function merge(left: number[], right: number[]) {
  let mergedArr = []

  // Break out of loop if any one of the array gets empty
  while (left.length && right.length)
    // Pick the smaller among the smallest element of left and right sub arrays
    if (left[0] && right[0] && left[0] < right[0]) mergedArr.push(left.shift())
    else mergedArr.push(right.shift())

  // Concatenating the leftover elements
  return [...mergedArr, ...left, ...right]
}

// @ts-nocheck

import { log } from 'console'

type First = 'f' | 's'
type Second = {
  first: 1
  second: 2
}

/**
 * #Fixed
 */
export async function kol(
  first: First,
  half: Record<string, number>
): number | string {
  const lambda = new Lambda()
  log('Hello')

  return [1, 2]
}

/**
 * #Fixed
 */
export async function foo(
  first: First,
  half: Record<string, number>
): number | string {
  const lambda = new Lambda()
  log('Hello')

  return [1, 2]
}

console.log('test')

/**
 * #Ignored
 */
console.log('test 2')

/**
 * #Fixed
 */
export const bar = async (par: string): number => {
  const lambda = new Lambda()

  const a = 2

  return a
}

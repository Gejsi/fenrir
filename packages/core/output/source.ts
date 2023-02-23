import { log } from 'console';
type First = number;
type Second = 'Second';
/**
 * #Fixed
 */
export async function kol(event, context, callback) {
    const first: number = event.first;
    const lambda = new Lambda();
    log('Hello');
}
/**
 * #Fixed
 */
export async function bar(event, context, callback) {
    const second: "Second" = event.second;
    const lambda = new Lambda();
    const a = 2;
}

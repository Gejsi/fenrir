import { log } from 'console';
type First = 'f' | 's';
type Second = {
    first: 1;
    second: 2;
};
/**
 * #Fixed
 */
export async function kol(event, context, callback): number | string {
    const first: First = event.first;
    const half: Record<string, number> = event.half;
    const lambda = new Lambda();
    log('Hello');
    return {
        statusCode: 200,
        body: JSON.stringify([1, 2])
    };
}
/**
 * #Fixed
 */
export function bar(event, context, callback): number {
    const par = event.par;
    const lambda = new Lambda();
    const a = 2;
    return {
        statusCode: 200,
        body: JSON.stringify(a)
    };
}

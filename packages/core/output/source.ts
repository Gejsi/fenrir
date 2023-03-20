// @ts-nocheck
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
    const first: First = JSON.parse(event.first);
    const half: Record<string, number> = JSON.parse(event.half);
    const lambda = new Lambda();
    log('Hello');
    return {
        statusCode: 200,
        body: JSON.stringify([1, 2])
    };
}
console.log('test');
/**
 * #Fixed
 */
export const bar = async (event, context, callback): number => {
    const par: string = JSON.parse(event.par);
    const lambda = new Lambda();
    const a = 2;
    return {
        statusCode: 200
    };
};

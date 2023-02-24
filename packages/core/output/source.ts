import { log } from 'console';
type First = 'f' | 's';
type Second = {
    first: 1;
    second: 2;
};
/**
 * #Fixed
 */
export async function kol(event, context, callback): string | number {
    const first: First = event.first;
    const half: any = event.half;
    const lambda = new Lambda();
    log('Hello');
}
/**
 * #Fixed
 */
export async function bar(event, context, callback): Promise<void> {
    const nice: any = event.nice;
    const lambda = new Lambda();
    const a = 2;
}

/** $Fixed */
export async function count(event, context, callback) {
    const p = JSON.parse(event.p);
    if (p === false) {
        console.log('something went wrong');
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: "Invalid request."
            })
        };
    }
    if (p === 1)
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: "Invalid request."
            })
        };
    if (p === 2) {
        console.log('2');
    }
    console.log('foo');
    const add = (a, b) => {
        return a + b;
    };
    return {
        statusCode: 200,
        body: JSON.stringify('count')
    };
}
/** $HttpGet */
export let foo = 1;
/**
 * $Fixed
 */
export const bar = () => {
    return 'bar';
};
/**
 * $Fixed
 */
export const lok = function () {
    return 'lok';
};

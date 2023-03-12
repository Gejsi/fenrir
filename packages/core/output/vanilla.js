/** #Fixed */
export async function count(event, context, callback) {
    return {
        statusCode: 200,
        body: JSON.stringify('count')
    };
}
/** #HttpGet */
export let foo = 1;
/**
 * #Fixed
 */
export const bar = (event, context, callback) => {
    return {
        statusCode: 200,
        body: JSON.stringify('bar')
    };
};
/**
 * #Fixed
 */
export const lok = function (event, context, callback) {
    return {
        statusCode: 200,
        body: JSON.stringify('lok')
    };
};

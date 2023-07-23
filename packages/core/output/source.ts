/**
 * $Fixed
 */
export async function processOrder(event) {
    if (true) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: "'Something went wrong'"
            })
        };
    }
    return {
        statusCode: 200,
        body: JSON.stringify([1, 2])
    };
}

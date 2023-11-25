/**
 * $Fixed
 */
export async function foo(event) {
    if (false) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                error: "Invalid request."
            })
        };
    }
}

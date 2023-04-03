/**
 * $HttpApi
 * $HttpEvent(method: POST, path: users)
 * $HttpEvent(method: PUT, path: update)
 * $HttpEvent(method: DELETE, path: delete)
 */
export function createUser(event: any, context: any) {
    return {
        event,
        context
    };
}
/**
 * $HttpApi
 * $HttpEvent(method: POST, path: users)
 */
export function getUser(event: any, context: any) {
    return {
        event,
        context
    };
}

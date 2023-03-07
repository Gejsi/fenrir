/** #Fixed
 * */
server.listen({ port: 8080 }, (err: any, address: any) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
console.log('testing');
export const a = () => { };
/**
 * #HttpGet
 */
export const b = () => { };
/** #Fixed */
export function bar(event, context, callback) { }

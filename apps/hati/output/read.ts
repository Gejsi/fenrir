export type Email = {
    subject: string;
    sender: string;
    receiver: string;
    timestamp: Date;
    message: string;
    links?: string[];
};
const isValidEmailAddress = (text: string): boolean => {
    return new RegExp('[a-z0-9]+@[a-z]+.[a-z]{2,3}').test(text);
};
const extractLinksFromMessage = (message: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = message.match(urlRegex);
    return matches || [];
};
/** $Fixed */
export async function read(event) {
    const email: Partial<Email> = event;
    if (!email ||
        !email.subject ||
        !email.sender ||
        !email.receiver ||
        !email.timestamp ||
        !email.message) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: "'Missing some email data. Please, check the email you provided.'"
            })
        };
    }
    if (!isValidEmailAddress(email.sender)) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: "'The provided `sender` address is not a valid email.'"
            })
        };
    }
    if (!isValidEmailAddress(email.receiver)) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: "'The provided `receiver` address is not a valid email.'"
            })
        };
    }
    const parsedEmail = {
        ...email,
        links: extractLinksFromMessage(email.message)
    } as Email;
    return {
        statusCode: 200,
        body: JSON.stringify(parsedEmail)
    };
}

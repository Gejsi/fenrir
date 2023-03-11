// @ts-nocheck
import { express } from 'express';
import AWS from 'aws-sdk';
const app = express();
app.get('/', function (req, res) {
    res.send('Hello World!');
});
const dynamoDb = new AWS.DynamoDB.DocumentClient();
// create user endpoint
app.post('/create-user', function (req, res) {
    const { userId, name } = req.body;
    if (typeof userId !== 'string') {
        res.status(400).json({ error: '"userId" must be a string' });
    }
    else if (typeof name !== 'string') {
        res.status(400).json({ error: '"name" must be a string' });
    }
    const params = {
        TableName: USERS_TABLE,
        Item: {
            userId: userId,
            name: name
        }
    };
    dynamoDb.put(params, (error) => {
        if (error) {
            console.log(error);
            res.status(400).json({ error: 'Could not create user' });
        }
        res.json({ userId, name });
    });
});

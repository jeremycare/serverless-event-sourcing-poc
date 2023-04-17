import {ScanCommand, DeleteItemCommand} from "@aws-sdk/client-dynamodb";
import {buildDocumentClient} from "./documentClient";
import {EventStore} from "./index";
import {QueryCommand} from "@aws-sdk/lib-dynamodb";
import {PutCommand} from "@aws-sdk/lib-dynamodb";

const documentClient = buildDocumentClient({
    endpoint: 'http://localhost:8000',
})

describe('eventStore', () => {
    describe('publishEvents', () => {
        afterEach(async () => {
            const documents = await documentClient.send(new ScanCommand({
                TableName: process.env.EVENT_STORE_TABLE,
            }))
            await Promise.all(documents.Items!.map(({PK, SK}) => {
                return documentClient.send(new DeleteItemCommand({
                    TableName: process.env.EVENT_STORE_TABLE,
                    Key: {
                        PK,
                        SK
                    }
                }))
            }))
        })


        it('should publish events after the actual ones', async () => {
            const eventStore = new EventStore(documentClient);

            await documentClient.send(new PutCommand({
                TableName: process.env.EVENT_STORE_TABLE,
                Item: {
                    PK: '1234',
                    SK: 1
                }
            }))
            await documentClient.send(new PutCommand({
                TableName: process.env.EVENT_STORE_TABLE,
                Item: {
                    PK: '1234',
                    SK: 2
                }
            }))
            await documentClient.send(new PutCommand({
                TableName: process.env.EVENT_STORE_TABLE,
                Item: {
                    PK: '1234',
                    SK: 3
                }
            }))
            const events = [
                {
                    eventName: 'itemAdded',
                    body: {
                        uuid: '1234',
                        quantity: 1,
                        origin: 'warehouse'
                    },
                    time: '1'
                },
                {
                    eventName: 'itemAdded',
                    body: {
                        uuid: '1234',
                        quantity: 1,
                        origin: 'warehouse'
                    },
                    time: '2'
                },
                {
                    eventName: 'itemAdded',
                    body: {
                        uuid: '1234',
                        quantity: 1,
                        origin: 'warehouse'
                    },
                    time: '3'
                },
                {
                    eventName: 'itemAdded',
                    body: {
                        uuid: '1234',
                        quantity: 1,
                        origin: 'warehouse'
                    },
                    time: '4'
                },
            ]

            await eventStore.publishEvents('1234', events)

            const documents = await documentClient.send(new QueryCommand({
                TableName: process.env.EVENT_STORE_TABLE,
                KeyConditionExpression: `#PK = :PK`,
                ExpressionAttributeNames: {
                    '#PK': 'PK',
                },
                ExpressionAttributeValues: {
                    ':PK': '1234',
                },
            }))
            expect(documents.Items).toEqual([
                { "PK": "1234", "SK": 1 },
                { "PK": "1234", "SK": 2 },
                { "PK": "1234", "SK": 3 },
                {
                    "PK": "1234",
                    "SK": 4,
                    "body": {
                        "origin": "warehouse",
                        "quantity": 1,
                        "uuid": "1234"
                    },
                    "created_at": "1",
                    "eventName": "itemAdded"
                },
                {
                    "PK": "1234",
                    "SK": 5,
                    "body": {
                        "origin": "warehouse",
                        "quantity": 1,
                        "uuid": "1234"
                    },
                    "created_at": "2",
                    "eventName": "itemAdded"
                },
                {
                    "PK": "1234",
                    "SK": 6,
                    "body": {
                        "origin": "warehouse",
                        "quantity": 1,
                        "uuid": "1234"
                    },
                    "created_at": "3",
                    "eventName": "itemAdded"
                },
                {
                    "PK": "1234",
                    "SK": 7,
                    "body": {
                        "origin": "warehouse",
                        "quantity": 1,
                        "uuid": "1234"
                    },
                    "created_at": "4",
                    "eventName": "itemAdded"
                }

            ])
        });

        it('should throw if there is a concurrent update on aggregate', async () => {
            class ControlledEventStore extends EventStore {
                async getLastVersion(): Promise<any> {
                    return 1
                }
            }

            const eventStore = new ControlledEventStore(documentClient);
            await documentClient.send(new PutCommand({
                TableName: process.env.EVENT_STORE_TABLE,
                Item: {
                    PK: '1234',
                    SK: 1
                }
            }))
            await documentClient.send(new PutCommand({
                TableName: process.env.EVENT_STORE_TABLE,
                Item: {
                    PK: '1234',
                    SK: 2
                }
            }))
            const events = [
                {
                    eventName: 'itemAdded',
                    body: {
                        uuid: '1234',
                        quantity: 1,
                        origin: 'warehouse'
                    },
                    time: '1'
                },
                {
                    eventName: 'itemAdded',
                    body: {
                        uuid: '1234',
                        quantity: 1,
                        origin: 'warehouse'
                    },
                    time: '2'
                },
                {
                    eventName: 'itemAdded',
                    body: {
                        uuid: '1234',
                        quantity: 1,
                        origin: 'warehouse'
                    },
                    time: '3'
                },
                {
                    eventName: 'itemAdded',
                    body: {
                        uuid: '1234',
                        quantity: 1,
                        origin: 'warehouse'
                    },
                    time: '4'
                },
            ]

            await expect(() => eventStore.publishEvents('1234', events)).rejects.toThrow()

            const documents = await documentClient.send(new QueryCommand({
                TableName: process.env.EVENT_STORE_TABLE,
                KeyConditionExpression: `#PK = :PK`,
                ExpressionAttributeNames: {
                    '#PK': 'PK',
                },
                ExpressionAttributeValues: {
                    ':PK': '1234',
                },
            }))
            expect(documents.Items).toEqual([
                { "PK": "1234", "SK": 1 },
                { "PK": "1234", "SK": 2 },
            ])
        });
    });
})

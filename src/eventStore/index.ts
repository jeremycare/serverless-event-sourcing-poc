import {DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {QueryCommand, TransactWriteCommand} from "@aws-sdk/lib-dynamodb";

const tableName = process.env.EVENT_STORE_TABLE

export class EventStore {
    documentClient: DynamoDBClient

    constructor(documentClient: DynamoDBClient) {
        this.documentClient = documentClient
    }

    async getLastVersion(aggregateId: string) {
        const res = await this.documentClient.send( new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: `#PK = :PK`,
            Limit: 1,
            ExpressionAttributeNames: {
                '#PK': 'PK',
            },
            ExpressionAttributeValues: {
                ':PK': aggregateId,
            },
            ScanIndexForward: false,    // true = ascending, false = descending
        }));

        const lastDocument = res.Items ? res.Items[0] : undefined

        if (!lastDocument) {
            return 0
        }

        return lastDocument.SK
    }

    async publishEvents(aggregateId = '1234', events: { eventName: string, body: Record<string,unknown>, time: string }[]) {
        const version = await this.getLastVersion(aggregateId)

        const normalisedEvents = events.map((event, index) => ({
            PK: aggregateId,
            SK: version + index + 1,
            eventName: event.eventName,
            body: event.body,
            created_at: event.time,
        }))

        const input = { // TransactWriteItemsInput
            TransactItems: normalisedEvents.map(event => ({
                    Put: { // Put
                        Item: event,
                        TableName: tableName, // required
                        ConditionExpression: "attribute_not_exists(PK)",
                    },
                }))
        };

        await this.documentClient.send(new TransactWriteCommand(input))
    }
}

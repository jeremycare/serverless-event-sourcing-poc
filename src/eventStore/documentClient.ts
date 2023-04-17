import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

export const buildDocumentClient = (config: DynamoDBClientConfig) => {
    // Create an Amazon DynamoDB service client object.
    const ddbClient = new DynamoDBClient(config, );

    const marshallOptions = {
        // Whether to automatically convert empty strings, blobs, and sets to `null`.
        convertEmptyValues: true, // false, by default.
        // Whether to remove undefined values while marshalling.
        removeUndefinedValues: true, // false, by default.
        // Whether to convert typeof object to map attribute.
        convertClassInstanceToMap: true, // false, by default.
    };

    const unmarshallOptions = {
        // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
        wrapNumbers: false, // false, by default.
    };

    const translateConfig = { marshallOptions, unmarshallOptions };

    // Create the DynamoDB Document client.
    return DynamoDBDocumentClient.from(ddbClient, translateConfig);
};

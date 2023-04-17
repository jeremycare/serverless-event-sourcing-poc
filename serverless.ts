import type { AWS } from '@serverless/typescript';

import addItem from '@functions/addItem';

const serverlessConfiguration: AWS = {
  service: 'serverless-event-sourcing-poc',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild'],
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
  },
  resources: {
    Resources: {
      eventStore: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'eventStore-test',
          AttributeDefinitions: [
            {
              AttributeName: 'PK',
              AttributeType: 'S',
            },
            {
              AttributeName: 'SK',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'PK',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'SK',
              KeyType: 'RANGE',
            },
          ],
          BillingMode: 'PAY_PER_REQUEST',
        },
      }
    }
  },
  // import the function via paths
  functions: { addItem },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node18',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;

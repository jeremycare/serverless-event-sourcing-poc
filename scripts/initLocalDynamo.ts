import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { promises as fs } from 'fs';

interface Env {
  [variableName: string]: string
}

const env = {
  AWS_SECRET_ACCESS_KEY: 'DUMMY_SECRET_KEY',
  AWS_ACCESS_KEY_ID: 'DUMMY_ACCESS_KEY',
  AWS_REGION: 'us-west-2',
  NODE_ENV: 'test',
  EVENT_STORE_TABLE: 'eventStore-test'
};

const dynamodb = new DynamoDB({
  endpoint: 'http://localhost:8000',
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const createTables = async () => {
  const resources = [
    {
      Type: 'AWS::DynamoDB::Table',
      Properties: {
        TableName: env.EVENT_STORE_TABLE,
        AttributeDefinitions: [
          {
            AttributeName: 'PK',
            AttributeType: 'S',
          },
          {
            AttributeName: 'SK',
            AttributeType: 'N',
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
    },
  ];
  await Promise.all(resources.map(async (resource) => dynamodb.createTable({
    ...resource.Properties,
  })));
  console.log('Tables created');
};

const envValuesToString = (values: Env) => {
  const lines = Object.entries(values).map((value) => value.join('='));
  return lines.join('\n');
};

const createEnv = async ({ name, values }: { name: string, values: Env }) => {
  const fileContent = envValuesToString(values);
  await fs.writeFile(`./${name}`, fileContent);
  return name;
};

const main = async () => {
  await createTables();

  return createEnv({
    name: '.env.test',
    values: env,
  });
};

main().then((name) => {
  console.log(`Environment file created: ${name}`);
}).catch((err) => console.error(err));

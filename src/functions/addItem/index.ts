import schema from './schema';

export default {
  handler: `scr/functions/addItem/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'addItem',
        request: {
          schemas: {
            'application/json': schema,
          },
        },
      },
    },
  ],
};

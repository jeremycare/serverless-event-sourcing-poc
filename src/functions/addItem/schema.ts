export default {
  type: "object",
  properties: {
    id: { type: 'string' },
    locationId: { type: 'string' },
    variantId: { type: 'string' },
    quantity: { type: 'string' }
  },
  required: ['id', 'locationId', 'variantId', 'quantity']
} as const;

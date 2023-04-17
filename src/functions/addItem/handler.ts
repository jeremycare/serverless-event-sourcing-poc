
export const main = async (uuid = '12345') => {
    const events = [
        {
            eventName: 'itemAdded',
            body: {
                uuid,
                quantity: 1,
                origin: 'warehouse'
            },
            time: Date.now()
        },
    ]
    return events
}

const AWS = require('aws-sdk');
const axios = require('axios');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    try {
        const method = event.httpMethod;

        switch (method) {
            case 'POST':
                return await createOrder(JSON.parse(event.body), headers);
            case 'GET':
                if (event.pathParameters && event.pathParameters.id) {
                    return await getOrder(event.pathParameters.id, headers);
                } else {
                    return await getUserOrders(event.queryStringParameters?.user_id, headers);
                }
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

async function createOrder(orderData, headers) {
    const orderId = generateId();
    
    // Create order in DynamoDB
    const order = {
        order_id: orderId,
        user_id: orderData.user_id,
        items: orderData.items,
        total_amount: orderData.total_amount,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const params = {
        TableName: process.env.ORDERS_TABLE || 'orders',
        Item: order
    };

    await dynamodb.put(params).promise();

    // Process payment via Azure
    try {
        const paymentResponse = await axios.post(`${process.env.AZURE_ENDPOINT}/api/payment`, {
            order_id: orderId,
            amount: orderData.total_amount,
            payment_method: orderData.payment_method,
            customer_id: orderData.user_id
        });

        if (paymentResponse.data.status === 'success') {
            // Update order status
            await updateOrderStatus(orderId, 'confirmed');
            
            // Send notification via Azure
            await sendNotification(orderData.user_id, 'order_confirmed', {
                order_id: orderId,
                amount: orderData.total_amount
            });

            order.status = 'confirmed';
            order.payment_id = paymentResponse.data.payment_id;
        } else {
            await updateOrderStatus(orderId, 'payment_failed');
            order.status = 'payment_failed';
        }
    } catch (error) {
        console.error('Payment processing failed:', error);
        await updateOrderStatus(orderId, 'payment_failed');
        order.status = 'payment_failed';
    }

    return {
        statusCode: 201,
        headers,
        body: JSON.stringify(order)
    };
}

async function getOrder(orderId, headers) {
    const params = {
        TableName: process.env.ORDERS_TABLE || 'orders',
        Key: { order_id: orderId }
    };

    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Order not found' })
        };
    }

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Item)
    };
}

async function getUserOrders(userId, headers) {
    if (!userId) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'User ID is required' })
        };
    }

    const params = {
        TableName: process.env.ORDERS_TABLE || 'orders',
        FilterExpression: 'user_id = :user_id',
        ExpressionAttributeValues: {
            ':user_id': userId
        }
    };

    const result = await dynamodb.scan(params).promise();

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Items)
    };
}

async function updateOrderStatus(orderId, status) {
    const params = {
        TableName: process.env.ORDERS_TABLE || 'orders',
        Key: { order_id: orderId },
        UpdateExpression: 'SET #status = :status, updated_at = :updated_at',
        ExpressionAttributeNames: {
            '#status': 'status'
        },
        ExpressionAttributeValues: {
            ':status': status,
            ':updated_at': new Date().toISOString()
        }
    };

    await dynamodb.update(params).promise();
}

async function sendNotification(userId, type, data) {
    try {
        await axios.post(`${process.env.AZURE_ENDPOINT}/api/notifications`, {
            user_id: userId,
            type: type,
            data: data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to send notification:', error.message);
    }
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
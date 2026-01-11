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
        const path = event.path;

        switch (method) {
            case 'GET':
                if (event.pathParameters && event.pathParameters.id) {
                    return await getProduct(event.pathParameters.id, headers);
                } else {
                    return await getAllProducts(headers);
                }
            case 'POST':
                return await createProduct(JSON.parse(event.body), headers);
            case 'PUT':
                return await updateProduct(event.pathParameters.id, JSON.parse(event.body), headers);
            case 'DELETE':
                return await deleteProduct(event.pathParameters.id, headers);
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

async function getAllProducts(headers) {
    const params = {
        TableName: process.env.PRODUCTS_TABLE
    };

    const result = await dynamodb.scan(params).promise();
    
    // Sync with Azure analytics
    await syncWithAzure('product_view', { action: 'list_products', count: result.Items.length });

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Items)
    };
}

async function getProduct(productId, headers) {
    const params = {
        TableName: process.env.PRODUCTS_TABLE,
        Key: { product_id: productId }
    };

    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Product not found' })
        };
    }

    // Sync with Azure analytics
    await syncWithAzure('product_view', { action: 'view_product', product_id: productId });

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Item)
    };
}

async function createProduct(product, headers) {
    const productId = generateId();
    const item = {
        product_id: productId,
        ...product,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const params = {
        TableName: process.env.PRODUCTS_TABLE,
        Item: item
    };

    await dynamodb.put(params).promise();
    
    // Sync with Azure analytics
    await syncWithAzure('product_created', { product_id: productId, name: product.name });

    return {
        statusCode: 201,
        headers,
        body: JSON.stringify(item)
    };
}

async function updateProduct(productId, updates, headers) {
    const params = {
        TableName: process.env.PRODUCTS_TABLE,
        Key: { product_id: productId },
        UpdateExpression: 'SET updated_at = :updated_at',
        ExpressionAttributeValues: {
            ':updated_at': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
    };

    // Build update expression dynamically
    Object.keys(updates).forEach((key, index) => {
        params.UpdateExpression += `, ${key} = :val${index}`;
        params.ExpressionAttributeValues[`:val${index}`] = updates[key];
    });

    const result = await dynamodb.update(params).promise();
    
    // Sync with Azure analytics
    await syncWithAzure('product_updated', { product_id: productId, updates });

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Attributes)
    };
}

async function deleteProduct(productId, headers) {
    const params = {
        TableName: process.env.PRODUCTS_TABLE,
        Key: { product_id: productId }
    };

    await dynamodb.delete(params).promise();
    
    // Sync with Azure analytics
    await syncWithAzure('product_deleted', { product_id: productId });

    return {
        statusCode: 204,
        headers,
        body: ''
    };
}

async function syncWithAzure(eventType, data) {
    try {
        await axios.post(`${process.env.AZURE_ENDPOINT}/api/analytics`, {
            event_type: eventType,
            data: data,
            timestamp: new Date().toISOString(),
            source: 'aws-lambda'
        });
    } catch (error) {
        console.error('Failed to sync with Azure:', error.message);
        // Don't fail the main operation if Azure sync fails
    }
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
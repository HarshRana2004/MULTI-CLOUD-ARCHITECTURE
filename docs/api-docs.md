# Multi-Cloud API Documentation

## Overview
This document describes the REST APIs for the multi-cloud e-commerce architecture, spanning AWS and Azure services.

## Base URLs
- **AWS API Gateway**: `https://your-api-gateway-url.amazonaws.com/dev`
- **Azure Functions**: `https://your-azure-function-app.azurewebsites.net/api`

## Authentication
All APIs use JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

For service-to-service communication, use API keys:
```
X-API-Key: <api-key>
```

## AWS APIs (Product & Order Management)

### Products API

#### GET /products
Retrieve all products from AWS DynamoDB.

**Response:**
```json
[
  {
    "product_id": "prod_abc123",
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "category": "Electronics",
    "inventory_count": 50,
    "images": ["image1.jpg", "image2.jpg"],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "status": "active"
  }
]
```

#### GET /products/{id}
Retrieve a specific product by ID.

**Parameters:**
- `id` (path): Product ID

**Response:**
```json
{
  "product_id": "prod_abc123",
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "category": "Electronics",
  "inventory_count": 50,
  "images": ["image1.jpg", "image2.jpg"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "status": "active"
}
```

#### POST /products
Create a new product.

**Request Body:**
```json
{
  "name": "Smartphone",
  "description": "Latest smartphone model",
  "price": 699.99,
  "category": "Electronics",
  "inventory_count": 100,
  "images": ["phone1.jpg"],
  "attributes": {
    "brand": "TechCorp",
    "model": "TC-2024"
  }
}
```

**Response:**
```json
{
  "product_id": "prod_def456",
  "name": "Smartphone",
  "description": "Latest smartphone model",
  "price": 699.99,
  "category": "Electronics",
  "inventory_count": 100,
  "images": ["phone1.jpg"],
  "attributes": {
    "brand": "TechCorp",
    "model": "TC-2024"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "status": "active"
}
```

#### PUT /products/{id}
Update an existing product.

**Parameters:**
- `id` (path): Product ID

**Request Body:**
```json
{
  "price": 649.99,
  "inventory_count": 75
}
```

**Response:**
```json
{
  "product_id": "prod_def456",
  "name": "Smartphone",
  "description": "Latest smartphone model",
  "price": 649.99,
  "category": "Electronics",
  "inventory_count": 75,
  "updated_at": "2024-01-01T12:00:00Z"
}
```

#### DELETE /products/{id}
Delete a product.

**Parameters:**
- `id` (path): Product ID

**Response:** `204 No Content`

### Orders API

#### POST /orders
Create a new order (triggers Azure payment processing).

**Request Body:**
```json
{
  "user_id": "usr_123456",
  "items": [
    {
      "product_id": "prod_abc123",
      "quantity": 1,
      "price": 999.99
    },
    {
      "product_id": "prod_def456",
      "quantity": 2,
      "price": 649.99
    }
  ],
  "total_amount": 2299.97,
  "payment_method": "credit_card",
  "shipping_address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zip": "12345",
    "country": "US"
  }
}
```

**Response:**
```json
{
  "order_id": "ord_789012",
  "user_id": "usr_123456",
  "items": [...],
  "total_amount": 2299.97,
  "status": "confirmed",
  "payment_method": "credit_card",
  "payment_id": "pay_345678901234",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### GET /orders/{id}
Retrieve a specific order.

**Parameters:**
- `id` (path): Order ID

**Response:**
```json
{
  "order_id": "ord_789012",
  "user_id": "usr_123456",
  "items": [...],
  "total_amount": 2299.97,
  "status": "confirmed",
  "payment_method": "credit_card",
  "payment_id": "pay_345678901234",
  "tracking_number": "TRK123456789",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### GET /orders?user_id={user_id}
Retrieve orders for a specific user.

**Parameters:**
- `user_id` (query): User ID

**Response:**
```json
[
  {
    "order_id": "ord_789012",
    "user_id": "usr_123456",
    "total_amount": 2299.97,
    "status": "confirmed",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

## Azure APIs (Payment & Notifications)

### Payment API

#### POST /payment
Process payment for an order.

**Request Body:**
```json
{
  "order_id": "ord_789012",
  "amount": 2299.97,
  "payment_method": "credit_card",
  "customer_id": "usr_123456",
  "card_details": {
    "number": "4111111111111111",
    "expiry": "12/25",
    "cvv": "123"
  }
}
```

**Response:**
```json
{
  "payment_id": "pay_345678901234",
  "order_id": "ord_789012",
  "amount": 2299.97,
  "status": "success",
  "payment_method": "credit_card",
  "customer_id": "usr_123456",
  "processed_at": "2024-01-01T00:00:00Z",
  "gateway_response": "Payment approved"
}
```

### Notifications API

#### POST /notifications
Send notification to user.

**Request Body:**
```json
{
  "user_id": "usr_123456",
  "type": "order_confirmed",
  "data": {
    "order_id": "ord_789012",
    "amount": 2299.97,
    "tracking_number": "TRK123456789"
  }
}
```

**Response:**
```json
{
  "notification_id": "notif_abc123def",
  "user_id": "usr_123456",
  "type": "order_confirmed",
  "status": "sent",
  "created_at": "2024-01-01T00:00:00Z",
  "sent_at": "2024-01-01T00:00:05Z"
}
```

### Analytics API

#### POST /analytics
Store analytics event from AWS services.

**Request Body:**
```json
{
  "event_type": "product_view",
  "data": {
    "product_id": "prod_abc123",
    "user_id": "usr_123456",
    "session_id": "sess_789012"
  },
  "source": "aws-lambda",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "message": "Analytics event processed",
  "event_id": "event_def456ghi"
}
```

## Error Responses

All APIs return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Rate Limiting

APIs are rate-limited to prevent abuse:
- **AWS APIs**: 1000 requests per minute per API key
- **Azure APIs**: 500 requests per minute per API key

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Webhooks

### Order Status Updates
When order status changes, a webhook is sent to registered endpoints:

**Webhook Payload:**
```json
{
  "event": "order.status_changed",
  "data": {
    "order_id": "ord_789012",
    "old_status": "pending",
    "new_status": "confirmed",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Payment Notifications
Payment status changes trigger webhooks:

**Webhook Payload:**
```json
{
  "event": "payment.processed",
  "data": {
    "payment_id": "pay_345678901234",
    "order_id": "ord_789012",
    "status": "success",
    "amount": 2299.97,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## SDK Examples

### JavaScript/Node.js
```javascript
const MultiCloudClient = require('./multi-cloud-client');

const client = new MultiCloudClient({
  awsEndpoint: 'https://your-api-gateway-url.amazonaws.com/dev',
  azureEndpoint: 'https://your-azure-function-app.azurewebsites.net/api',
  apiKey: 'your-api-key'
});

// Get products
const products = await client.products.list();

// Create order
const order = await client.orders.create({
  user_id: 'usr_123456',
  items: [{ product_id: 'prod_abc123', quantity: 1, price: 999.99 }],
  total_amount: 999.99,
  payment_method: 'credit_card'
});
```

### Python
```python
from multi_cloud_client import MultiCloudClient

client = MultiCloudClient(
    aws_endpoint='https://your-api-gateway-url.amazonaws.com/dev',
    azure_endpoint='https://your-azure-function-app.azurewebsites.net/api',
    api_key='your-api-key'
)

# Get products
products = client.products.list()

# Create order
order = client.orders.create({
    'user_id': 'usr_123456',
    'items': [{'product_id': 'prod_abc123', 'quantity': 1, 'price': 999.99}],
    'total_amount': 999.99,
    'payment_method': 'credit_card'
})
```

### cURL Examples

#### Create Product
```bash
curl -X POST https://your-api-gateway-url.amazonaws.com/dev/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "name": "Tablet",
    "description": "10-inch tablet",
    "price": 299.99,
    "category": "Electronics",
    "inventory_count": 25
  }'
```

#### Process Payment
```bash
curl -X POST https://your-azure-function-app.azurewebsites.net/api/payment \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "order_id": "ord_789012",
    "amount": 299.99,
    "payment_method": "credit_card",
    "customer_id": "usr_123456"
  }'
```

## Testing

### Postman Collection
Import the provided Postman collection for easy API testing:
- `multi-cloud-api.postman_collection.json`
- `multi-cloud-environment.postman_environment.json`

### Integration Tests
Run the integration test suite:
```bash
npm test
```

### Load Testing
Use the provided load testing scripts:
```bash
# Test AWS APIs
npm run load-test:aws

# Test Azure APIs  
npm run load-test:azure

# Test full workflow
npm run load-test:full
```
# Multi-Cloud Deployment Guide

## Prerequisites

### Required Tools
- **AWS CLI** - Configure with appropriate permissions
- **Azure CLI** - Logged in to your Azure subscription
- **Terraform** - Version 1.0 or higher
- **Node.js** - Version 18 or higher
- **Git** - For version control

### Required Permissions

#### AWS Permissions
- IAM: Create roles and policies
- Lambda: Create and manage functions
- API Gateway: Create and configure APIs
- DynamoDB: Create and manage tables
- S3: Create and manage buckets
- CloudWatch: Create log groups

#### Azure Permissions
- Resource Group: Create and manage
- Function App: Create and deploy
- SQL Database: Create and manage
- Service Bus: Create queues and topics
- Storage Account: Create and manage

## Step 1: Environment Setup

### 1.1 Clone Repository
```bash
git clone <repository-url>
cd multi-cloud-architecture
```

### 1.2 Configure Environment Variables

Create `.env` file in the root directory:
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your-account-id

# Azure Configuration
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_RESOURCE_GROUP=multicloud-rg
AZURE_LOCATION=eastus

# Shared Configuration
JWT_SECRET=your-super-secret-jwt-key
PROJECT_NAME=multicloud-ecommerce
ENVIRONMENT=dev
```

### 1.3 Install Dependencies
```bash
# Install shared dependencies
npm install

# Install demo frontend dependencies
cd demo/frontend
npm install
cd ../..
```

## Step 2: Deploy AWS Infrastructure

### 2.1 Initialize Terraform
```bash
cd aws/terraform
terraform init
```

### 2.2 Plan Deployment
```bash
terraform plan -var-file="terraform.tfvars"
```

### 2.3 Deploy Infrastructure
```bash
terraform apply -auto-approve
```

### 2.4 Package and Deploy Lambda Functions
```bash
cd ../lambda

# Package product service
zip -r product-service.zip product-service.js node_modules/

# Package order service  
zip -r order-service.zip order-service.js node_modules/

# Update Lambda functions
aws lambda update-function-code \
  --function-name product-service \
  --zip-file fileb://product-service.zip

aws lambda update-function-code \
  --function-name order-service \
  --zip-file fileb://order-service.zip
```

### 2.5 Configure API Gateway
```bash
# Deploy API Gateway
aws apigateway create-deployment \
  --rest-api-id YOUR_API_ID \
  --stage-name dev
```

## Step 3: Deploy Azure Infrastructure

### 3.1 Create Resource Group
```bash
az group create \
  --name multicloud-rg \
  --location eastus
```

### 3.2 Deploy ARM Template
```bash
cd azure/arm-templates

az deployment group create \
  --resource-group multicloud-rg \
  --template-file main.json \
  --parameters sqlAdminPassword="YourSecurePassword123!"
```

### 3.3 Deploy Azure Functions
```bash
cd ../functions

# Create function app package
zip -r functions.zip . -x "*.git*" "node_modules/*"

# Deploy to Azure
az functionapp deployment source config-zip \
  --resource-group multicloud-rg \
  --name your-function-app-name \
  --src functions.zip
```

### 3.4 Configure Database Schema
```sql
-- Connect to Azure SQL Database and run:

CREATE TABLE Transactions (
    TransactionId NVARCHAR(50) PRIMARY KEY,
    PaymentId NVARCHAR(50),
    OrderId NVARCHAR(50) NOT NULL,
    UserId NVARCHAR(50) NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    Currency NVARCHAR(3) DEFAULT 'USD',
    PaymentMethod NVARCHAR(50) NOT NULL,
    Status NVARCHAR(20) NOT NULL,
    GatewayResponse NVARCHAR(500),
    ProcessedAt DATETIME2 NOT NULL,
    Metadata NVARCHAR(MAX)
);

CREATE TABLE Analytics (
    EventId NVARCHAR(50) PRIMARY KEY,
    EventType NVARCHAR(100) NOT NULL,
    Data NVARCHAR(MAX),
    Source NVARCHAR(50),
    Timestamp DATETIME2 NOT NULL
);

CREATE INDEX IX_Transactions_OrderId ON Transactions(OrderId);
CREATE INDEX IX_Transactions_UserId ON Transactions(UserId);
CREATE INDEX IX_Analytics_EventType ON Analytics(EventType);
```

## Step 4: Configure Inter-Cloud Communication

### 4.1 Update AWS Lambda Environment Variables
```bash
aws lambda update-function-configuration \
  --function-name product-service \
  --environment Variables='{
    "PRODUCTS_TABLE":"products",
    "AZURE_ENDPOINT":"https://your-azure-function-app.azurewebsites.net",
    "JWT_SECRET":"your-super-secret-jwt-key"
  }'

aws lambda update-function-configuration \
  --function-name order-service \
  --environment Variables='{
    "ORDERS_TABLE":"orders",
    "USERS_TABLE":"users",
    "AZURE_ENDPOINT":"https://your-azure-function-app.azurewebsites.net",
    "JWT_SECRET":"your-super-secret-jwt-key"
  }'
```

### 4.2 Update Azure Function App Settings
```bash
az functionapp config appsettings set \
  --resource-group multicloud-rg \
  --name your-function-app-name \
  --settings \
    "SQL_SERVER=your-sql-server.database.windows.net" \
    "SQL_DATABASE=ecommerce" \
    "SQL_USER=sqladmin" \
    "SQL_PASSWORD=YourSecurePassword123!" \
    "JWT_SECRET=your-super-secret-jwt-key" \
    "AWS_ENDPOINT=https://your-api-gateway-url.amazonaws.com/dev"
```

## Step 5: Deploy Demo Application

### 5.1 Configure Frontend Environment
Create `demo/frontend/.env`:
```bash
REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com/dev
REACT_APP_AZURE_URL=https://your-azure-function-app.azurewebsites.net/api
```

### 5.2 Build and Deploy Frontend
```bash
cd demo/frontend

# Build production version
npm run build

# Deploy to S3 (optional)
aws s3 sync build/ s3://your-static-website-bucket --delete

# Or serve locally for demo
npm start
```

## Step 6: Testing and Validation

### 6.1 Test AWS Services
```bash
# Test product service
curl -X GET https://your-api-gateway-url.amazonaws.com/dev/products

# Test order creation
curl -X POST https://your-api-gateway-url.amazonaws.com/dev/orders \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "items": [{"product_id": "1", "quantity": 1, "price": 99.99}],
    "total_amount": 99.99,
    "payment_method": "credit_card"
  }'
```

### 6.2 Test Azure Services
```bash
# Test payment processing
curl -X POST https://your-azure-function-app.azurewebsites.net/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test_order",
    "amount": 99.99,
    "payment_method": "credit_card",
    "customer_id": "test_user"
  }'

# Test notifications
curl -X POST https://your-azure-function-app.azurewebsites.net/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "type": "order_confirmed",
    "data": {"order_id": "test_order", "amount": 99.99}
  }'
```

### 6.3 Test Inter-Cloud Communication
1. Create a product via AWS API Gateway
2. Place an order (should trigger Azure payment processing)
3. Verify transaction is stored in Azure SQL Database
4. Check that notifications are sent via Azure Functions

## Step 7: Monitoring and Logging

### 7.1 AWS CloudWatch
- Monitor Lambda function metrics
- Set up alarms for error rates
- Configure log retention policies

### 7.2 Azure Monitor
- Monitor Function App performance
- Set up alerts for SQL Database
- Configure Application Insights

### 7.3 Cross-Cloud Monitoring
```bash
# Create unified dashboard combining both cloud metrics
# Use tools like Grafana or custom dashboards
```

## Troubleshooting

### Common Issues

#### 1. CORS Errors
- Ensure API Gateway has CORS enabled
- Check Azure Function CORS settings

#### 2. Authentication Failures
- Verify JWT secrets match across services
- Check API key configurations

#### 3. Database Connection Issues
- Verify SQL Database firewall rules
- Check connection strings and credentials

#### 4. Network Connectivity
- Ensure security groups allow inter-service communication
- Verify DNS resolution between clouds

### Debugging Commands
```bash
# AWS Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/"

# Azure Function logs
az monitor log-analytics query \
  --workspace your-workspace-id \
  --analytics-query "traces | limit 50"

# Test connectivity
curl -v https://your-api-endpoint.com/health
```

## Security Considerations

### 1. Network Security
- Use VPC peering between AWS and Azure
- Implement WAF on both platforms
- Enable HTTPS/TLS for all communications

### 2. Authentication & Authorization
- Rotate JWT secrets regularly
- Use managed identities where possible
- Implement proper RBAC

### 3. Data Protection
- Enable encryption at rest and in transit
- Implement proper backup strategies
- Use secrets management services

## Cost Optimization

### 1. Resource Sizing
- Use appropriate instance sizes
- Implement auto-scaling
- Monitor and optimize regularly

### 2. Storage Optimization
- Use appropriate storage tiers
- Implement lifecycle policies
- Regular cleanup of unused resources

### 3. Network Costs
- Minimize cross-region data transfer
- Use CDN for static content
- Optimize API call patterns

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and rotate secrets quarterly
- Performance testing quarterly
- Disaster recovery testing bi-annually

### Monitoring Checklist
- [ ] All services responding correctly
- [ ] Cross-cloud communication working
- [ ] Database connections stable
- [ ] Authentication working properly
- [ ] Monitoring and alerting active
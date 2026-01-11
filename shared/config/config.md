# Multi-Cloud Configuration

## Environment Variables Template
Copy this to `.env` file and update with your actual values:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
AWS_API_URL=https://your-api-gateway-url.amazonaws.com/dev
AWS_API_KEY=your-aws-api-key

# Azure Configuration
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_RESOURCE_GROUP=multicloud-rg
AZURE_LOCATION=eastus
AZURE_API_URL=https://your-azure-function-app.azurewebsites.net/api
AZURE_API_KEY=your-azure-api-key

# Shared Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
PROJECT_NAME=multicloud-ecommerce
ENVIRONMENT=dev

# Database Configuration
SQL_SERVER=your-sql-server.database.windows.net
SQL_DATABASE=ecommerce
SQL_USER=sqladmin
SQL_PASSWORD=YourSecurePassword123!

# External Services
STRIPE_SECRET_KEY=sk_test_your_stripe_key
SENDGRID_API_KEY=SG.your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# Monitoring
DATADOG_API_KEY=your_datadog_key
NEW_RELIC_LICENSE_KEY=your_newrelic_key
```

## Service Endpoints

### AWS Services
- **API Gateway**: `https://{api-id}.execute-api.{region}.amazonaws.com/{stage}`
- **Lambda Functions**: Invoked via API Gateway
- **DynamoDB**: Regional endpoint
- **S3**: `https://s3.{region}.amazonaws.com`

### Azure Services
- **Function App**: `https://{function-app-name}.azurewebsites.net`
- **SQL Database**: `{server-name}.database.windows.net`
- **Service Bus**: `{namespace}.servicebus.windows.net`
- **Storage Account**: `https://{account-name}.blob.core.windows.net`

## Security Configuration

### CORS Settings
```json
{
  "allowedOrigins": [
    "http://localhost:3000",
    "https://your-domain.com"
  ],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allowedHeaders": ["Content-Type", "Authorization", "X-API-Key"],
  "maxAge": 86400
}
```

### JWT Configuration
```json
{
  "issuer": "multi-cloud-auth",
  "audience": ["aws-services", "azure-services"],
  "expiresIn": "24h",
  "algorithm": "HS256"
}
```

## Resource Naming Conventions

### AWS Resources
- **Lambda Functions**: `{project}-{service}-{environment}`
- **DynamoDB Tables**: `{project}-{table-name}-{environment}`
- **S3 Buckets**: `{project}-{purpose}-{environment}-{random-suffix}`
- **API Gateway**: `{project}-api-{environment}`

### Azure Resources
- **Resource Group**: `{project}-rg-{environment}`
- **Function App**: `{project}-functions-{environment}`
- **SQL Server**: `{project}-sql-{environment}`
- **Service Bus**: `{project}-sb-{environment}`

## Monitoring and Alerting

### CloudWatch Alarms (AWS)
- Lambda error rate > 5%
- API Gateway 4xx/5xx errors > 10%
- DynamoDB throttling events
- High latency alerts

### Azure Monitor Alerts
- Function App failures > 5%
- SQL Database DTU > 80%
- Service Bus dead letter queue messages
- High response time alerts

## Cost Management

### AWS Cost Allocation Tags
```json
{
  "Project": "multi-cloud-ecommerce",
  "Environment": "dev|staging|prod",
  "Owner": "team-name",
  "CostCenter": "engineering"
}
```

### Azure Resource Tags
```json
{
  "project": "multi-cloud-ecommerce",
  "environment": "dev|staging|prod",
  "owner": "team-name",
  "cost-center": "engineering"
}
```

## Backup and Disaster Recovery

### Backup Schedule
- **DynamoDB**: Point-in-time recovery enabled
- **Azure SQL**: Automated backups (7-day retention)
- **S3**: Cross-region replication
- **Azure Storage**: Geo-redundant storage

### Recovery Objectives
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **Cross-cloud failover**: Manual process (15 minutes)

## Performance Targets

### Response Time SLAs
- **Product API**: < 200ms (95th percentile)
- **Order API**: < 500ms (95th percentile)
- **Payment API**: < 1000ms (95th percentile)
- **Notification API**: < 100ms (95th percentile)

### Throughput Targets
- **Product reads**: 1000 RPS
- **Order creation**: 100 RPS
- **Payment processing**: 50 RPS
- **Notifications**: 500 RPS
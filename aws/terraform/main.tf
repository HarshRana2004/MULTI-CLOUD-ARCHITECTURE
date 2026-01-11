terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# DynamoDB Tables
resource "aws_dynamodb_table" "products" {
  name           = "products"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "product_id"

  attribute {
    name = "product_id"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Project     = "multi-cloud-ecommerce"
  }
}

resource "aws_dynamodb_table" "users" {
  name           = "users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Project     = "multi-cloud-ecommerce"
  }
}

# S3 Buckets
resource "aws_s3_bucket" "product_images" {
  bucket = "${var.project_name}-product-images-${random_id.bucket_suffix.hex}"
}

resource "aws_s3_bucket" "static_assets" {
  bucket = "${var.project_name}-static-assets-${random_id.bucket_suffix.hex}"
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_role" {
  name = "multi-cloud-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "multi-cloud-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "*"
      }
    ]
  })
}

# API Gateway
resource "aws_api_gateway_rest_api" "main" {
  name        = "multi-cloud-api"
  description = "Multi-cloud e-commerce API"
}

# Lambda Functions
resource "aws_lambda_function" "product_service" {
  filename         = "../lambda/product-service.zip"
  function_name    = "product-service"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"

  environment {
    variables = {
      PRODUCTS_TABLE = aws_dynamodb_table.products.name
      AZURE_ENDPOINT = var.azure_endpoint
    }
  }
}

resource "aws_lambda_function" "order_service" {
  filename         = "../lambda/order-service.zip"
  function_name    = "order-service"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"

  environment {
    variables = {
      USERS_TABLE    = aws_dynamodb_table.users.name
      AZURE_ENDPOINT = var.azure_endpoint
    }
  }
}

# API Gateway Integration
resource "aws_api_gateway_resource" "products" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "products"
}

resource "aws_api_gateway_method" "products_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.products.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "products_integration" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.products.id
  http_method = aws_api_gateway_method.products_get.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.product_service.invoke_arn
}

# Outputs
output "api_gateway_url" {
  value = aws_api_gateway_rest_api.main.execution_arn
}

output "dynamodb_tables" {
  value = {
    products = aws_dynamodb_table.products.name
    users    = aws_dynamodb_table.users.name
  }
}
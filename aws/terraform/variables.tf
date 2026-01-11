variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "multicloud-ecommerce"
}

variable "azure_endpoint" {
  description = "Azure Functions endpoint URL"
  type        = string
  default     = "https://your-azure-function-app.azurewebsites.net"
}
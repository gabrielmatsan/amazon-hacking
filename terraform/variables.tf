variable "region" {
  type        = string
  description = "The AWS region"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "The deployment environment"
  default     = "production"
}

variable "project_name" {
  type        = string
  description = "The project name (used for resource naming)"
  default     = "my-app"
}

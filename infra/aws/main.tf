terraform {
  required_version = ">= 1.6.0"
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-west-2"
}

resource "aws_s3_bucket" "artifacts" {
  bucket = "common-commute-artifacts-example"
}

resource "aws_sqs_queue" "task_queue" {
  name = "common-commute-task-queue"
}

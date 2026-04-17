# AWS starter architecture

This is a lightweight starting point for a cost-aware Common Commute deployment.

## Recommended first deployment
- Cloudflare: DNS, CDN, WAF, static downloads
- AWS ECS/Fargate or Lambda: API and scheduler
- AWS RDS Postgres or Aurora Serverless: transactional DB
- S3: artifacts and exports
- SQS: task/event queues
- Secrets Manager: secrets
- CloudWatch: logs/metrics

## Suggested service mapping
- `auth-api`: FastAPI auth + users
- `marketplace-api`: jobs, devices, ledger
- `scheduler-worker`: task packaging and dispatch
- `settlement-worker`: payout accounting and reconciliation

## Notes
This repo keeps infra intentionally thin so you can swap AWS for Azure or a hybrid edge architecture later.

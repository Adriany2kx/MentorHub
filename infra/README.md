# MentorHub Infrastructure

AWS infrastructure for MentorHub using Terraform.

## Prerequisites

- AWS CLI configured with admin credentials
- Terraform >= 1.5
- Domain name with DNS access

## Quick Start

```bash
cd infra/terraform

# 1. Copy and fill in variables
cp ../terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 2. Initialize Terraform
terraform init

# 3. Review changes
terraform plan

# 4. Apply
terraform apply
```

## Post-Apply Steps

### 1. Validate ACM Certificate

Add the CNAME record shown in AWS Console to your DNS:

```
Name:  _abc123.api.yourdomain.com
Value: _xyz789.acm-validations.aws
```

### 2. Set Secrets

```bash
aws secretsmanager put-secret-value \
  --secret-id mentorhub/app-secrets \
  --secret-string '{
    "DATABASE_URL": "postgresql://mentorhub:PASSWORD@RDS_ENDPOINT:5432/mentorhub?sslmode=require",
    "SESSION_SECRET": "generate-a-32-char-random-string",
    "FRONTEND_URL": "https://yourdomain.com",
    "RESEND_API_KEY": "re_xxx",
    "GEMINI_API_KEY": "xxx",
    "SENTRY_DSN": "https://xxx@sentry.io/xxx",
    "CLERK_SECRET_KEY": "sk_xxx"
  }'
```

### 3. Configure GitHub Actions

Add repository secret:
- `AWS_ROLE_ARN`: Output from `terraform output github_actions_role_arn`

### 4. Create DNS Records

Point your domain to the ALB:
- `api.yourdomain.com` → ALB DNS name (CNAME)

## Architecture

```
Internet → ALB (HTTPS) → ECS Fargate → RDS PostgreSQL
                           ↓
                         S3 (uploads)
```

## Cost Breakdown (~$40-50/mo)

| Service | Estimated |
|---------|-----------|
| RDS t3.micro | $12/mo |
| NAT Gateway | $32/mo |
| ALB | $16/mo |
| ECS Fargate | $5/mo |
| S3/ECR | $1/mo |

Note: NAT Gateway is the biggest cost. Consider NAT instance for <$10/mo.

## Destroying Infrastructure

```bash
# Disable deletion protection first
aws rds modify-db-instance \
  --db-instance-identifier mentorhub-db \
  --no-deletion-protection

terraform destroy
```

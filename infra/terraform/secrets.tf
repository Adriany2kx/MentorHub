resource "aws_secretsmanager_secret" "app" {
  name                    = "${var.project_name}/app-secrets"
  recovery_window_in_days = 7

  tags = { Name = "${var.project_name}-secrets" }
}

# Secret values are set manually via AWS Console or CLI:
# aws secretsmanager put-secret-value --secret-id mentorhub/app-secrets --secret-string '{
#   "DATABASE_URL": "postgresql://...",
#   "SESSION_SECRET": "...",
#   "FRONTEND_URL": "https://...",
#   "RESEND_API_KEY": "...",
#   "GEMINI_API_KEY": "...",
#   "SENTRY_DSN": "...",
#   "CLERK_SECRET_KEY": "..."
# }'

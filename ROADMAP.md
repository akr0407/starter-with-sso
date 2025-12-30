# SaaS Starter Roadmap

Features and ideas for future development.

## 🔥 High Priority (Common SaaS Needs)
| Feature | Description |
|---------|-------------|
| **Notifications System** | In-app notifications (bell icon) + optional email digests. Store in DB, show unread count. |
| **Billing/Subscription** | Integrate Stripe/Paddle. Add `plans` table, `subscriptions` table, and billing portal page. |
| **Team Invitations** | Invite users to organizations via email link with expiring tokens. |
| **Two-Factor Auth (2FA)** | TOTP-based 2FA using `otpauth` library. Add recovery codes. |
| **File Uploads** | S3/R2 integration for avatars, attachments. Add file management UI. |
| **Magic Link Login** | Passwordless authentication via email. |
| **API Keys** | Allow users to generate API keys for programmatic access. |

## 🎨 UX Enhancements
| Feature | Description |
|---------|-------------|
| **Onboarding Flow** | ✅ Step-by-step wizard for new users (create org → add project → invite team). |
| **Keyboard Shortcuts** | Beyond Cmd+K: `g d` for Dashboard, `g s` for Settings, etc. |
| **Breadcrumb Navigation** | ✅ Dynamic breadcrumbs based on route hierarchy. |
| **Toast Notifications** | ✅ Global success/error toasts for API actions. |

## 🛠️ Developer Experience
| Feature | Description |
|---------|-------------|
| **API Rate Limiting** | Protect endpoints with configurable rate limits per user/IP. |
| **Webhook System** | Allow users to register webhooks for events (org.created, project.updated). |
| **Background Jobs** | Queue system for emails, reports, etc. (e.g., `bullmq` + Redis). |
| **E2E Tests** | Playwright tests for critical flows (login, CRUD). |

## 📊 Analytics & Insights
| Feature | Description |
|---------|-------------|
| **Usage Dashboard** | Charts showing API calls, storage used, active users over time. |
| **Export Data** | CSV/JSON export for tables (organizations, projects, audit logs). |

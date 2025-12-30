# SaaS Starter Kit

A production-ready SaaS boilerplate built with Nuxt 4, Naive UI, Drizzle ORM, and PostgreSQL.

## Features

### Core
- **Nuxt 4** with the new `app/` directory structure
- **Naive UI** component library with custom theming
- **PostgreSQL** database with Drizzle ORM
- **TypeScript** throughout

### Authentication
- JWT-based authentication with access and refresh tokens
- Email/password registration and login
- Role-based access control (User, Admin, Superadmin)
- Superadmin user impersonation

### UI/UX
- Dark and light mode support
- Customizable accent colors (6 presets)
- User-saved theme preferences
- Responsive sidebar layout with **Glassmorphism** styling
- **Global Command Palette** (Cmd+K) for quick navigation
- **Data Visualization** using Chart.js
- **Internationalization (i18n)** support (EN, ES, ZH, ID)
- Clean, modern design inspired by Google Antigravity/Vercel

### API
- RESTful API with versioning (`/api/v1/`)
- OpenAPI 3.0 documentation with Swagger UI
- Comprehensive audit logging

### Database
- Drizzle ORM with type-safe queries
- Database seeding with sample data
- Migration support

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd saas-starter
```

2. Install dependencies
```bash
npm install
```

3. Configure environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Set up the database
```bash
npm run db:push
npm run db:seed
```

5. Start development server
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Default Users

After seeding, these accounts are available:

| Email | Password | Role |
|-------|----------|------|
| superadmin@example.com | password123 | Superadmin |
| admin@example.com | password123 | Admin |
| user@example.com | password123 | User |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:push` | Push schema changes to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed database with sample data |

---

## Project Structure

```
saas-starter/
├── app/
│   ├── assets/css/       # Global styles
│   ├── composables/      # Vue composables (useAuth, useApi)
│   ├── layouts/          # Layout components
│   ├── middleware/       # Route middleware
│   ├── pages/            # Page components
│   └── utils/            # Theme utilities
├── server/
│   ├── api/v1/           # API endpoints
│   ├── db/
│   │   ├── schema/       # Drizzle schema definitions
│   │   ├── migrations/   # Database migrations
│   │   └── seed/         # Seeding scripts
│   └── utils/            # Server utilities (auth, db, audit)
└── drizzle.config.ts     # Drizzle configuration
```

---

## API Documentation

Swagger UI is available at `/api-docs` when the server is running.

OpenAPI JSON: `/api/openapi.json`

---

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |

---

## License

MIT

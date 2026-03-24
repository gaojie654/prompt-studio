# Prompt Studio Backend

## Tech Stack
- Node.js 20
- Express 4
- Prisma 5
- PostgreSQL 15
- Redis 7
- JWT + Bull + Zod

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## API Routes

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Authentication |
| `/api/users` | User management |
| `/api/prompts` | Prompt management |
| `/api/images` | Image management |
| `/api/orders` | Order management |
| `/api/memberships` | Membership management |

## Scripts

- `npm run dev` - Development mode with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prisma:studio` - Open Prisma Studio
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

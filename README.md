# Expense Manager — Full-Stack (React + Express + PostgreSQL + Prisma + JWT)

## Architecture Overview

```
ExpenseManage-main/
├── server.js                  # Express app entry point
├── .env                       # Environment variables (DO NOT COMMIT)
├── prisma/
│   └── schema.prisma          # PostgreSQL schema (User, Transaction, Budget)
├── config/
│   └── prisma.js              # Prisma client singleton
├── middleware/
│   ├── authMiddleware.js      # JWT Bearer token protection
│   └── validateMiddleware.js  # express-validator rule sets
├── services/
│   ├── authService.js         # Auth business logic (bcrypt, JWT)
│   ├── transactionService.js  # Transaction CRUD + summary
│   └── budgetService.js       # Budget CRUD (upsert)
├── controllers/
│   ├── userController.js      # Auth controller
│   ├── transactionController.js
│   └── budgetController.js
├── routes/
│   ├── userRoute.js           # /api/v1/auth/*
│   ├── transactionRoute.js    # /api/v1/transactions/*
│   └── budgetRoute.js         # /api/v1/budgets/*
├── utils/
│   ├── errorHandler.js        # ApiError class + asyncHandler + errorHandler middleware
│   └── jwt.js                 # generateToken / verifyToken
└── client/                    # React frontend
    └── src/
        ├── contexts/AuthContext.js      # Auth state + actions
        ├── hooks/
        │   ├── useTransactions.js
        │   └── useBudgets.js
        ├── services/api.js              # Axios instance + API modules
        └── pages/ components/           # UI (unchanged structure)
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/v1/auth/register | ❌ | Register new user |
| POST | /api/v1/auth/login | ❌ | Login + get JWT |
| GET | /api/v1/auth/profile | ✅ | Get current user |
| POST | /api/v1/auth/logout | ✅ | Logout (stateless ack) |
| GET | /api/v1/transactions | ✅ | List transactions (filterable) |
| GET | /api/v1/transactions/summary | ✅ | Income/expense/balance totals |
| POST | /api/v1/transactions | ✅ | Create transaction |
| PUT | /api/v1/transactions/:id | ✅ | Update transaction |
| DELETE | /api/v1/transactions/:id | ✅ | Delete transaction |
| GET | /api/v1/budgets | ✅ | List budgets |
| POST | /api/v1/budgets | ✅ | Create/update budget |
| DELETE | /api/v1/budgets/:id | ✅ | Delete budget |

## Setup

### Prerequisites
- Node.js >= 18
- PostgreSQL running locally

### 1. Configure environment

Edit `.env` in the project root:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/expense_manager?schema=public"
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

### 2. Install dependencies

```bash
# Root (backend)
npm install

# Frontend
cd client && npm install
```

### 3. Create database & run migrations

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:migrate
```

### 4. Run the app

```bash
# Start both frontend and backend concurrently
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api/v1
- **Prisma Studio** (DB browser): `npm run db:studio`

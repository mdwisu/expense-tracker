# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Expense Tracker adalah aplikasi berbasis Next.js untuk mengelola keuangan pribadi dengan fokus pada pencatatan pengeluaran dan pemasukan. Aplikasi ini menggunakan bahasa Indonesia untuk UI dan menggunakan mata uang IDR (Indonesian Rupiah).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite dengan Prisma ORM
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Runtime**: Node.js dengan tsx untuk seeding

## Development Commands

```bash
# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Seed database with default categories
npm run seed
```

## Database Setup

1. Ensure DATABASE_URL is set in `.env` file (SQLite by default)
2. Run Prisma migrations: `npx prisma migrate dev`
3. Seed default categories: `npm run seed`
4. Generate Prisma client: `npx prisma generate`

## Architecture

### Data Models (prisma/schema.prisma)

- **Category**: Pre-defined spending categories with icon and color
- **Expense**: Spending records linked to categories
- **Income**: Income records (no category association)

### API Routes (app/api/)

RESTful endpoints using Next.js Route Handlers:

- `/api/expenses` - GET (with month/year filters), POST, PUT, DELETE
- `/api/income` - GET (with month/year filters), POST, PUT, DELETE
- `/api/categories` - GET all categories
- `/api/stats` - GET financial statistics (totalIncome, totalExpenses, balance, categoryStats)

### Client Components

- `app/page.tsx` - Main dashboard with month/year filtering
- `app/components/AddExpenseForm.tsx` - Modal form for adding/editing expenses
- `app/components/AddIncomeForm.tsx` - Modal form for adding/editing income

### Database Connection

Prisma client is instantiated in `lib/prisma.ts` using a singleton pattern to prevent multiple instances in development (hot reload).

## Key Patterns

### Month/Year Filtering

Stats and transactions are filtered by month/year using date ranges:
- Start: `new Date(year, month - 1, 1)`
- End: `new Date(year, month, 0, 23, 59, 59)`

### Currency Formatting

Use Indonesian locale (id-ID) with IDR currency, no decimal places:
```typescript
new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
})
```

### Category System

Categories are seeded with predefined data (8 categories) using `npm run seed`. Each category has:
- name (Indonesian)
- icon (emoji)
- color (hex code for UI visualization)

Categories should remain relatively static; expenses reference them via `categoryId`.

## Important Notes

- All user-facing text should be in Indonesian
- Dates use Indonesian locale (id-ID) for formatting
- The app uses client-side rendering (`'use client'`) for the main page
- Stats calculation includes category-wise breakdowns with percentages
- Edit functionality reuses AddExpenseForm component with expense prop

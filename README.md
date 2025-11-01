# 🎯 English Auction Management System

A full-stack Next.js application for managing English auctions with real-time bidder tracking, wildcard multipliers, and comprehensive leaderboard system.

## ✨ Features

- **Public Dashboard**: Live auction data with real-time updates (auto-refresh every 3 seconds)
- **Leaderboard System**: Ranked by qualification status → total utility → remaining budget
- **Wildcard System**: Theme-specific multipliers that dynamically affect player scores
- **Admin Panel**: Secure management interface for recording sales and managing data
- **Category Tracking**: Hostels, Clubs, Dating Preference, and Friend Type
- **Qualification Rules**: Min/max item requirements per category + total items (7-10)
- **Budget Management**: ₹200M per player with real-time budget tracking

## 🚀 Quick Start

### Option 1: Docker (Recommended for Deployment)

**Easiest way - everything auto-configured:**

```bash
# Start with Docker
docker-compose up -d

# Access at http://localhost:3000
```

Database, migrations, and sample data are set up automatically!

See [DOCKER.md](DOCKER.md) for complete deployment guide.

### Option 2: Local Development

**Prerequisites:** Node.js 18+ installed

```bash
# Clone or download the project
cd auction-app

# Install dependencies
npm install

# Setup database and seed sample data
npx prisma generate
npx prisma db push
npm run db:seed

# Start development server
npm run dev
```

Visit:
- **Public Dashboard**: http://localhost:3001
- **Admin Panel**: http://localhost:3001/admin (password: `admin123`) 

## 📊 System Overview

### Qualification Requirements

Players must purchase:
- **Hostels**: 1-3 items
- **Clubs**: 2-4 items  
- **Dating**: 1-2 items
- **Friends**: 2-4 items
- **Total**: 7-10 items overall

### Leaderboard Sorting

Ranked by:
1. **Qualification Status** (qualified players first)
2. **Total Utility** (higher is better)
3. **Remaining Budget** (higher is better)

### Wildcard System

Wildcards multiply theme-specific utilities:
- Each player tracks utilities per theme (Hostels, Clubs, Dating, Friends)
- Wildcards apply multipliers (e.g., 2.0x, 1.5x) to specific themes
- Multiple wildcards stack multiplicatively (2.0x × 1.3x = 2.6x)
- Total utility = Σ(theme utility × theme multiplier)
- **Qualification bonus**: Multiplier > 1.0 auto-qualifies for that theme

**Example:**
- Player has: 100 Hostels utility, 50 Clubs utility
- Buys wildcard: 2.0x Hostels, 1.5x Clubs
- New total: (100 × 2.0) + (50 × 1.5) = 275 utility

## 🎮 Usage

### Public Dashboard

- View live leaderboard with player rankings
- See item listings by category (sold/available)
- Track bidder budgets and purchases
- Wildcard indicators (🎴) show active multipliers

### Admin Dashboard

#### Record Sales Tab
1. Select item from dropdown
2. Choose winning bidder
3. Enter sold price
4. Click "Record Sale"
5. Can undo sales if needed

#### Wildcards Tab
1. Enter wildcard name and price
2. Select player
3. Set multipliers for each theme (1.0 = no effect)
4. Optional: Mark "Counts As Theme" for qualification
5. Click "Create Wildcard"

#### Manage Items/Bidders
- Edit item details (name, category, utility, price)
- Modify bidder information
- Import/Export JSON data

#### Data Management
- **Export**: Download all auction data as JSON
- **Reset**: Clear all sales and wildcards, reset budgets

## 🗂️ Sample Data

Includes:
- **67 items** across 4 categories (Hostels: 13, Clubs: 20, Dating: 14, Friends: 20)
- **16 bidders** with ₹200M initial budget each
- Test scenarios for leaderboard verification

Run test script for demo data:
```bash
npx tsx scripts/test-leaderboard.ts
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router + Turbopack
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: Simple password-based admin access

## � API Endpoints

- `GET /api/items` - All items
- `GET /api/bidders` - All bidders with stats
- `GET /api/wildcards` - All wildcards
- `POST /api/sales` - Record sale
- `DELETE /api/sales?itemId=xxx` - Undo sale
- `POST /api/wildcards` - Create wildcard
- `DELETE /api/wildcards?wildcardId=xxx` - Remove wildcard
- `POST /api/reset-auction` - Reset auction data

## 🔧 Configuration

### Change Admin Password

Edit `app/admin/page.tsx`:
```typescript
if (password === 'your-new-password') {
  // ...
}
```

### Modify Category Limits

Edit category limits in:
- `app/api/sales/route.ts`
- `app/api/wildcards/route.ts`

```typescript
const CATEGORY_LIMITS = {
  Hostels: { min: 1, max: 3 },
  Clubs: { min: 2, max: 4 },
  Dating: { min: 1, max: 2 },
  Friends: { min: 2, max: 4 },
};
```

### Customize Initial Budgets

Edit `prisma/seed.ts`:
```typescript
initialBudget: 200, // Change amount (in millions)
```

## 🧪 Testing

Run the leaderboard test script:
```bash
npx tsx scripts/test-leaderboard.ts
```

This creates 5 test scenarios demonstrating:
- Qualified players with different utilities
- Non-qualified players (missing items, wrong counts)
- Proper leaderboard sorting

## � Troubleshooting

**Database errors?**
```bash
npx prisma generate
npx prisma db push
```

**Port 3000 already in use?**
The app will automatically use port 3001

**Wildcards not calculating correctly?**
Ensure theme utilities are populated - re-run test script or reset auction

**Data not refreshing?**
Public page auto-refreshes every 3 seconds - check browser console for errors

## 📄 License

MIT

---

**Ready to run your auction! 🎉**

Quick start: `npm install && npx prisma db push && npm run db:seed && npm run dev`

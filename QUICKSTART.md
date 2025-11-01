# 🚀 Quickstart Guide

Get the auction system running in 3 minutes.

## 🐳 Docker (Recommended)

**Fastest way - everything automatic:**

```bash
# Start the application
docker-compose up -d

# View logs (optional)
docker-compose logs -f

# Stop the application
docker-compose down
```

**That's it!** Access at http://localhost:3000

Everything is set up automatically:
- ✅ Database created
- ✅ Sample data loaded (67 items + 16 bidders)
- ✅ Server running

See [DOCKER.md](DOCKER.md) for deployment options.

---

## 💻 Local Development

### Prerequisites

- Node.js 18+ installed
- npm package manager

### Setup Steps

```bash
# 1. Navigate to project directory
cd auction-app

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Create database
npx prisma db push

# 5. Load sample data (67 items + 16 bidders)
npm run db:seed

# 6. Start development server
npm run dev
```

## Access Points

**Public Dashboard**: http://localhost:3001
- Live leaderboard
- Item listings
- Real-time updates (auto-refresh every 3s)

**Admin Panel**: http://localhost:3001/admin
- Record sales
- Manage wildcards
- Export/Import data

## Test Data (Optional)

Create demo auction scenarios with 5 test players:

```bash
npx tsx scripts/test-leaderboard.ts
```

This creates:
- **P01**: Qualified player with high utility (651)
- **P02**: Qualified player with medium utility (622)
- **P03**: Non-qualified (missing Dating items)
- **P04**: Non-qualified (wrong category counts)
- **P05**: Non-qualified (total items < 7)

## Key Commands

```bash
# View database in browser
npx prisma studio

# Reset auction (clears sales & wildcards)
# Use "Reset Auction Data" button in Admin Panel

# Check database manually
sqlite3 prisma/dev.db
```

## System Rules

### Qualification Requirements
- Hostels: 1-3 items
- Clubs: 2-4 items
- Dating: 1-2 items
- Friends: 2-4 items
- Total: 7-10 items

**OR** have any wildcard multiplier > 1.0 for that theme

### Leaderboard Ranking
1. Qualified players first
2. Higher total utility
3. Higher remaining budget

### Wildcard Mechanics
- Multiply theme-specific utilities
- Stack multiplicatively (2.0x × 1.3x = 2.6x)
- Multiplier > 1.0 auto-qualifies for theme

## Quick Admin Tasks

### Record a Sale
1. Go to "Record Sales" tab
2. Select item + bidder
3. Enter price
4. Click "Record Sale"

### Create Wildcard
1. Go to "Wildcards" tab
2. Enter name, price, select player
3. Set multipliers (e.g., 2.0 for Hostels)
4. Click "Create Wildcard"

### Export Data
1. Go to "Manage Bidders" tab
2. Click "Export All Data"
3. Saves JSON file

## Troubleshooting

**Port 3000 in use?**
→ App auto-switches to 3001

**Database errors?**
```bash
npx prisma generate
npx prisma db push
```

**Missing data?**
```bash
npm run db:seed
```

**Wildcards not working?**
→ Run test script to populate theme utilities:
```bash
npx tsx scripts/test-leaderboard.ts
```

---

**You're ready! 🎉** Visit http://localhost:3001 to see the auction dashboard.

#!/bin/bash

echo "🚀 Setting up English Auction App with Database..."
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed"
    echo "Please install PostgreSQL 15+ first:"
    echo "  macOS: brew install postgresql@15"
    echo "  Linux: sudo apt-get install postgresql-15"
    exit 1
fi

echo "✅ PostgreSQL found"

# Install Node dependencies
echo ""
echo "📦 Installing dependencies..."
npm install prisma @prisma/client tsx

# Check if .env exists and has DATABASE_URL
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  No .env file found. Creating one..."
    echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auction_db?schema=public"' > .env
    echo "✅ Created .env file with default PostgreSQL connection"
    echo "   If your PostgreSQL uses different credentials, edit .env file"
fi

echo ""
echo "🗄️  Setting up database..."

# Try to create database (may fail if already exists, that's ok)
echo ""
echo "Creating database 'auction_db' (ignore error if already exists)..."
createdb auction_db 2>/dev/null || echo "  Database may already exist, continuing..."

# Generate Prisma Client
echo ""
echo "Generating Prisma Client..."
npx prisma generate

# Push schema to database
echo ""
echo "Pushing schema to database..."
npx prisma db push --accept-data-loss

# Seed database
echo ""
echo "Seeding database with sample data..."
npm run db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎉 Next steps:"
echo "  1. Review .env file and update DATABASE_URL if needed"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:3000"
echo "  4. Admin: http://localhost:3000/admin
echo ""
echo "📊 Your database now has:"
echo "  • 60 items (15 per category)"
echo "  • 16 bidders with ₹10,000 each"
echo "  • Real-time updates enabled"
echo "  • Total utility tracking"
echo ""

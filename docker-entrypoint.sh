#!/bin/sh
set -e

echo "🚀 Starting Auction App..."

# Create data directory and set permissions (run as root)
mkdir -p /app/data
chown -R nextjs:nodejs /app/data

# Copy database to data directory if it doesn't exist
if [ ! -f /app/data/dev.db ]; then
    echo "📦 Initializing database..."
    
    # Set database path for Prisma
    export DATABASE_URL="file:/app/data/dev.db"
    
    # Switch to nextjs user for database operations
    su-exec nextjs sh << 'EOF'
    export DATABASE_URL="file:/app/data/dev.db"
    
    # Push database schema
    npx prisma db push --skip-generate
    
    # Run the existing seed file
    npx tsx /app/prisma/seed.ts
EOF
    
    echo "✅ Database initialized!"
else
    echo "✅ Database already exists"
fi

# Start the application as nextjs user
echo "🎯 Starting Next.js server..."
exec su-exec nextjs "$@"

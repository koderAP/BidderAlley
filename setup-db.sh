#!/bin/bash

echo "Setting up English Auction Database..."

# Install dependencies
echo "Installing Prisma..."
npm install prisma @prisma/client

# Initialize database (you need to update .env with your actual PostgreSQL credentials)
echo "Initializing Prisma..."
npx prisma generate

# Create database and run migrations
echo "Running database migrations..."
npx prisma db push

# Seed database with sample data
echo "Seeding database..."
npx prisma db seed

echo "Setup complete! Update your .env file with actual database credentials."
echo "DATABASE_URL=\"postgresql://user:password@localhost:5432/auction_db?schema=public\""

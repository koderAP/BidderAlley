-- Supabase PostgreSQL Migration Script
-- Stratezenith Final — Tactical Auction System
-- Run this against your Supabase database to create all tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables (if re-running)
DROP TABLE IF EXISTS "Wildcard" CASCADE;
DROP TABLE IF EXISTS "Item" CASCADE;
DROP TABLE IF EXISTS "Bidder" CASCADE;

-- Create Bidder table
CREATE TABLE "Bidder" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "initialBudget" INTEGER NOT NULL,
  "remainingBudget" INTEGER NOT NULL DEFAULT 0,
  "totalUtility" INTEGER NOT NULL DEFAULT 0,
  "isQualified" BOOLEAN NOT NULL DEFAULT false,
  "hostelsCount" INTEGER NOT NULL DEFAULT 0,
  "clubsCount" INTEGER NOT NULL DEFAULT 0,
  "datingCount" INTEGER NOT NULL DEFAULT 0,
  "friendsCount" INTEGER NOT NULL DEFAULT 0,
  "totalItems" INTEGER NOT NULL DEFAULT 0,
  "hostelsUtility" INTEGER NOT NULL DEFAULT 0,
  "clubsUtility" INTEGER NOT NULL DEFAULT 0,
  "datingUtility" INTEGER NOT NULL DEFAULT 0,
  "friendsUtility" INTEGER NOT NULL DEFAULT 0,
  "hostelsMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "clubsMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "datingMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "friendsMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "wildcardsCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Bidder_pkey" PRIMARY KEY ("id")
);

-- Create Item table
CREATE TABLE "Item" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "utility" INTEGER NOT NULL,
  "basePrice" INTEGER NOT NULL,
  "soldPrice" INTEGER,
  "soldTo" TEXT,
  "status" TEXT NOT NULL DEFAULT 'available',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- Create Wildcard table
CREATE TABLE "Wildcard" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "bidderId" TEXT NOT NULL,
  "hostelsMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "clubsMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "datingMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "friendsMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "countsAsTheme" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Wildcard_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "Bidder_name_key" ON "Bidder"("name");
CREATE INDEX "Bidder_name_idx" ON "Bidder"("name");
CREATE INDEX "Bidder_isQualified_idx" ON "Bidder"("isQualified");
CREATE INDEX "Bidder_totalUtility_idx" ON "Bidder"("totalUtility");
CREATE INDEX "Item_category_idx" ON "Item"("category");
CREATE INDEX "Item_status_idx" ON "Item"("status");
CREATE INDEX "Wildcard_bidderId_idx" ON "Wildcard"("bidderId");

-- Add foreign keys
ALTER TABLE "Item" ADD CONSTRAINT "Item_soldTo_fkey" FOREIGN KEY ("soldTo") REFERENCES "Bidder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Wildcard" ADD CONSTRAINT "Wildcard_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "Bidder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

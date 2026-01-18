# Seed English Data Guide

## Overview

This script generates sample data in English for the entire system, including users, stores, categories, products, orders, and banners.

## Features

- ✅ All data in English
- ✅ Automatically clears old data before seeding
- ✅ Creates realistic sample data using Faker.js
- ✅ Generates product images from Lorem Flickr
- ✅ Creates relationships between all entities

## Quick Start

### Method 1: Using npm script (Recommended)

```bash
npm run seed:english
```

### Method 2: Using node directly

```bash
node scripts/seed-english-data.js
```

## What Gets Created

### 📊 Data Summary

- **Users**: 51 (50 regular users + 1 admin)

  - Mix of regular users and store managers
  - All with realistic names, emails, and avatars
  - Default password: `123456`

- **Stores**: 10 convenience stores

  - Located across different US states
  - Each with proper address information

- **Categories**: 15 product categories

  - Fresh Food, Beverages, Snacks, etc.
  - Each with description

- **Products**: ~300 products

  - 20 products per category
  - Each with multiple images
  - Realistic prices and inventory
  - Linked to all stores

- **Orders**: ~250 orders

  - 5 orders per user on average
  - Various statuses and payment methods

- **Banners**: 10 promotional banners
  - For homepage carousel

## Default Admin Credentials

```
Username: admin
Password: 123456
Email: admin@sstore.com
```

## Sample Categories

1. Fresh Food
2. Beverages
3. Snacks
4. Canned Food
5. Cooking Spices
6. Dairy Products
7. Household Items
8. Personal Care
9. Stationery
10. Electronics
11. Baby Products
12. Pet Supplies
13. Beauty
14. Health
15. Frozen Foods

## Sample Products (English)

- Fresh Food: Australian Premium Beef, Norwegian Salmon Fillet, etc.
- Beverages: Coca Cola, Heineken Beer, Fresh Orange Juice, etc.
- Snacks: Pringles Potato Chips, Oreo Cookies, Kitkat Chocolate, etc.
- Household: Dish Washing Liquid, Laundry Detergent, Toilet Paper, etc.
- Personal Care: Sunscreen Lotion, Facial Cleanser, Shampoo, etc.

## Configuration

You can modify the data generation in `seed-english-data.js`:

```javascript
const CONFIG = {
  users: 50, // Number of users
  stores: 10, // Number of stores
  categories: 15, // Number of categories
  productsPerCategory: 20, // Products per category
  ordersPerUser: 5, // Orders per user
  banners: 10, // Number of banners
  minProductImages: 2, // Min images per product
  maxProductImages: 5, // Max images per product
};
```

## Notes

- ⚠️ This script will **DELETE ALL EXISTING DATA** before seeding
- Images are fetched from Lorem Flickr (requires internet connection)
- Process takes 2-5 minutes depending on your internet speed
- All passwords are hashed using bcrypt

## Troubleshooting

### If seeding fails:

1. Check database connection in `.env` file
2. Ensure database exists
3. Run `npm run sync-db` first if needed
4. Check internet connection (for images)

### If you want to keep users but reseed products:

Use the old `seed-all-data.js` script instead, or modify this script to skip user deletion.

## Other Useful Commands

```bash
# Reset all data (without reseeding)
npm run reset:all

# Sync database models
npm run sync-db

# Seed with Vietnamese data (old script)
npm run seed
```

## Technical Details

- Uses Faker.js for realistic fake data
- Uses bcryptjs for password hashing
- Images from Lorem Flickr API
- Proper foreign key relationships
- Transaction-safe operations

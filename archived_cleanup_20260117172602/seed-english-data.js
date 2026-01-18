/**
 * Script to generate English data for the entire system
 * Includes: Users, Stores, Categories, Products, Orders, Banners, etc.
 * Run: node scripts/seed-english-data.js
 */

import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import {
  sequelize,
  User,
  Store,
  Category,
  ProductTemplate,
  StoreProduct,
  Order,
  OrderDetail,
  Banner,
  SiteSetting,
  Cart,
} from "../src/models/index.js";

// Configuration
const CONFIG = {
  users: 50, // Number of users
  stores: 10, // Number of stores
  categories: 15, // Number of categories
  productsPerCategory: 20, // Products per category
  ordersPerUser: 5, // Orders per user
  banners: 10, // Number of banners
  minProductImages: 2, // Minimum images per product
  maxProductImages: 5, // Maximum images per product
};

// Image keywords for products by category (for Lorem Flickr)
const IMAGE_KEYWORDS = {
  grocery: [
    "meat",
    "vegetables",
    "fruits",
    "fish",
    "eggs",
    "milk",
    "cheese",
    "grocery",
  ],
  beverage: [
    "drinks",
    "beverage",
    "soda",
    "juice",
    "coffee",
    "tea",
    "beer",
    "water",
  ],
  snack: [
    "snacks",
    "chips",
    "cookies",
    "candy",
    "chocolate",
    "crackers",
    "nuts",
  ],
  household: ["cleaning", "detergent", "soap", "tissue", "bathroom", "kitchen"],
  personal_care: [
    "cosmetics",
    "skincare",
    "shampoo",
    "perfume",
    "makeup",
    "beauty",
  ],
  other: ["stationery", "office", "pen", "notebook", "supplies", "battery"],
};

// English product names by category
const ENGLISH_PRODUCTS = {
  grocery: [
    "Australian Premium Beef",
    "Fresh Pork Chops",
    "Whole Chicken",
    "Norwegian Salmon Fillet",
    "Fresh Tiger Prawns",
    "Organic Spinach",
    "Sweet Kale",
    "Cherry Tomatoes",
    "Butter Lettuce",
    "Fresh Broccoli",
    "Free Range Eggs",
    "Duck Eggs",
    "Fresh Whole Milk",
    "Cheddar Cheese Block",
    "Greek Yogurt",
    "Envy Apples",
    "Valencia Oranges",
    "Honey Mangoes",
    "Seedless Red Grapes",
    "Seedless Watermelon",
  ],
  beverage: [
    "Coca Cola 330ml Can",
    "Pepsi 1.5L Bottle",
    "Energy Drink Strawberry",
    "Mineral Water",
    "Lemon Lime Soda",
    "Green Tea Bottle",
    "Lipton Green Tea",
    "Strawberry Tea Drink",
    "Fresh Orange Juice",
    "Lemon Salt Water",
    "3-in-1 Coffee Mix",
    "Milk Tea Latte",
    "Soy Milk",
    "Macadamia Nut Milk",
    "Fresh Coconut Water",
    "Heineken Beer",
    "Tiger Beer",
    "Lager Beer",
    "Red Wine",
    "Smirnoff Vodka",
  ],
  snack: [
    "Shrimp Chips",
    "Pringles Potato Chips",
    "Oreo Cookies",
    "Rice Crackers",
    "Butter Cookies",
    "Gummy Bears Haribo",
    "Kitkat Chocolate",
    "Dairy Milk Chocolate",
    "Mentos Candy",
    "Potato Chips",
    "Spicy Tom Yum Noodles",
    "Chicken Ramen",
    "Instant Pho Noodles",
    "Instant Rice Noodles",
    "Glass Noodles",
    "Salted Cashew Nuts",
    "California Walnuts",
    "Roasted Almonds",
    "Dried Raisins",
    "Crispy Jackfruit Chips",
  ],
  household: [
    "Dish Washing Liquid",
    "Laundry Detergent Powder",
    "Floor Cleaning Solution",
    "Fabric Softener",
    "Bleach Cleaner",
    "Toilet Paper Roll",
    "Facial Tissue Box",
    "Biodegradable Trash Bags",
    "Plastic Food Bags",
    "Food Wrap Film",
    "Toothbrush",
    "Toothpaste",
    "Antibacterial Soap Bar",
    "Anti-Dandruff Shampoo",
    "Body Wash",
    "Wooden Toothpicks",
    "Disposable Razor",
    "Cotton Pads",
    "Cotton Swabs",
    "Medical Face Masks",
  ],
  personal_care: [
    "Sunscreen Lotion SPF50",
    "Facial Cleanser",
    "Sheet Face Mask",
    "Makeup Remover",
    "Anti-Aging Serum",
    "Volume Shampoo",
    "Hair Conditioner",
    "Hair Dye Kit",
    "Hair Styling Gel",
    "Hair Spray",
    "Body Lotion",
    "Moisturizing Cream",
    "Lip Balm",
    "Rose Water Toner",
    "Facial Toner",
    "Sanitary Pads",
    "Night Use Pads",
    "Roll-On Deodorant",
    "Body Perfume Spray",
    "Body Mist",
  ],
  other: [
    "AA Batteries Pack",
    "LED Light Bulb",
    "iPhone Charging Cable",
    "In-Ear Headphones",
    "Wireless Mouse",
    "Hardcover Notebook",
    "Ballpoint Pen",
    "2B Pencil",
    "White Eraser",
    "Plastic Ruler",
    "Paper Cutter",
    "Office Scissors",
    "Glue Stick",
    "Clear Tape",
    "2-Ring Binder",
    "Canvas Tote Bag",
    "Compact Umbrella",
    "Cute Keychain",
    "Scented Candle",
    "Microfiber Car Cloth",
  ],
};

// Category names with mapping to enum
const CATEGORY_NAMES = [
  {
    name: "Fresh Food",
    slug: "fresh-food",
    keywords: "grocery",
    enumValue: "grocery",
  },
  {
    name: "Beverages",
    slug: "beverages",
    keywords: "drink",
    enumValue: "beverage",
  },
  { name: "Snacks", slug: "snacks", keywords: "snack", enumValue: "snack" },
  {
    name: "Canned Food",
    slug: "canned-food",
    keywords: "food",
    enumValue: "grocery",
  },
  {
    name: "Cooking Spices",
    slug: "spices",
    keywords: "grocery",
    enumValue: "grocery",
  },
  {
    name: "Dairy Products",
    slug: "dairy",
    keywords: "grocery",
    enumValue: "grocery",
  },
  {
    name: "Household Items",
    slug: "household",
    keywords: "household",
    enumValue: "household",
  },
  {
    name: "Personal Care",
    slug: "personal-care",
    keywords: "personal",
    enumValue: "personal_care",
  },
  {
    name: "Stationery",
    slug: "stationery",
    keywords: "stationery",
    enumValue: "other",
  },
  {
    name: "Electronics",
    slug: "electronics",
    keywords: "electronics",
    enumValue: "other",
  },
  {
    name: "Baby Products",
    slug: "baby-products",
    keywords: "personal",
    enumValue: "personal_care",
  },
  {
    name: "Pet Supplies",
    slug: "pet-supplies",
    keywords: "household",
    enumValue: "other",
  },
  {
    name: "Beauty",
    slug: "beauty",
    keywords: "personal",
    enumValue: "personal_care",
  },
  {
    name: "Health",
    slug: "health",
    keywords: "personal",
    enumValue: "personal_care",
  },
  {
    name: "Frozen Foods",
    slug: "frozen-foods",
    keywords: "food",
    enumValue: "grocery",
  },
];

// US States for store locations
const US_STATES = [
  { id: 1, name: "California" },
  { id: 2, name: "Texas" },
  { id: 3, name: "Florida" },
  { id: 4, name: "New York" },
  { id: 5, name: "Illinois" },
  { id: 6, name: "Pennsylvania" },
  { id: 7, name: "Ohio" },
  { id: 8, name: "Georgia" },
  { id: 9, name: "North Carolina" },
  { id: 10, name: "Michigan" },
];

/**
 * Generate image URL from Lorem Flickr
 */
function generateImageUrl(keyword, width = 800, height = 600) {
  const cleanKeyword = keyword.split(",")[0].trim().replace(/\s+/g, ",");
  const seed = Math.floor(Math.random() * 10000);
  return `https://loremflickr.com/${width}/${height}/${cleanKeyword}?random=${seed}`;
}

/**
 * Generate multiple images for products
 */
function generateProductImages(categoryKeywords, count = 3) {
  const images = [];
  const keywords = IMAGE_KEYWORDS[categoryKeywords] || ["product"];

  for (let i = 0; i < count; i++) {
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    images.push(generateImageUrl(keyword, 800, 600));
  }

  return images;
}

/**
 * Seed Users
 */
async function seedUsers() {
  console.log("🌱 Seeding Users...");

  const users = [];
  const hashedPassword = await bcrypt.hash("123456", 10);

  // Create admin
  users.push({
    username: "admin",
    password: hashedPassword,
    name: "System Administrator",
    email: "admin@sstore.com",
    phone: "+1234567890",
    role: "admin",
    gender: "Other",
    isVerified: true,
    provider: "local",
    avatar: generateImageUrl("portrait", 200, 200),
  });

  // Create random users
  for (let i = 0; i < CONFIG.users; i++) {
    const gender = faker.helpers.arrayElement(["Male", "Female", "Other"]);
    const firstName = faker.person.firstName(
      gender === "Male" ? "male" : "female"
    );
    const lastName = faker.person.lastName();
    const provider = faker.helpers.arrayElement([
      "local",
      "local",
      "local",
      "local",
      "local",
    ]); // Only use local provider for now

    users.push({
      username: faker.internet.username({ firstName, lastName }).toLowerCase(),
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phone: faker.phone.number("+1##########"),
      role: faker.helpers.arrayElement(["user", "user", "user", "manager"]),
      gender,
      dob: faker.date.birthdate({ min: 18, max: 65, mode: "age" }),
      isVerified: true, // All users verified for testing
      provider: provider,
      avatar: generateImageUrl("portrait", 200, 200),
    });
  }

  await User.bulkCreate(users, { ignoreDuplicates: true });
  console.log(`✅ Created ${users.length} users`);

  return users;
}

/**
 * Seed Stores
 */
async function seedStores() {
  console.log("🌱 Seeding Stores...");

  const stores = [];

  for (let i = 0; i < CONFIG.stores; i++) {
    const state = US_STATES[Math.floor(Math.random() * US_STATES.length)];

    stores.push({
      name: `S-Store ${faker.location.city()}`,
      address: faker.location.streetAddress(true),
      provinceId: state.id,
      districtId: faker.number.int({ min: 1, max: 20 }),
      wardId: faker.number.int({ min: 1, max: 50 }),
    });
  }

  await Store.bulkCreate(stores, { ignoreDuplicates: true });
  console.log(`✅ Created ${stores.length} stores`);

  return stores;
}

/**
 * Assign managers to stores
 */
async function assignManagersToStores() {
  console.log("🌱 Assigning Managers to Stores...");

  const managers = await User.findAll({ where: { role: "manager" } });
  const stores = await Store.findAll();

  let storeIndex = 0;
  for (const manager of managers) {
    if (storeIndex < stores.length) {
      await manager.update({ storeId: stores[storeIndex].id });
      storeIndex++;
    }
  }

  console.log(`✅ Assigned ${managers.length} managers to stores`);
}

/**
 * Seed Categories
 */
async function seedCategories() {
  console.log("🌱 Seeding Categories...");

  const categories = CATEGORY_NAMES.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    description: faker.commerce.productDescription(),
  }));

  await Category.bulkCreate(categories, { ignoreDuplicates: true });
  console.log(`✅ Created ${categories.length} categories`);

  return categories;
}

/**
 * Seed Products with templates
 */
async function seedProducts() {
  console.log("🌱 Seeding Products...");

  const categories = await Category.findAll();
  const stores = await Store.findAll();

  let totalProducts = 0;

  for (const category of categories) {
    const catData = CATEGORY_NAMES.find((c) => c.name === category.name);
    const enumValue = catData?.enumValue || "other";

    // Get English product names for this category
    const productNames = ENGLISH_PRODUCTS[enumValue] || [];

    for (
      let i = 0;
      i < Math.min(CONFIG.productsPerCategory, productNames.length);
      i++
    ) {
      const productName = productNames[i];
      const images = generateProductImages(
        enumValue,
        faker.number.int({
          min: CONFIG.minProductImages,
          max: CONFIG.maxProductImages,
        })
      );

      // Create Product Template (add unique suffix to avoid duplicates)
      const uniqueName = `${productName} ${faker.string
        .alphanumeric(6)
        .toUpperCase()}`;

      // Generate VND prices based on category
      let priceMin, priceMax;
      switch (enumValue) {
        case "grocery":
          priceMin = 10000;
          priceMax = 150000;
          break;
        case "beverage":
          priceMin = 5000;
          priceMax = 30000;
          break;
        case "snack":
          priceMin = 5000;
          priceMax = 50000;
          break;
        case "household":
          priceMin = 15000;
          priceMax = 100000;
          break;
        case "personal_care":
          priceMin = 20000;
          priceMax = 150000;
          break;
        default:
          priceMin = 10000;
          priceMax = 200000;
      }

      const template = await ProductTemplate.create({
        name: uniqueName,
        description: faker.commerce.productDescription(),
        categoryId: category.id,
        category: enumValue,
        image: images[0],
        images: images,
        price: faker.number.int({ min: priceMin, max: priceMax }),
      });

      // Link product template to stores with inventory
      for (const store of stores) {
        await StoreProduct.create({
          store_id: store.id,
          product_template_id: template.id,
          quantity: faker.number.int({ min: 10, max: 500 }),
          sold: faker.number.int({ min: 0, max: 50 }),
          in_stock: true,
        });
      }

      totalProducts++;
    }
  }

  console.log(`✅ Created ${totalProducts} products with store inventory`);
}

/**
 * Seed Orders
 */
async function seedOrders() {
  console.log("🌱 Seeding Orders...");

  const users = await User.findAll({ where: { role: "user" } });
  const stores = await Store.findAll();
  const storeProducts = await StoreProduct.findAll({
    include: [{ model: ProductTemplate, as: "productTemplate" }],
  });

  let totalOrders = 0;

  for (const user of users) {
    const orderCount = faker.number.int({ min: 1, max: CONFIG.ordersPerUser });

    for (let i = 0; i < orderCount; i++) {
      const store = faker.helpers.arrayElement(stores);

      // Get store products for this specific store
      const availableProducts = storeProducts.filter(
        (sp) => sp.store_id === store.id && sp.quantity > 0
      );

      const orderProducts = faker.helpers.arrayElements(
        availableProducts,
        faker.number.int({ min: 1, max: Math.min(5, availableProducts.length) })
      );

      if (orderProducts.length === 0) continue; // Skip if no products available

      let totalPrice = 0;
      let totalQuantity = 0;
      const orderDetails = [];

      orderProducts.forEach((storeProduct) => {
        const quantity = faker.number.int({ min: 1, max: 5 });
        const price = storeProduct.productTemplate.price;
        const subtotal = price * quantity;
        totalPrice += subtotal;
        totalQuantity += quantity;

        orderDetails.push({
          storeProductId: storeProduct.id,
          name: storeProduct.productTemplate.name,
          quantity,
          price,
          total_price: subtotal,
          discount: 0,
        });
      });

      const discount = faker.number.float({ min: 0, max: 10 });
      const shipping_fee = faker.number.float({ min: 0, max: 5 });
      const final_price = totalPrice - discount + shipping_fee;

      const order = await Order.create({
        userId: user.id,
        storeId: store.id,
        total_quantity: totalQuantity,
        total_price: totalPrice,
        discount: discount,
        final_price: final_price,
        shipping_fee: shipping_fee,
        status: faker.helpers.arrayElement([
          "pending",
          "processing",
          "shipping",
          "delivered",
          "cancelled",
        ]),
        payment_method: faker.helpers.arrayElement(["COD", "paypal", "cash"]),
        delivery_address: faker.location.streetAddress(true),
        receiver_name: user.name,
        receiver_phone: user.phone,
        notes: faker.lorem.sentence(),
      });

      // Create order details
      for (const detail of orderDetails) {
        await OrderDetail.create({
          ...detail,
          orderId: order.id,
        });
      }

      totalOrders++;
    }
  }

  console.log(`✅ Created ${totalOrders} orders`);
}

/**
 * Seed Banners
 */
async function seedBanners() {
  console.log("🌱 Seeding Banners...");

  const banners = [];

  for (let i = 0; i < CONFIG.banners; i++) {
    banners.push({
      title: `${faker.commerce.productAdjective()} Sale Event`,
      image_url: generateImageUrl("shopping,sale", 1200, 400),
      link_url: `/all-products`,
      is_active: faker.datatype.boolean(0.8),
      order_index: i,
      position: faker.helpers.arrayElement([
        "home_main",
        "home_secondary",
        "category_top",
      ]),
    });
  }

  await Banner.bulkCreate(banners);
  console.log(`✅ Created ${banners.length} banners`);
}

/**
 * Seed Site Settings
 */
async function seedSiteSettings() {
  console.log("🌱 Seeding Site Settings...");

  const settings = [
    {
      key: "site_name",
      value: "S-Store",
      description: "Website name",
    },
    {
      key: "site_description",
      value:
        "Multi-location convenience store chain providing quality products",
      description: "Website description",
    },
    {
      key: "contact_email",
      value: "contact@sstore.com",
      description: "Contact email",
    },
    {
      key: "contact_phone",
      value: "+1234567890",
      description: "Contact phone",
    },
    {
      key: "facebook_url",
      value: "https://facebook.com/sstore",
      description: "Facebook page URL",
    },
    {
      key: "instagram_url",
      value: "https://instagram.com/sstore",
      description: "Instagram page URL",
    },
  ];

  await SiteSetting.bulkCreate(settings, {
    updateOnDuplicate: ["value", "description"],
  });
  console.log(`✅ Created ${settings.length} site settings`);
}

/**
 * Main seeding function
 */
async function seedAll() {
  try {
    console.log("🚀 Starting database seeding with English data...\n");

    // Clear existing data first
    console.log("🗑️  Clearing existing data...");
    await OrderDetail.destroy({ where: {}, force: true });
    await Order.destroy({ where: {}, force: true });
    await Cart.destroy({ where: {}, force: true });
    await StoreProduct.destroy({ where: {}, force: true });
    await ProductTemplate.destroy({ where: {}, force: true });
    await Banner.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await Store.destroy({ where: {}, force: true });
    await Category.destroy({ where: {}, force: true });
    await SiteSetting.destroy({ where: {}, force: true });
    console.log("✅ All existing data cleared\n");

    // Seed new data
    await seedUsers();
    await seedStores();
    await assignManagersToStores();
    await seedCategories();
    await seedProducts();
    await seedOrders();
    await seedBanners();
    await seedSiteSettings();

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Users: ${CONFIG.users + 1} (including 1 admin)`);
    console.log(`   - Stores: ${CONFIG.stores}`);
    console.log(`   - Categories: ${CATEGORY_NAMES.length}`);
    console.log(
      `   - Products: ~${CATEGORY_NAMES.length * CONFIG.productsPerCategory}`
    );
    console.log(`   - Banners: ${CONFIG.banners}`);
    console.log("\n🔑 Default credentials:");
    console.log("   Username: admin");
    console.log("   Password: 123456");
    console.log("   Email: admin@sstore.com\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run seeding
seedAll();

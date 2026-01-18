/**
 * Script sinh dữ liệu ngẫu nhiên cho toàn bộ hệ thống
 * Bao gồm: Users, Stores, Categories, Products, Orders, Banners, v.v.
 */

import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import {
  sequelize,
  User,
  Store,
  Category,
  Product,
  ProductTemplate,
  StoreProduct,
  Order,
  OrderDetail,
  Banner,
  SiteSetting,
  Cart,
} from "../src/models/index.js";

// Cấu hình
const CONFIG = {
  users: 50, // Số lượng người dùng
  stores: 10, // Số lượng cửa hàng
  categories: 15, // Số lượng danh mục
  productsPerCategory: 20, // Số sản phẩm mỗi danh mục
  ordersPerUser: 5, // Số đơn hàng mỗi người dùng
  banners: 10, // Số banner
  minProductImages: 2, // Số ảnh tối thiểu mỗi sản phẩm
  maxProductImages: 5, // Số ảnh tối đa mỗi sản phẩm
};

// Danh sách từ khóa ảnh cho sản phẩm theo category (dùng cho Lorem Flickr)
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

// Danh sách tên sản phẩm tiếng Việt theo danh mục
const VIETNAMESE_PRODUCTS = {
  grocery: [
    "Thịt bò Úc cao cấp",
    "Thịt heo sạch",
    "Gà ta nguyên con",
    "Cá hồi Na Uy",
    "Tôm sú tươi",
    "Rau muống",
    "Cải ngọt",
    "Cà chua bi",
    "Xà lách lô lô",
    "Bông cải xanh",
    "Trứng gà ta",
    "Trứng vịt",
    "Sữa tươi Vinamilk",
    "Phô mai con bò cười",
    "Sữa chua Vinamilk",
    "Táo Envy Mỹ",
    "Cam sành",
    "Xoài cát Hòa Lộc",
    "Nho Mỹ không hạt",
    "Dưa hấu không hạt",
  ],
  beverage: [
    "Coca Cola lon 330ml",
    "Pepsi chai 1.5L",
    "Sting dâu 330ml",
    "Revive muối khoáng",
    "Number One hương chanh",
    "Trà xanh Không Độ",
    "Lipton trà xanh",
    "C2 hương dâu",
    "Nước cam ép Twister",
    "Nước chanh muối",
    "Cà phê G7 3in1",
    "Trà sữa Lipton",
    "Sữa đậu nành Vinasoy",
    "Sữa hạt Macca",
    "Nước dừa xiêm",
    "Bia Heineken",
    "Bia Tiger",
    "Bia Sài Gòn đỏ",
    "Rượu vang Đà Lạt",
    "Vodka Smirnoff",
  ],
  snack: [
    "Snack Oishi vị tôm",
    "Khoai tây Pringles",
    "Bánh Oreo",
    "Bánh gạo Want Want",
    "Bánh quy Cosy",
    "Kẹo dẻo Haribo",
    "Chocolate Kitkat",
    "Socola Dairy Milk",
    "Kẹo Mentos",
    "Bim bim Swing",
    "Mì Hảo Hảo tôm chua cay",
    "Mì Kokomi",
    "Phở ăn liền Vifon",
    "Hủ tiếu Nam Vang",
    "Miến Phú Hương",
    "Hạt điều rang muối",
    "Hạt óc chó Mỹ",
    "Hạt hạnh nhân",
    "Nho khô",
    "Mít sấy giòn",
  ],
  household: [
    "Nước rửa chén Sunlight",
    "Bột giặt OMO",
    "Nước lau sàn Vim",
    "Nước xả vải Comfort",
    "Nước tẩy Clorox",
    "Giấy vệ sinh Pulppy",
    "Khăn giấy ăn Bless You",
    "Túi rác tự hủy sinh học",
    "Bao nilon túi ni lông",
    "Màng bọc thực phẩm",
    "Bàn chải đánh răng Colgate",
    "Kem đánh răng PS",
    "Xà phòng Lifebuoy",
    "Dầu gội Clear",
    "Sữa tắm Dove",
    "Que tăm tre",
    "Dao cạo râu Gillette",
    "Bông tẩy trang",
    "Bông tai cotton buds",
    "Khẩu trang y tế",
  ],
  personal_care: [
    "Kem chống nắng Bioré",
    "Sữa rửa mặt Senka",
    "Mặt nạ Innisfree",
    "Nước tẩy trang Garnier",
    "Serum Olay",
    "Dầu gội Sunsilk",
    "Dầu xả Pantene",
    "Thuốc nhuộm tóc Gatsby",
    "Gel vuốt tóc",
    "Keo xịt tóc",
    "Sữa dưỡng thể Vaseline",
    "Kem dưỡng da Nivea",
    "Son dưỡng môi Lipice",
    "Nước hoa hồng Hazeline",
    "Toner Simple",
    "Băng vệ sinh Kotex",
    "Băng vệ sinh Diana",
    "Lăn khử mùi Rexona",
    "Nước hoa Enchanteur",
    "Xịt thơm toàn thân",
  ],
  other: [
    "Pin Panasonic AA",
    "Bóng đèn LED",
    "Dây sạc iPhone",
    "Tai nghe nhét tai",
    "Chuột không dây",
    "Sổ tay bìa cứng",
    "Bút bi Thiên Long",
    "Bút chì 2B",
    "Gôm tẩy trắng",
    "Thước kẻ nhựa",
    "Dao cắt giấy",
    "Kéo văn phòng",
    "Hồ dán UHU",
    "Băng keo trong",
    "Bìa còng 2 lỗ",
    "Túi xách canvas",
    "Ô dù gấp gọn",
    "Móc khóa cute",
    "Nến thơm",
    "Khăn lau xe",
  ],
};

// Danh sách tên danh mục tiếng Việt với mapping sang enum
const CATEGORY_NAMES = [
  {
    name: "Thực phẩm tươi sống",
    slug: "fresh-food",
    keywords: "grocery",
    enumValue: "grocery",
  },
  {
    name: "Đồ uống",
    slug: "beverages",
    keywords: "drink",
    enumValue: "beverage",
  },
  { name: "Đồ ăn vặt", slug: "snacks", keywords: "snack", enumValue: "snack" },
  {
    name: "Thực phẩm đóng hộp",
    slug: "canned-food",
    keywords: "food",
    enumValue: "grocery",
  },
  {
    name: "Gia vị nấu ăn",
    slug: "spices",
    keywords: "grocery",
    enumValue: "grocery",
  },
  {
    name: "Sữa và sản phẩm từ sữa",
    slug: "dairy",
    keywords: "grocery",
    enumValue: "grocery",
  },
  {
    name: "Đồ dùng gia đình",
    slug: "household",
    keywords: "household",
    enumValue: "household",
  },
  {
    name: "Chăm sóc cá nhân",
    slug: "personal-care",
    keywords: "personal",
    enumValue: "personal_care",
  },
  {
    name: "Văn phòng phẩm",
    slug: "stationery",
    keywords: "stationery",
    enumValue: "other",
  },
  {
    name: "Điện tử",
    slug: "electronics",
    keywords: "electronics",
    enumValue: "other",
  },
  {
    name: "Đồ dùng trẻ em",
    slug: "baby-products",
    keywords: "personal",
    enumValue: "personal_care",
  },
  {
    name: "Thú cưng",
    slug: "pet-supplies",
    keywords: "household",
    enumValue: "other",
  },
  {
    name: "Làm đẹp",
    slug: "beauty",
    keywords: "personal",
    enumValue: "personal_care",
  },
  {
    name: "Sức khỏe",
    slug: "health",
    keywords: "personal",
    enumValue: "personal_care",
  },
  {
    name: "Đồ tươi mát",
    slug: "frozen-foods",
    keywords: "food",
    enumValue: "grocery",
  },
];

// Tỉnh thành Việt Nam mẫu
const VIETNAM_PROVINCES = [
  { id: 1, name: "Hà Nội" },
  { id: 2, name: "Hồ Chí Minh" },
  { id: 3, name: "Đà Nẵng" },
  { id: 4, name: "Hải Phòng" },
  { id: 5, name: "Cần Thơ" },
  { id: 6, name: "Bình Dương" },
  { id: 7, name: "Đồng Nai" },
  { id: 8, name: "Khánh Hòa" },
  { id: 9, name: "Lâm Đồng" },
  { id: 10, name: "Quảng Ninh" },
];

/**
 * Sinh URL ảnh từ Lorem Flickr (ảnh thật theo keyword)
 * Lorem Flickr tìm ảnh từ Flickr theo keyword, phù hợp với sản phẩm
 */
function generateImageUrl(keyword, width = 800, height = 600) {
  // Loại bỏ dấu phẩy và khoảng trắng, chỉ lấy keyword đầu tiên
  const cleanKeyword = keyword.split(",")[0].trim().replace(/\s+/g, ",");
  const seed = Math.floor(Math.random() * 10000);
  // Lorem Flickr: https://loremflickr.com/width/height/keyword
  return `https://loremflickr.com/${width}/${height}/${cleanKeyword}?random=${seed}`;
}

/**
 * Sinh URL ảnh từ Picsum (Lorem Picsum)
 */
function generatePicsumUrl(width = 800, height = 600) {
  const seed = Math.floor(Math.random() * 10000);
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * Sinh URL ảnh từ Placeholder.com
 */
function generatePlaceholderUrl(text, width = 800, height = 600) {
  return `https://via.placeholder.com/${width}x${height}/3b82f6/ffffff?text=${encodeURIComponent(
    text
  )}`;
}

/**
 * Sinh nhiều ảnh cho sản phẩm
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
 * Sinh dữ liệu User
 */
async function seedUsers() {
  console.log("🌱 Seeding Users...");

  const users = [];
  const hashedPassword = await bcrypt.hash("123456", 10);

  // Tạo admin
  users.push({
    username: "admin",
    password: hashedPassword,
    name: "Administrator",
    email: "admin@store.com",
    phone: "0901234567",
    role: "admin",
    gender: "Other",
    isVerified: true,
    provider: "local",
    avatar: generateImageUrl("portrait", 200, 200),
  });

  // Tạo users ngẫu nhiên
  for (let i = 0; i < CONFIG.users; i++) {
    const gender = faker.helpers.arrayElement(["Male", "Female", "Other"]);
    const firstName = faker.person.firstName(
      gender === "Male" ? "male" : "female"
    );
    const lastName = faker.person.lastName();

    users.push({
      username: faker.internet.username({ firstName, lastName }).toLowerCase(),
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phone: `09${faker.string.numeric(8)}`,
      role: faker.helpers.arrayElement(["user", "user", "user", "manager"]),
      gender,
      dob: faker.date.birthdate({ min: 18, max: 65, mode: "age" }),
      isVerified: faker.datatype.boolean(0.8),
      provider: faker.helpers.arrayElement([
        "local",
        "local",
        "local",
        "github",
        "facebook",
      ]),
      avatar: generateImageUrl("portrait", 200, 200),
    });
  }

  await User.bulkCreate(users, { ignoreDuplicates: true });
  console.log(`✅ Created ${users.length} users`);

  return users;
}

/**
 * Sinh dữ liệu Store
 */
async function seedStores() {
  console.log("🌱 Seeding Stores...");

  const stores = [];

  for (let i = 0; i < CONFIG.stores; i++) {
    const province =
      VIETNAM_PROVINCES[Math.floor(Math.random() * VIETNAM_PROVINCES.length)];

    stores.push({
      name: `Cửa hàng ${faker.company.name()}`,
      address: faker.location.streetAddress(true),
      provinceId: province.id,
      districtId: faker.number.int({ min: 1, max: 20 }),
      wardId: faker.number.int({ min: 1, max: 50 }),
    });
  }

  await Store.bulkCreate(stores, { ignoreDuplicates: true });
  console.log(`✅ Created ${stores.length} stores`);

  return stores;
}

/**
 * Cập nhật storeId cho managers
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
 * Sinh dữ liệu Category
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
 * Sinh dữ liệu Products theo template
 */
async function seedProducts() {
  console.log("🌱 Seeding Products...");

  const categories = await Category.findAll();
  const stores = await Store.findAll();

  let totalProducts = 0;

  for (const category of categories) {
    const catData = CATEGORY_NAMES.find((c) => c.name === category.name);
    const enumValue = catData?.enumValue || "other";

    // Lấy danh sách tên sản phẩm tiếng Việt cho category này
    const productNames = VIETNAMESE_PRODUCTS[enumValue] || [];

    for (let i = 0; i < CONFIG.productsPerCategory; i++) {
      // Sinh số lượng ảnh ngẫu nhiên
      const imageCount = faker.number.int({
        min: CONFIG.minProductImages,
        max: CONFIG.maxProductImages,
      });

      // Dùng enumValue để sinh ảnh phù hợp với category
      const images = generateProductImages(enumValue, imageCount);
      const mainImage = images[0];

      // Lấy tên sản phẩm tiếng Việt hoặc random nếu hết
      const baseName =
        productNames[i % productNames.length] || faker.commerce.productName();
      const productName = `${baseName} #${totalProducts + 1}`;

      // Mô tả tiếng Việt
      const descriptions = [
        `Sản phẩm chất lượng cao, được nhập khẩu từ nguồn uy tín`,
        `Hàng chính hãng 100%, giá cả phải chăng`,
        `Đảm bảo an toàn vệ sinh thực phẩm, có tem nhãn rõ ràng`,
        `Sản phẩm được nhiều khách hàng tin dùng và đánh giá cao`,
        `Chất lượng đảm bảo, giao hàng nhanh chóng`,
        `Sản phẩm mới về, khuyến mãi hấp dẫn`,
        `Hàng Việt Nam chất lượng cao, giá tốt`,
        `Nhập khẩu chính ngạch, đầy đủ giấy tờ`,
      ];

      // Tạo ProductTemplate
      const template = await ProductTemplate.create({
        name: productName,
        description: faker.helpers.arrayElement(descriptions),
        category: enumValue,
        price: parseFloat(faker.commerce.price({ min: 10000, max: 500000 })),
        image: mainImage,
        images: images,
      });

      // Tạo StoreProduct cho mỗi cửa hàng
      for (const store of stores) {
        const quantity = faker.number.int({ min: 10, max: 500 });
        const sold = faker.number.int({
          min: 0,
          max: Math.floor(quantity / 2),
        });

        await StoreProduct.create({
          product_template_id: template.id,
          store_id: store.id,
          quantity,
          sold,
          in_stock: quantity > 0,
        });
      }

      totalProducts++;
    }
  }

  console.log(`✅ Created ${totalProducts} product templates`);
}

/**
 * Sinh dữ liệu Orders
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
      const orderStatus = faker.helpers.arrayElement([
        "pending",
        "processing",
        "shipping",
        "delivered",
        "delivered",
        "cancelled",
      ]);

      const paymentMethod = faker.helpers.arrayElement([
        "cash",
        "online",
        "COD",
        "paypal",
        "stripe",
      ]);

      const province =
        VIETNAM_PROVINCES[Math.floor(Math.random() * VIETNAM_PROVINCES.length)];

      // Tạo order
      const order = await Order.create({
        storeId: store.id,
        userId: user.id,
        total_quantity: 0,
        total_price: 0,
        discount: faker.number.float({ min: 0, max: 50000 }),
        final_price: 0,
        payment_method: paymentMethod,
        order_time: faker.date.recent({ days: 90 }),
        status: orderStatus,
        shipping_partner:
          orderStatus !== "pending"
            ? faker.helpers.arrayElement([
                "GHN",
                "GHTK",
                "Ninja Van",
                "Viettel Post",
              ])
            : null,
        shipping_code:
          orderStatus !== "pending" ? `SH${faker.string.numeric(10)}` : null,
        shipping_fee: faker.number.int({ min: 15000, max: 50000 }),
        shipper_name:
          orderStatus === "shipping" ? faker.person.fullName() : null,
        shipper_phone:
          orderStatus === "shipping" ? `09${faker.string.numeric(8)}` : null,
        receiver_name: user.name,
        receiver_phone: user.phone,
        delivery_address: faker.location.streetAddress(true),
        province_id: province.id,
        district_id: faker.number.int({ min: 1, max: 20 }),
        ward_id: faker.number.int({ min: 1, max: 50 }),
        cancel_time: orderStatus === "cancelled" ? faker.date.recent() : null,
        cancel_reason:
          orderStatus === "cancelled"
            ? faker.helpers.arrayElement([
                "Khách hàng đổi ý",
                "Tìm được giá tốt hơn",
                "Không liên lạc được",
                "Sản phẩm hết hàng",
              ])
            : null,
        notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
      });

      // Tạo order details
      const itemCount = faker.number.int({ min: 1, max: 5 });
      let totalQuantity = 0;
      let totalPrice = 0;

      for (let j = 0; j < itemCount; j++) {
        const storeProduct = faker.helpers.arrayElement(
          storeProducts.filter((sp) => sp.store_id === store.id)
        );

        const quantity = faker.number.int({ min: 1, max: 5 });
        const price = storeProduct.productTemplate.price;
        const subtotal = quantity * price;

        await OrderDetail.create({
          orderId: order.id,
          store_product_id: storeProduct.id,
          name: storeProduct.productTemplate.name,
          quantity,
          price,
          total_price: subtotal,
        });

        totalQuantity += quantity;
        totalPrice += subtotal;
      }

      // Cập nhật order totals
      const finalPrice = totalPrice - order.discount + order.shipping_fee;
      await order.update({
        total_quantity: totalQuantity,
        total_price: totalPrice,
        final_price: finalPrice,
      });

      totalOrders++;
    }
  }

  console.log(`✅ Created ${totalOrders} orders`);
}

/**
 * Sinh dữ liệu Banners
 */
async function seedBanners() {
  console.log("🌱 Seeding Banners...");

  const banners = [];
  const positions = ["home_main", "home_secondary", "category_top"];

  for (let i = 0; i < CONFIG.banners; i++) {
    const bannerKeywords = [
      "sale",
      "shopping",
      "store",
      "market",
      "supermarket",
      "promotion",
    ];
    const keyword = faker.helpers.arrayElement(bannerKeywords);
    banners.push({
      title: faker.company.catchPhrase(),
      image_url: generateImageUrl(keyword, 1200, 400),
      link_url: `/products/${faker.lorem.slug()}`,
      position: faker.helpers.arrayElement(positions),
      order_index: i + 1,
      is_active: faker.datatype.boolean(0.8),
    });
  }

  await Banner.bulkCreate(banners);
  console.log(`✅ Created ${banners.length} banners`);
}

/**
 * Sinh dữ liệu Site Settings
 */
async function seedSiteSettings() {
  console.log("🌱 Seeding Site Settings...");

  const settings = [
    {
      key: "site_name",
      value: "Multi Convenience Store",
      description: "Tên website",
    },
    {
      key: "site_logo",
      value: generatePlaceholderUrl("LOGO", 200, 200),
      description: "Logo website",
    },
    {
      key: "site_description",
      value: faker.company.catchPhrase(),
      description: "Mô tả website",
    },
    {
      key: "contact_email",
      value: "contact@store.com",
      description: "Email liên hệ",
    },
    {
      key: "contact_phone",
      value: "1900-1234",
      description: "Số điện thoại",
    },
    {
      key: "support_hours",
      value: "8:00 - 22:00 (Mon-Sun)",
      description: "Giờ hỗ trợ",
    },
  ];

  await SiteSetting.bulkCreate(settings, { ignoreDuplicates: true });
  console.log(`✅ Created ${settings.length} site settings`);
}

/**
 * Main function
 */
async function seedAll() {
  try {
    console.log("🚀 Starting data seeding...\n");

    // Xóa dữ liệu cũ (giữ lại Users)
    if (process.argv.includes("--fresh")) {
      console.log("🗑️  Clearing old data (keeping existing users)...");

      // PostgreSQL: Drop constraints temporarily
      await OrderDetail.destroy({ where: {}, force: true });
      await Order.destroy({ where: {}, force: true });
      await Cart.destroy({ where: {}, force: true });
      await StoreProduct.destroy({ where: {}, force: true });
      await ProductTemplate.destroy({ where: {}, force: true });
      await Product.destroy({ where: {}, force: true });
      await Banner.destroy({ where: {}, force: true });
      // Giữ lại Users - không xóa
      await Store.destroy({ where: {}, force: true });
      await Category.destroy({ where: {}, force: true });
      await SiteSetting.destroy({ where: {}, force: true });

      console.log("✅ Old data cleared (users preserved)\n");
    }

    // Seed từng bảng
    const existingUsers = await User.count();
    if (existingUsers === 0) {
      console.log("No existing users found, creating new users...");
      await seedUsers();
    } else {
      console.log(
        `⏭️  Skipping user creation (${existingUsers} users already exist)`
      );
    }
    await seedStores();
    await assignManagersToStores();
    await seedCategories();
    await seedProducts();
    await seedOrders();
    await seedBanners();
    await seedSiteSettings();

    console.log("\n🎉 All data seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`- Users: ${await User.count()}`);
    console.log(`- Stores: ${await Store.count()}`);
    console.log(`- Categories: ${await Category.count()}`);
    console.log(`- Product Templates: ${await ProductTemplate.count()}`);
    console.log(`- Store Products: ${await StoreProduct.count()}`);
    console.log(`- Orders: ${await Order.count()}`);
    console.log(`- Banners: ${await Banner.count()}`);
    console.log(`- Site Settings: ${await SiteSetting.count()}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

// Chạy script
seedAll();

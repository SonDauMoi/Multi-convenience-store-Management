import { Banner } from "../models/index.js";

const sampleBanners = [
  {
    title: "Khuyến mãi lớn - Giảm giá 50%",
    image_url:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=500&fit=crop",
    link_url: "/products",
    position: "home_main",
    order_index: 1,
    is_active: true,
  },
  {
    title: "Sản phẩm mới - Đồ gia dụng",
    image_url:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&h=500&fit=crop",
    link_url: "/products?category=household",
    position: "home_main",
    order_index: 2,
    is_active: true,
  },
  {
    title: "Đồ uống tươi mát",
    image_url:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=500&fit=crop",
    link_url: "/products?category=drink",
    position: "home_main",
    order_index: 3,
    is_active: true,
  },
];

async function seedBanners() {
  try {
    console.log("🌱 Starting to seed banners...");

    // Clear existing banners
    await Banner.destroy({ where: {} });
    console.log("✅ Cleared existing banners");

    // Create sample banners
    for (const banner of sampleBanners) {
      await Banner.create(banner);
      console.log(`✅ Created banner: ${banner.title}`);
    }

    console.log("🎉 Banner seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding banners:", error);
    process.exit(1);
  }
}

seedBanners();

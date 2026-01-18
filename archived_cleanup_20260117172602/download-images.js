/**
 * Script tải ảnh từ internet và lưu vào thư mục public
 * Sử dụng API ảnh miễn phí để tải ảnh thực
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn thư mục lưu ảnh
const IMAGES_DIR = path.join(__dirname, "../public/images");
const PRODUCTS_DIR = path.join(IMAGES_DIR, "products");
const AVATARS_DIR = path.join(IMAGES_DIR, "avatars");
const BANNERS_DIR = path.join(IMAGES_DIR, "banners");

// Tạo thư mục nếu chưa tồn tại
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
}

/**
 * Tải ảnh từ URL và lưu vào file
 */
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;

    const file = fs.createWriteStream(filepath);

    protocol
      .get(url, (response) => {
        // Xử lý redirect
        if (response.statusCode === 301 || response.statusCode === 302) {
          return downloadImage(response.headers.location, filepath)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download: ${response.statusCode} ${url}`)
          );
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          resolve(filepath);
        });
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {}); // Xóa file nếu lỗi
        reject(err);
      });

    file.on("error", (err) => {
      fs.unlink(filepath, () => {}); // Xóa file nếu lỗi
      reject(err);
    });
  });
}

/**
 * Sinh URL ảnh từ Unsplash
 */
function getUnsplashUrl(keyword, width = 800, height = 600, index = 0) {
  return `https://source.unsplash.com/random/${width}x${height}/?${keyword}&sig=${index}`;
}

/**
 * Sinh URL ảnh từ Picsum
 */
function getPicsumUrl(width = 800, height = 600, seed = 0) {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * Tải nhiều ảnh cho một category
 */
async function downloadCategoryImages(category, count = 20) {
  console.log(`\n📥 Downloading ${count} images for category: ${category}...`);

  const categoryDir = path.join(PRODUCTS_DIR, category);
  ensureDirectoryExists(categoryDir);

  const images = [];

  for (let i = 0; i < count; i++) {
    const filename = `${category}-${i + 1}.jpg`;
    const filepath = path.join(categoryDir, filename);

    // Skip nếu file đã tồn tại
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skipped: ${filename} (already exists)`);
      images.push(`/images/products/${category}/${filename}`);
      continue;
    }

    try {
      const url = getUnsplashUrl(category, 800, 600, i);
      await downloadImage(url, filepath);
      console.log(`✅ Downloaded: ${filename}`);
      images.push(`/images/products/${category}/${filename}`);

      // Delay để tránh rate limit
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Failed to download ${filename}:`, error.message);
    }
  }

  return images;
}

/**
 * Tải ảnh avatars
 */
async function downloadAvatars(count = 50) {
  console.log(`\n📥 Downloading ${count} avatar images...`);

  ensureDirectoryExists(AVATARS_DIR);

  const images = [];

  for (let i = 0; i < count; i++) {
    const filename = `avatar-${i + 1}.jpg`;
    const filepath = path.join(AVATARS_DIR, filename);

    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skipped: ${filename} (already exists)`);
      images.push(`/images/avatars/${filename}`);
      continue;
    }

    try {
      const url = getUnsplashUrl("portrait,person,face", 300, 300, i);
      await downloadImage(url, filepath);
      console.log(`✅ Downloaded: ${filename}`);
      images.push(`/images/avatars/${filename}`);

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Failed to download ${filename}:`, error.message);
    }
  }

  return images;
}

/**
 * Tải ảnh banners
 */
async function downloadBanners(count = 10) {
  console.log(`\n📥 Downloading ${count} banner images...`);

  ensureDirectoryExists(BANNERS_DIR);

  const images = [];
  const keywords = [
    "sale,promotion",
    "shopping,store",
    "discount,offer",
    "new,arrival",
    "special,deal",
  ];

  for (let i = 0; i < count; i++) {
    const filename = `banner-${i + 1}.jpg`;
    const filepath = path.join(BANNERS_DIR, filename);

    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skipped: ${filename} (already exists)`);
      images.push(`/images/banners/${filename}`);
      continue;
    }

    try {
      const keyword = keywords[i % keywords.length];
      const url = getUnsplashUrl(keyword, 1200, 400, i);
      await downloadImage(url, filepath);
      console.log(`✅ Downloaded: ${filename}`);
      images.push(`/images/banners/${filename}`);

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Failed to download ${filename}:`, error.message);
    }
  }

  return images;
}

/**
 * Main function
 */
async function downloadAllImages() {
  try {
    console.log("🚀 Starting image downloads...\n");

    // Tạo thư mục chính
    ensureDirectoryExists(IMAGES_DIR);
    ensureDirectoryExists(PRODUCTS_DIR);

    // Danh sách categories
    const categories = [
      "food",
      "drink",
      "snack",
      "grocery",
      "vegetables",
      "fruits",
      "dairy",
      "household",
      "personal-care",
      "beauty",
      "stationery",
      "electronics",
    ];

    // Tải ảnh cho từng category
    const productImages = {};
    for (const category of categories) {
      productImages[category] = await downloadCategoryImages(category, 20);
    }

    // Tải avatars
    const avatars = await downloadAvatars(50);

    // Tải banners
    const banners = await downloadBanners(10);

    // Lưu mapping vào file JSON
    const mapping = {
      products: productImages,
      avatars,
      banners,
      generatedAt: new Date().toISOString(),
    };

    const mappingPath = path.join(IMAGES_DIR, "image-mapping.json");
    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));

    console.log("\n🎉 All images downloaded successfully!");
    console.log(`\n📊 Summary:`);
    console.log(
      `- Product images: ${Object.values(productImages).flat().length}`
    );
    console.log(`- Avatars: ${avatars.length}`);
    console.log(`- Banners: ${banners.length}`);
    console.log(`\n💾 Mapping saved to: ${mappingPath}`);
  } catch (error) {
    console.error("❌ Error downloading images:", error);
    process.exit(1);
  }
}

// Chạy script
downloadAllImages();

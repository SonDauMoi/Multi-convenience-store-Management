/**
 * Script để fetch data địa chỉ Việt Nam từ API công khai
 * Nguồn: https://provinces.open-api.vn/api/
 *
 * Chạy script này một lần để tải toàn bộ data và lưu vào file local
 * node src/utils/fetch-vietnam-data.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = "https://provinces.open-api.vn/api";

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

async function fetchAllVietnamData() {
  console.log("🚀 Bắt đầu tải dữ liệu địa chỉ Việt Nam...\n");

  // Fetch danh sách tỉnh/thành
  console.log("📍 Đang tải danh sách tỉnh/thành...");
  const provincesResponse = await fetchData(`${API_BASE}/p/`);
  console.log(`✅ Đã tải ${provincesResponse.length} tỉnh/thành\n`);

  // Transform provinces
  const provinces = provincesResponse.map((p) => ({
    id: p.code,
    name: p.name,
    nameEn: p.name_en || "",
    fullName: p.full_name || p.name,
    codeName: p.code_name || "",
    region: getRegion(p.code),
    type: getProvinceType(p.name),
  }));

  const districts = {};
  const wards = {};
  let totalDistricts = 0;
  let totalWards = 0;

  // Fetch districts và wards cho từng tỉnh
  for (let i = 0; i < provincesResponse.length; i++) {
    const province = provincesResponse[i];
    process.stdout.write(
      `\r📍 Đang tải quận/huyện của ${province.name} (${i + 1}/${
        provincesResponse.length
      })...`
    );

    try {
      // Fetch chi tiết tỉnh với districts
      const provinceDetail = await fetchData(
        `${API_BASE}/p/${province.code}?depth=2`
      );

      if (provinceDetail.districts && provinceDetail.districts.length > 0) {
        districts[province.code] = provinceDetail.districts.map((d) => ({
          id: d.code,
          name: d.name,
          nameEn: d.name_en || "",
          fullName: d.full_name || d.name,
          codeName: d.code_name || "",
          provinceId: province.code,
        }));
        totalDistricts += provinceDetail.districts.length;

        // Fetch wards cho từng district
        for (const district of provinceDetail.districts) {
          const districtDetail = await fetchData(
            `${API_BASE}/d/${district.code}?depth=2`
          );

          if (districtDetail.wards && districtDetail.wards.length > 0) {
            wards[district.code] = districtDetail.wards.map((w) => ({
              id: w.code,
              name: w.name,
              nameEn: w.name_en || "",
              fullName: w.full_name || w.name,
              codeName: w.code_name || "",
              districtId: district.code,
            }));
            totalWards += districtDetail.wards.length;
          }
        }
      }

      // Delay nhỏ để tránh rate limit
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(
        `\n❌ Lỗi khi tải dữ liệu của ${province.name}:`,
        error.message
      );
    }
  }

  console.log(`\n\n✅ Đã xử lý ${totalDistricts} quận/huyện`);
  console.log(`✅ Đã xử lý ${totalWards} phường/xã\n`);

  return { provinces, districts, wards };
}

/**
 * Phân miền tự động dựa trên mã tỉnh
 */
function getRegion(code) {
  const northProvinces = [
    1, 2, 4, 6, 8, 10, 11, 12, 14, 15, 17, 19, 20, 22, 24, 25, 26, 27, 30, 33,
    34, 35, 36, 37, 38, 40, 42, 44, 46, 48, 49, 51, 54, 56, 58, 60, 62, 64, 66,
    67, 68, 70, 72, 74, 75, 77, 80, 82, 83, 84, 86, 87, 88, 89,
  ];
  const centralProvinces = [
    28, 31, 40, 42, 44, 45, 46, 48, 49, 51, 52, 54, 56, 58, 60, 62,
  ];

  if (northProvinces.includes(code) || code < 30) {
    return "north";
  } else if (code >= 92) {
    return "south";
  } else {
    return "central";
  }
}

/**
 * Xác định loại tỉnh/thành
 */
function getProvinceType(name) {
  if (name.startsWith("Thành phố") || name.startsWith("TP.")) {
    return "thanh-pho-trung-uong";
  }
  return "tinh";
}

/**
 * Tạo file export
 */
function generateExportFile(data) {
  const { provinces, districts, wards } = data;

  const fileContent = `/**
 * Dữ liệu địa chỉ hành chính Việt Nam đầy đủ
 * Nguồn: provinces.open-api.vn
 * Cập nhật: ${new Date().toLocaleDateString("vi-VN")}
 * 
 * ${provinces.length} tỉnh/thành
 * ${Object.keys(districts).length} quận/huyện
 * ${Object.keys(wards).length} phường/xã
 */

export const provinces = ${JSON.stringify(provinces, null, 2)};

export const districts = ${JSON.stringify(districts, null, 2)};

export const wards = ${JSON.stringify(wards, null, 2)};

/**
 * Phí ship theo khoảng cách (VND)
 */
export const shippingFees = {
  sameDistrict: 15000,      // Cùng quận/huyện
  sameProvince: 25000,       // Cùng tỉnh/thành
  sameRegion: 40000,         // Cùng miền
  differentRegion: 60000,    // Khác miền
};

/**
 * Tính phí ship dựa trên địa chỉ
 */
export const calculateShippingFee = (storeAddress, customerAddress) => {
  const { provinceId: storeProvinceId, districtId: storeDistrictId } = storeAddress;
  const { provinceId: custProvinceId, districtId: custDistrictId } = customerAddress;

  if (storeDistrictId === custDistrictId) {
    return shippingFees.sameDistrict;
  }

  if (storeProvinceId === custProvinceId) {
    return shippingFees.sameProvince;
  }

  const storeProvince = provinces.find(p => p.id === storeProvinceId);
  const custProvince = provinces.find(p => p.id === custProvinceId);

  if (storeProvince?.region === custProvince?.region) {
    return shippingFees.sameRegion;
  }

  return shippingFees.differentRegion;
};
`;

  const outputPath = path.join(__dirname, "../data/vietnam-address-full.js");
  fs.writeFileSync(outputPath, fileContent, "utf8");

  console.log(`✅ Đã lưu file tại: ${outputPath}\n`);
  console.log("📊 Thống kê:");
  console.log(`   - Tỉnh/Thành: ${provinces.length}`);
  console.log(`   - Quận/Huyện: ${Object.keys(districts).length}`);
  console.log(`   - Phường/Xã: ${Object.keys(wards).length}`);
  console.log(
    `   - Dung lượng: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(
      2
    )} MB\n`
  );
}

// Run script
(async () => {
  try {
    const data = await fetchAllVietnamData();
    generateExportFile(data);
    console.log(
      "🎉 Hoàn tất! Bạn có thể sử dụng file vietnam-address-full.js ngay bây giờ."
    );
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
})();

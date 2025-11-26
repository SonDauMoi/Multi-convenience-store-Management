import axios from "axios";

// GHN API Configuration
const GHN_API_URL = "https://dev-online-gateway.ghn.vn/shiip/public-api";
const GHN_TOKEN = process.env.GHN_TOKEN || "YOUR_GHN_TOKEN_HERE";
const GHN_SHOP_ID = process.env.GHN_SHOP_ID || "YOUR_SHOP_ID";

const ghnClient = axios.create({
  baseURL: GHN_API_URL,
  headers: {
    Token: GHN_TOKEN,
    ShopId: GHN_SHOP_ID,
    "Content-Type": "application/json",
  },
});

/**
 * Tạo đơn hàng vận chuyển trên GHN
 * @param {Object} orderData - Thông tin đơn hàng
 * @returns {Promise<Object>} - Thông tin đơn vận chuyển (mã vận đơn, phí ship)
 */
export const createGHNOrder = async (orderData) => {
  try {
    const {
      toName,
      toPhone,
      toAddress,
      toWardCode,
      toDistrictId,
      codAmount,
      weight,
      length,
      width,
      height,
      serviceTypeId = 2, // 2: Giao hàng tiêu chuẩn
      items,
    } = orderData;

    const payload = {
      to_name: toName,
      to_phone: toPhone,
      to_address: toAddress,
      to_ward_code: toWardCode,
      to_district_id: toDistrictId,
      cod_amount: codAmount || 0,
      weight: weight || 200, // gram (mặc định 200g)
      length: length || 10, // cm
      width: width || 10,
      height: height || 10,
      service_type_id: serviceTypeId,
      payment_type_id: codAmount > 0 ? 2 : 1, // 1: Shop trả, 2: Người nhận trả
      required_note: "CHOXEMHANGKHONGTHU", // Cho xem hàng không thử
      items: items || [],
    };

    const response = await ghnClient.post("/v2/shipping-order/create", payload);

    if (response.data.code === 200) {
      return {
        success: true,
        orderCode: response.data.data.order_code,
        totalFee: response.data.data.total_fee,
        expectedDeliveryTime: response.data.data.expected_delivery_time,
      };
    } else {
      throw new Error(response.data.message || "Tạo đơn GHN thất bại");
    }
  } catch (error) {
    console.error(
      "GHN Create Order Error:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Không thể tạo đơn vận chuyển"
    );
  }
};

/**
 * Tính phí vận chuyển
 * @param {Object} params - Thông tin tính phí
 * @returns {Promise<Object>} - Phí vận chuyển
 */
export const calculateShippingFee = async (params) => {
  try {
    const {
      toDistrictId,
      toWardCode,
      weight = 200,
      serviceTypeId = 2,
    } = params;

    const payload = {
      from_district_id: parseInt(process.env.GHN_FROM_DISTRICT_ID || "1542"), // Quận Tân Bình, TP.HCM
      to_district_id: toDistrictId,
      to_ward_code: toWardCode,
      weight: weight,
      service_type_id: serviceTypeId,
    };

    const response = await ghnClient.post("/v2/shipping-order/fee", payload);

    if (response.data.code === 200) {
      return {
        success: true,
        totalFee: response.data.data.total,
      };
    } else {
      throw new Error(response.data.message || "Tính phí ship thất bại");
    }
  } catch (error) {
    console.error(
      "GHN Calculate Fee Error:",
      error.response?.data || error.message
    );
    return { success: false, totalFee: 0 };
  }
};

/**
 * Lấy danh sách tỉnh/thành phố
 */
export const getProvinces = async () => {
  try {
    const response = await ghnClient.get("/master-data/province");
    return response.data.data;
  } catch (error) {
    console.error("GHN Get Provinces Error:", error);
    return [];
  }
};

/**
 * Lấy danh sách quận/huyện
 */
export const getDistricts = async (provinceId) => {
  try {
    const response = await ghnClient.post("/master-data/district", {
      province_id: provinceId,
    });
    return response.data.data;
  } catch (error) {
    console.error("GHN Get Districts Error:", error);
    return [];
  }
};

/**
 * Lấy danh sách phường/xã
 */
export const getWards = async (districtId) => {
  try {
    const response = await ghnClient.post("/master-data/ward", {
      district_id: districtId,
    });
    return response.data.data;
  } catch (error) {
    console.error("GHN Get Wards Error:", error);
    return [];
  }
};

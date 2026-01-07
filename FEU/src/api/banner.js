import axios from "axios";
import { API_BASE_URL } from "./constant";

// Get public banners
export const getBannersAPI = async (position = null) => {
  try {
    const params = position ? { position } : {};
    const response = await axios.get(`${API_BASE_URL}/banners`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching banners:", error);
    throw error;
  }
};

export default getBannersAPI;

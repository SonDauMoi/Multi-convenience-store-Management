import axios from "axios";
import { API_BASE_URL, API_URL } from "./constant";

export const fetchCategories = async ({ page = 0, size = 100 } = {}) => {
  const url =
    API_BASE_URL +
    API_URL.GET_CATEGORIES +
    `?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`;

  try {
    const result = await axios.get(url, { validateStatus: () => true });
    return result?.data || [];
  } catch (e) {
    console.error(e);
    return [];
  }
};

import { getAccessToken } from "../utils/jwt-helper";
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_URL = {
  GET_CATEGORIES: "/category",
  GET_CATEGORIE: (id) => `/category/${id}`,
  GET_PRODUCTS: "/products",
  GET_PRODUCT: (id) => `/products/${id}`,
};

export const getHeaders = () => {
  return {
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
  };
};

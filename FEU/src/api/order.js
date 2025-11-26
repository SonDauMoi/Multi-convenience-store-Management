import axios from "axios";
import { API_BASE_URL, getHeaders } from "./constant";

export const placeOrderAPI = async (data) => {
  const url = API_BASE_URL + "/orders";
  try {
    const response = await axios(url, {
      method: "POST",
      data: data,
      headers: getHeaders(),
    });
    return response?.data;
  } catch (err) {
    console.error("Order API error:", err.response?.data || err.message);
    throw err.response?.data || new Error(err.message);
  }
};

export const confirmPaymentAPI = async (data) => {
  const url = API_BASE_URL + "/payment/paypal/capture-order";
  try {
    const response = await axios(url, {
      method: "POST",
      data: data,
      headers: getHeaders(),
    });
    return response?.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// PayPal payment APIs
export const createPayPalOrderAPI = async (data) => {
  const url = API_BASE_URL + "/payment/paypal/create-order";
  try {
    const response = await axios(url, {
      method: "POST",
      data: data,
      headers: getHeaders(),
    });
    return response?.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const capturePayPalOrderAPI = async (data) => {
  const url = API_BASE_URL + "/payment/paypal/capture-order";
  try {
    const response = await axios(url, {
      method: "POST",
      data: data,
      headers: getHeaders(),
    });
    return response?.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

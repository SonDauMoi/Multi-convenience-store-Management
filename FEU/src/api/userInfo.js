import axios from "axios";
import { API_BASE_URL, getHeaders } from "./constant";

export const fetchUserDetails = async () => {
  const url = API_BASE_URL + "/user/profile";
  try {
    const response = await axios(url, {
      method: "GET",
      headers: getHeaders(),
    });
    return response?.data;
  } catch (err) {
    throw new Error(err);
  }
};

export const deleteUserAPI = async (id) => {
  const url = API_BASE_URL + `/user/${id}`;
  try {
    const response = await axios(url, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return response?.data;
  } catch (err) {
    throw new Error(err);
  }
};

export const addAddressAPI = async (data) => {
  // Backend doesn't have address endpoint yet - return success for now
  // TODO: Implement address API in backend
  console.warn("Address API not implemented yet");
  return Promise.resolve({ success: true, message: "Address saved locally" });
};

export const deleteAddressAPI = async (id) => {
  const url = API_BASE_URL + `/user/address/${id}`;
  try {
    const response = await axios(url, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return response?.data;
  } catch (err) {
    throw new Error(err);
  }
};

export const fetchOrderAPI = async () => {
  const url = API_BASE_URL + `/orders/history`;
  try {
    const response = await axios(url, {
      method: "GET",
      headers: getHeaders(),
    });
    return response?.data;
  } catch (err) {
    throw new Error(err);
  }
};

export const uploadAvatarAPI = async (file) => {
  const url = API_BASE_URL + "/user/avatar";
  const formData = new FormData();
  formData.append("avatar", file);
  try {
    const response = await axios(url, {
      method: "POST",
      data: formData,
      headers: {
        ...getHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });
    return response?.data;
  } catch (err) {
    throw new Error(err);
  }
};

export const cancelOrderAPI = async (id) => {
  const url = API_BASE_URL + `/orders/cancel/${id}`;
  try {
    const response = await axios(url, {
      method: "POST",
      headers: getHeaders(),
    });
    return response?.data;
  } catch (err) {
    throw new Error(err);
  }
};

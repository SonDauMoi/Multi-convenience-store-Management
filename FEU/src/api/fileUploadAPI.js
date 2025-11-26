import apiClient from "./apiClient";

// Accepts: File object / base64 string / URL string
// Returns: { success, imageUrl }
export const fileUploadAPI = async (input) => {
  // If File / Blob -> send multipart
  if (
    input instanceof File ||
    (typeof Blob !== "undefined" && input instanceof Blob)
  ) {
    const fd = new FormData();
    fd.append("file", input);
    const res = await apiClient.post("/file-upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  // If base64 data URL
  if (typeof input === "string" && input.startsWith("data:")) {
    const res = await apiClient.post("/file-upload", { base64: input });
    return res.data;
  }

  // If plain URL string
  if (typeof input === "string") {
    const res = await apiClient.post("/file-upload", { file: input });
    return res.data;
  }

  throw new Error("Unsupported input type for upload");
};

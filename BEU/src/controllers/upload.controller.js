// Upload file: hỗ trợ 3 kiểu
// 1. Multipart/form-data: field 'file'
// 2. JSON body: { base64: "data:image/png;base64,..." }
// 3. JSON body: { file: "https://domain/path/image.png" } (URL string)
export const uploadFile = async (req, res) => {
  try {
    const { base64, file: fileUrl } = req.body;

    // Ưu tiên multipart nếu có
    if (req.file) {
      const { originalname, mimetype, size, buffer } = req.file;
      const encoded = buffer.toString("base64");
      const dataUrl = `data:${mimetype};base64,${encoded}`;
      return res.status(200).json({
        success: true,
        imageUrl: dataUrl,
        filename: originalname,
        size,
        type: mimetype,
        source: "multipart",
      });
    }

    // Base64 chuỗi hoàn chỉnh
    if (base64 && typeof base64 === "string" && base64.startsWith("data:")) {
      return res.status(200).json({
        success: true,
        imageUrl: base64,
        source: "base64",
      });
    }

    // URL trực tiếp
    if (fileUrl && typeof fileUrl === "string") {
      return res.status(200).json({
        success: true,
        imageUrl: fileUrl,
        source: "url",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Không tìm thấy dữ liệu hợp lệ (multipart file / base64 / URL)",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi upload file",
      error: error.message,
    });
  }
};

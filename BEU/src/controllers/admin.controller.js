import {
  Product,
  Store,
  ProductTemplate,
  StoreProduct,
  Order,
  OrderDetail,
} from "../models/index.js";
import { Op } from "sequelize";

/**
 * Tạo ProductTemplate mới (Admin hoặc Manager)
 * POST /admin/product-templates
 */
export const createProductTemplate = async (req, res) => {
  try {
    const { name, description, image, images, price, category } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        message: "Tên và giá sản phẩm là bắt buộc",
      });
    }

    // Kiểm tra tên trùng
    const existing = await ProductTemplate.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({
        message: "Sản phẩm với tên này đã tồn tại",
      });
    }

    const productTemplate = await ProductTemplate.create({
      name,
      description,
      image,
      images,
      price,
      category: category || "household",
      created_by: req.user.id,
    });

    res.status(201).json({
      message: "Tạo sản phẩm thành công",
      product: productTemplate,
    });
  } catch (error) {
    console.error("Create product template error:", error);
    res.status(500).json({
      message: "Lỗi khi tạo sản phẩm",
      error: error.message,
    });
  }
};

/**
 * Lấy tất cả ProductTemplates (kho sản phẩm chung)
 * GET /admin/product-templates
 */
export const getAllProductTemplates = async (req, res) => {
  try {
    const { search, category } = req.query;

    const where = {};
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }
    if (category) {
      where.category = category;
    }

    const templates = await ProductTemplate.findAll({
      where,
      order: [["id", "DESC"]],
    });

    res.status(200).json(templates);
  } catch (error) {
    console.error("Get product templates error:", error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sản phẩm",
      error: error.message,
    });
  }
};

/**
 * Cập nhật ProductTemplate
 * PUT /admin/product-templates/:id
 */
export const updateProductTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, images, price, category } = req.body;

    const template = await ProductTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    await template.update({
      name: name || template.name,
      description:
        description !== undefined ? description : template.description,
      image: image !== undefined ? image : template.image,
      images: images !== undefined ? images : template.images,
      price: price !== undefined ? price : template.price,
      category: category || template.category,
    });

    res.status(200).json({
      message: "Cập nhật sản phẩm thành công",
      product: template,
    });
  } catch (error) {
    console.error("Update product template error:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật sản phẩm",
      error: error.message,
    });
  }
};

/**
 * Xóa ProductTemplate
 * DELETE /admin/product-templates/:id
 */
export const deleteProductTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await ProductTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Kiểm tra xem có store nào đang dùng không
    const storeProducts = await StoreProduct.findAll({
      where: { product_template_id: id },
    });

    if (storeProducts.length > 0) {
      return res.status(400).json({
        message: `Không thể xóa. Sản phẩm này đang được sử dụng bởi ${storeProducts.length} cửa hàng`,
      });
    }

    await template.destroy();
    res.status(200).json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    console.error("Delete product template error:", error);
    res.status(500).json({
      message: "Lỗi khi xóa sản phẩm",
      error: error.message,
    });
  }
};

/**
 * Admin thêm sản phẩm vào kho của store (thêm số lượng)
 * Manager thêm sản phẩm từ kho chung vào store của mình
 * POST /admin/add-to-store
 */
export const addProductToStore = async (req, res) => {
  try {
    const { productTemplateId, storeId, quantity } = req.body;

    if (!productTemplateId || !storeId || !quantity) {
      return res.status(400).json({
        message: "productTemplateId, storeId và quantity là bắt buộc",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: "Số lượng phải lớn hơn 0",
      });
    }

    // Manager chỉ được thêm vào store của mình
    if (req.user.role === "manager" && req.user.storeId !== storeId) {
      return res.status(403).json({
        message: "Bạn chỉ có thể thêm sản phẩm vào cửa hàng của mình",
      });
    }

    // Kiểm tra store tồn tại
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ message: "Không tìm thấy cửa hàng" });
    }

    // Kiểm tra product template tồn tại
    const template = await ProductTemplate.findByPk(productTemplateId);
    if (!template) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Kiểm tra đã có trong store chưa
    let storeProduct = await StoreProduct.findOne({
      where: {
        product_template_id: productTemplateId,
        store_id: storeId,
      },
    });

    if (storeProduct) {
      // Cộng thêm số lượng
      storeProduct.quantity += parseInt(quantity);
      storeProduct.in_stock = storeProduct.quantity > 0;
      await storeProduct.save();
    } else {
      // Tạo mới
      storeProduct = await StoreProduct.create({
        product_template_id: productTemplateId,
        store_id: storeId,
        quantity: parseInt(quantity),
        in_stock: true,
      });
    }

    // Lấy lại với thông tin đầy đủ
    const result = await StoreProduct.findByPk(storeProduct.id, {
      include: [
        { model: ProductTemplate, as: "template" },
        { model: Store, as: "store", attributes: ["id", "name"] },
      ],
    });

    res.status(200).json({
      message: "Thêm sản phẩm vào kho thành công",
      storeProduct: result,
    });
  } catch (error) {
    console.error("Add product to store error:", error);
    res.status(500).json({
      message: "Lỗi khi thêm sản phẩm vào kho",
      error: error.message,
    });
  }
};

/**
 * Lấy danh sách sản phẩm trong kho của store
 * GET /admin/store-inventory
 */
export const getStoreInventory = async (req, res) => {
  try {
    const { storeId } = req.query;
    const user = req.user;

    let finalStoreId = storeId;

    // Nếu là manager, chỉ được xem kho của store mình
    if (user.role === "manager") {
      finalStoreId = user.storeId;
    }

    if (!finalStoreId) {
      return res.status(400).json({
        message: "storeId là bắt buộc",
      });
    }

    const storeProducts = await StoreProduct.findAll({
      where: { store_id: finalStoreId },
      include: [
        { model: ProductTemplate, as: "template" },
        { model: Store, as: "store", attributes: ["id", "name"] },
      ],
      order: [["id", "DESC"]],
    });

    res.status(200).json(storeProducts);
  } catch (error) {
    console.error("Get store inventory error:", error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách kho",
      error: error.message,
    });
  }
};

/**
 * Lấy tất cả products của admin (chưa gán store hoặc đã gán)
 * GET /inventory/admin/all-products
 */
export const getAllProductsAdmin = async (req, res) => {
  try {
    const { search, category } = req.query;

    const where = {};
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }
    if (category) {
      where.category = category;
    }

    const products = await Product.findAll({
      where,
      order: [["id", "DESC"]],
      include: [
        {
          model: Store,
          as: "store",
          attributes: ["id", "name"],
          required: false, // Include products without store
        },
      ],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sản phẩm",
      error: error.message,
    });
  }
};

/**
 * Cập nhật số lượng sản phẩm trong kho của store
 * PUT /admin/update-quantity/:storeProductId
 */
export const updateStoreProductQuantity = async (req, res) => {
  try {
    const { storeProductId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        message: "Số lượng không hợp lệ",
      });
    }

    const storeProduct = await StoreProduct.findByPk(storeProductId, {
      include: [{ model: Store, as: "store" }],
    });

    if (!storeProduct) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm trong kho" });
    }

    // Nếu là manager, chỉ được cập nhật products của store mình
    if (
      req.user.role === "manager" &&
      storeProduct.store_id !== req.user.storeId
    ) {
      return res.status(403).json({
        message: "Không có quyền cập nhật sản phẩm này",
      });
    }

    storeProduct.quantity = parseInt(quantity);
    storeProduct.in_stock = storeProduct.quantity > 0;
    await storeProduct.save();

    const result = await StoreProduct.findByPk(storeProductId, {
      include: [
        { model: ProductTemplate, as: "template" },
        { model: Store, as: "store", attributes: ["id", "name"] },
      ],
    });

    res.status(200).json({
      message: "Cập nhật số lượng thành công",
      storeProduct: result,
    });
  } catch (error) {
    console.error("Update quantity error:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật số lượng",
      error: error.message,
    });
  }
};

/**
 * Admin xem doanh số của tất cả stores
 * GET /admin/store-revenue
 */
export const getStoreRevenue = async (req, res) => {
  try {
    const { startDate, endDate, storeId } = req.query;

    const where = {
      status: "delivered", // Chỉ tính đơn đã giao
    };

    if (startDate && endDate) {
      where.order_time = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (storeId) {
      where.storeId = storeId;
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Store,
          as: "store",
          attributes: ["id", "name", "address"],
        },
        {
          model: OrderDetail,
          attributes: ["quantity", "price"],
        },
      ],
      order: [["order_time", "DESC"]],
    });

    // Tính tổng doanh thu theo store
    const revenueByStore = {};
    orders.forEach((order) => {
      const storeKey = order.store?.id || "unknown";
      if (!revenueByStore[storeKey]) {
        revenueByStore[storeKey] = {
          storeId: order.store?.id,
          storeName: order.store?.name,
          storeAddress: order.store?.address,
          totalRevenue: 0,
          totalOrders: 0,
          lastOrderDate: null,
        };
      }

      revenueByStore[storeKey].totalRevenue +=
        order.final_price || order.total_price;
      revenueByStore[storeKey].totalOrders += 1;

      // cập nhật thời điểm đơn gần nhất
      const orderTime = order.order_time ? new Date(order.order_time) : null;
      if (orderTime) {
        const prev = revenueByStore[storeKey].lastOrderDate
          ? new Date(revenueByStore[storeKey].lastOrderDate)
          : null;
        if (!prev || orderTime > prev) {
          revenueByStore[storeKey].lastOrderDate = orderTime;
        }
      }
    });

    const result = Object.values(revenueByStore).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    res.status(200).json({
      stores: result,
      totalRevenue: result.reduce((sum, s) => sum + s.totalRevenue, 0),
      totalOrders: result.reduce((sum, s) => sum + s.totalOrders, 0),
    });
  } catch (error) {
    console.error("Get store revenue error:", error);
    res.status(500).json({
      message: "Lỗi khi lấy doanh số",
      error: error.message,
    });
  }
};

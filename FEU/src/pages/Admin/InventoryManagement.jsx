import { useState, useEffect } from "react";
import {
  getAllProductTemplatesAPI,
  getStoreInventoryAPI,
  addProductToStoreAPI,
  updateStoreProductQuantityAPI,
} from "../../api/admin.js";
import { useSelector } from "react-redux";
import "../../styles/AdminPage.css";

const InventoryManagement = () => {
  const user = useSelector((state) => state.auth.user);
  const [templates, setTemplates] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const categories = [
    { value: "", label: "All Categories" },
    { value: "grocery", label: "Grocery" },
    { value: "snack", label: "Snack" },
    { value: "beverage", label: "Beverage" },
    { value: "household", label: "Household" },
    { value: "personal_care", label: "Personal Care" },
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    loadData();
  }, [searchTerm, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load product templates
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      const templatesData = await getAllProductTemplatesAPI(params);
      setTemplates(templatesData.templates || []);

      // Load store inventory (for manager, it auto-filters by their store)
      const inventoryData = await getStoreInventoryAPI(user?.storeId);
      setInventory(inventoryData.inventory || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      alert("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToStore = async (templateId) => {
    const quantity = prompt("Enter quantity to add:");
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    try {
      await addProductToStoreAPI({
        productTemplateId: templateId,
        storeId: user?.storeId,
        quantity: parseInt(quantity),
      });
      alert("Product added to store successfully");
      loadData();
    } catch (error) {
      console.error("Failed to add product:", error);
      alert(error.response?.data?.message || "Failed to add product to store");
    }
  };

  const handleUpdateQuantity = async (
    storeProductId,
    currentQuantity,
    delta
  ) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity < 0) {
      alert("Quantity cannot be negative");
      return;
    }

    try {
      await updateStoreProductQuantityAPI(storeProductId, newQuantity);
      loadData();
    } catch (error) {
      console.error("Failed to update quantity:", error);
      alert("Failed to update quantity");
    }
  };

  const isProductInInventory = (templateId) => {
    return inventory.some((item) => item.product_template_id === templateId);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Store Inventory Management</h1>
        <p style={{ color: "#666", fontSize: "14px", marginTop: "8px" }}>
          Store: {user?.storeId || "N/A"} | Manager: {user?.username}
        </p>
      </div>

      <div className="inventory-layout">
        {/* Left Panel - Product Templates Catalog */}
        <div className="catalog-panel">
          <h2>Available Product Templates</h2>
          <div className="filters-section">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="loading">Loading templates...</div>
          ) : (
            <div className="templates-grid">
              {templates.map((template) => {
                const inInventory = isProductInInventory(template.id);
                return (
                  <div key={template.id} className="template-card">
                    <div className="card-image">
                      {template.image ? (
                        <img src={template.image} alt={template.name} />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </div>
                    <div className="card-content">
                      <h3>{template.name}</h3>
                      <p className="category">{template.category}</p>
                      <p className="price">${template.price}</p>
                      <p className="description">
                        {template.description || "No description"}
                      </p>
                      <button
                        className={inInventory ? "btn-in-inventory" : "btn-add"}
                        onClick={() =>
                          !inInventory && handleAddToStore(template.id)
                        }
                        disabled={inInventory}
                      >
                        {inInventory ? "✓ In Inventory" : "+ Add to Store"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel - Current Inventory */}
        <div className="inventory-panel">
          <h2>My Store Inventory</h2>
          {loading ? (
            <div className="loading">Loading inventory...</div>
          ) : inventory.length === 0 ? (
            <div className="empty-state">
              <p>No products in inventory yet.</p>
              <p style={{ fontSize: "14px", color: "#666" }}>
                Add products from the catalog on the left.
              </p>
            </div>
          ) : (
            <div className="inventory-list">
              {inventory.map((item) => (
                <div key={item.id} className="inventory-item">
                  <div className="item-image">
                    {item.template?.image ? (
                      <img src={item.template.image} alt={item.template.name} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="item-details">
                    <h4>{item.template?.name}</h4>
                    <p className="item-price">${item.template?.price}</p>
                    <p className="item-category">{item.template?.category}</p>
                  </div>
                  <div className="item-quantity">
                    <label>Quantity:</label>
                    <div className="quantity-controls">
                      <button
                        className="btn-quantity"
                        onClick={() =>
                          handleUpdateQuantity(item.id, item.quantity, -1)
                        }
                      >
                        -
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button
                        className="btn-quantity"
                        onClick={() =>
                          handleUpdateQuantity(item.id, item.quantity, 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <p className="item-sold">Sold: {item.sold || 0}</p>
                    <p
                      className={`item-status ${
                        item.in_stock ? "in-stock" : "out-of-stock"
                      }`}
                    >
                      {item.in_stock ? "In Stock" : "Out of Stock"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;

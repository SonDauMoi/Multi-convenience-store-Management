# Kiến trúc hệ thống Multi-Store

## Tổng quan

Hệ thống quản lý chuỗi cửa hàng tiện lợi với 3 vai trò chính:

- **Admin**: Quản lý toàn bộ hệ thống
- **Manager**: Quản lý 1 cửa hàng cụ thể
- **Customer**: Mua hàng

## Cấu trúc Database

### 1. ProductTemplate (Kho sản phẩm chung)

```
product_templates
├── id
├── name (unique)
├── description
├── image (ảnh chính)
├── images (JSON - mảng ảnh chi tiết)
├── price
├── category
└── created_by
```

**Vai trò**:

- Là **template chung** cho tất cả cửa hàng
- Admin tạo/sửa/xóa
- Chứa thông tin cơ bản: tên, mô tả, giá, ảnh

### 2. StoreProduct (Tồn kho từng cửa hàng)

```
store_products
├── id
├── product_template_id (FK → product_templates)
├── store_id (FK → stores)
├── quantity (số lượng tồn kho)
├── sold (đã bán)
└── in_stock (còn hàng hay không)
```

**Vai trò**:

- Lưu **số lượng tồn kho** của từng sản phẩm tại từng cửa hàng
- Manager thêm sản phẩm từ ProductTemplate vào store của mình
- Admin có thể quản lý tồn kho của tất cả stores

### 3. Store (Cửa hàng)

```
stores
├── id
├── name
├── address
├── provinceId
├── districtId
└── wardId
```

### 4. Product (DEPRECATED - Bảng cũ)

**Không còn sử dụng**. Đã migrate sang ProductTemplate + StoreProduct.

---

## Quy trình làm việc

### Admin

#### 1. Quản lý ProductTemplate (Kho sản phẩm chung)

**Tạo sản phẩm mới:**

```
POST /admin/product-templates
Body: {
  name: "Coca Cola 330ml",
  description: "Nước ngọt có gas",
  image: "https://...",
  images: ["https://...1", "https://...2"],
  price: 10000,
  category: "beverage"
}
```

**Sửa sản phẩm:**

```
PUT /admin/product-templates/:id
```

**Xóa sản phẩm:**

```
DELETE /admin/product-templates/:id
```

⚠️ Chỉ xóa được nếu không có store nào đang dùng.

**Xem tất cả sản phẩm:**

```
GET /admin/product-templates
Query: ?search=coca&category=beverage
```

#### 2. Quản lý tồn kho các cửa hàng

**Thêm sản phẩm vào store:**

```
POST /admin/add-to-store
Body: {
  productTemplateId: 1,
  storeId: 2,
  quantity: 100
}
```

**Xem tồn kho của store:**

```
GET /admin/store-inventory?storeId=2
```

**Cập nhật số lượng:**

```
PUT /admin/update-quantity/:storeProductId
Body: { quantity: 50 }
```

#### 3. Thống kê doanh thu

```
GET /admin/store-revenue
Query: ?storeId=2&startDate=2024-01-01&endDate=2024-12-31
```

---

### Manager (Quản lý cửa hàng)

Manager chỉ quản lý cửa hàng của mình (xác định qua `req.user.storeId`).

#### 1. Xem sản phẩm trong kho

```
GET /store-products
→ Trả về danh sách ProductTemplate + quantity của store mình
```

#### 2. Thêm sản phẩm từ kho chung

```
POST /store-products/add
Body: {
  productTemplateId: 1,
  quantity: 50
}
```

#### 3. Cập nhật số lượng

```
PUT /store-products/:id
Body: { quantity: 30 }
```

#### 4. Xóa sản phẩm khỏi store

```
DELETE /store-products/:id
```

---

## API cho Customer (Public)

### 1. Xem danh sách sản phẩm

```
GET /products
Query: ?category=beverage&page=0&size=12&slug=coca-cola
```

**Response**: Danh sách ProductTemplate (có `images`).

### 2. Xem chi tiết sản phẩm

```
GET /products/:id
```

**Response**: ProductTemplate đầy đủ thông tin (bao gồm `images` array).

### 3. Kiểm tra tồn kho tại các cửa hàng

```
GET /store-products/availability/:productTemplateId
```

**Response**:

```json
{
  "success": true,
  "stores": [
    {
      "storeId": 1,
      "storeName": "Chi nhánh Quận 1",
      "storeAddress": "123 Nguyễn Huệ",
      "storeProvinceId": 79,
      "storeDistrictId": 760,
      "quantity": 100
    }
  ]
}
```

### 4. Đặt hàng

Customer chọn store khi thêm vào giỏ hàng → Backend tính phí ship từ store đó đến địa chỉ giao hàng.

---

## Migration từ hệ thống cũ

**Bảng cũ**: `products` (1 product = 1 store)

**Bảng mới**: `product_templates` + `store_products`

Migration đã thực hiện:

1. Chuyển unique products → ProductTemplate
2. Tạo StoreProduct cho mỗi Product cũ
3. Cập nhật OrderDetail references

Script: `migrations/migrate-products-to-templates.js`

---

## Lưu ý quan trọng

### 1. Images field

- **ProductTemplate.images**: `JSON` array - ảnh chi tiết sản phẩm
- **ProductTemplate.image**: `TEXT` - ảnh chính (thumbnail)
- **Product.images**: DEPRECATED (bảng cũ)

### 2. Deprecated APIs

Các endpoint sau **không nên dùng**:

- `POST /products` → Dùng `/admin/product-templates`
- `PUT /products/:id` → Dùng `/admin/product-templates/:id`
- `DELETE /products/:id` → Dùng `/admin/product-templates/:id`

### 3. Phân quyền

- **Admin**: Full access
- **Manager**: Chỉ store của mình (`req.user.storeId`)
- **Customer**: Public read-only

---

## Cập nhật Frontend

### ProductDetails.jsx

```javascript
// Lấy ảnh chi tiết
const productImages = [product.image, ...(product.images || [])].filter(
  Boolean
);

// Hiển thị gallery với thumbnails
```

### Checkout.jsx

```javascript
// Cart items bao gồm:
{
  productTemplateId,
    storeId,
    storeName,
    storeAddress,
    storeProvinceId,
    storeDistrictId;
}

// Tính shipping fee từ store → customer address
```

---

## Testing

### 1. Test ProductTemplate có images

```bash
cd BEU
node -e "import('./src/models/index.js').then(async ({ProductTemplate}) => {
  const p = await ProductTemplate.findByPk(1);
  console.log(p.images);
})"
```

### 2. Test API trả về images

```bash
curl http://localhost:5000/products?slug=coca-cola
```

### 3. Test store availability

```bash
curl http://localhost:5000/store-products/availability/1
```

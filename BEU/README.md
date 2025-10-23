# 🏪 Convenience Store Management API

Hệ thống quản lý cửa hàng tiện lợi với các chức năng: quản lý sản phẩm, giỏ hàng, đơn hàng, người dùng, cửa hàng.

## 📋 Yêu Cầu

- **Node.js**: v14.0.0 hoặc cao hơn
- **PostgreSQL**: v12 hoặc cao hơn
- **npm** hoặc **yarn**

## 🚀 Cài Đặt

### 1. Clone Repository

```bash
git clone <repository_url>
cd BEU
```

### 2. Cài Đặt Dependencies

```bash
npm install
```

### 3. Cấu Hình Environment

Sao chép file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Chỉnh sửa `.env` với thông tin của bạn:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=convenience_store_db
DB_USER=postgres
DB_PASSWORD=your_password
PORT=8000
JWT_SECRET=your_secret_key
```

### 4. Khởi Tạo Database

```bash
node scripts/sync-database.js
```

### 5. Khởi Động Server

```bash
npm start
```

Server sẽ chạy trên: `http://localhost:8000`

## 📚 Cấu Trúc Project

```
BEU/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware.js    # Authentication middleware
│   └── index.js         # Main entry point
├── scripts/             # Utility scripts
├── package.json
├── .env.example         # Environment template
└── README.md
```

## 🔐 API Authentication

Sử dụng JWT token cho authentication:

```
Authorization: Bearer {token}
```

## 📱 Các Chức Năng Chính

### 1. **User Management** (`/user`)

- Đăng ký người dùng
- Đăng nhập
- Quản lý hồ sơ

### 2. **Inventory Management** (`/inventory`)

- Xem danh sách sản phẩm
- Thêm sản phẩm (manager/admin)
- Cập nhật sản phẩm (manager/admin)
- Xóa sản phẩm (admin)

### 3. **Cart Management** (`/cart`)

- Xem giỏ hàng
- Thêm sản phẩm vào giỏ
- Xóa sản phẩm khỏi giỏ
- Cập nhật số lượng

### 4. **Order Management** (`/orders`)

- Tạo đơn hàng
- Xem lịch sử đơn hàng (user)
- Xem đơn hàng chờ duyệt (manager)
- Chấp nhận/Từ chối/Hoàn thành đơn (manager)

### 5. **Store Management** (`/stores`)

- Xem danh sách cửa hàng
- Tạo cửa hàng (admin)
- Cập nhật cửa hàng (admin)

## 🧪 Testing

### Sử dụng Postman

1. Import collection từ `Convenience-Store-API.postman_collection.json`
2. Cấu hình environment variables
3. Test các endpoint

### Cấu trúc Request

```json
{
  "headers": {
    "Authorization": "Bearer {token}",
    "Content-Type": "application/json"
  },
  "body": {
    // request payload
  }
}
```

## 👥 Các Role

| Role        | Quyền                                 |
| ----------- | ------------------------------------- |
| **admin**   | Quản lý toàn bộ hệ thống              |
| **manager** | Quản lý sản phẩm & đơn hàng của store |
| **user**    | Mua hàng & xem lịch sử đơn            |

## 🔄 Quy Trình Mua Hàng

1. User **GET /inventory** → Xem danh sách sản phẩm
2. User **POST /cart/addtocart** → Thêm vào giỏ
3. User **POST /orders** → Tạo đơn hàng
4. Manager **GET /orders/manager/pending** → Xem chờ duyệt
5. Manager **POST /orders/manager/accept/{id}** → Chấp nhận
6. Manager **POST /orders/manager/complete/{id}** → Hoàn thành

## 🛠️ Công Nghệ Sử Dụng

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL + Sequelize ORM
- **Authentication**: JWT (JSON Web Token)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer (optional)

## 📝 License

MIT License - Xem file LICENSE để chi tiết

## 👨‍💻 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:

1. Kiểm tra file `.env` có đúng không
2. Kiểm tra PostgreSQL đã chạy
3. Kiểm tra logs trong folder `logs/`
4. Tạo Issue trên GitHub

---

**Happy Coding! 🚀**

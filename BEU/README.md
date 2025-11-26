# 🏪 Convenience Store Management API

Hệ thống quản lý cửa hàng tiện lợi với các chức năng: quản lý sản phẩm, giỏ hàng, đơn hàng, người dùng, cửa hàng, thanh toán PayPal và đăng nhập Google OAuth.

## ✨ Features

### Authentication & Authorization

- ✅ Đăng nhập/đăng ký bằng username & password
- ✅ Đăng nhập bằng Google OAuth 2.0
- ✅ JWT authentication (access token + refresh token)
- ✅ Role-based access control (user, manager, admin)
- ✅ Password reset via OTP email

### Payment Integration

- ✅ PayPal Checkout (Sandbox mode)
- ✅ Tạo đơn hàng PayPal
- ✅ Capture payment từ PayPal

### Core Features

- ✅ Quản lý sản phẩm (CRUD)
- ✅ Quản lý giỏ hàng
- ✅ Quản lý đơn hàng
- ✅ Quản lý cửa hàng
- ✅ Quản lý inventory
- ✅ Quản lý users và roles

## 📋 Yêu Cầu

- **Node.js**: v14.0.0 hoặc cao hơn
- **PostgreSQL**: v12 hoặc cao hơn
- **npm** hoặc **yarn**
- **Google Cloud Console account** (cho Google OAuth)
- **PayPal Developer account** (cho thanh toán)

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
# Server
PORT=8000

# Database
DB_NAME=convenience-store
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost

# JWT & Session
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret-key

# Email
USER_MAIL=your-email@gmail.com
MAIL_PASS=your-app-password

# PayPal (Sandbox)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox
PAYPAL_CURRENCY=USD

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8000/oauth2/callback/google

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 4. Khởi Tạo Database

```bash
node scripts/sync-database.js
```

### 5. Chạy Migration cho Google OAuth

```bash
node migrations/20241124-add-oauth-fields.js
```

### 6. Khởi Động Server

```bash
npm start
```

Server sẽ chạy trên: `http://localhost:8000`

## 🔐 Google OAuth Setup

Xem hướng dẫn chi tiết tại: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

**Tóm tắt:**

1. Tạo OAuth 2.0 credentials tại [Google Cloud Console](https://console.cloud.google.com/)
2. Thêm authorized redirect URI: `http://localhost:8000/oauth2/callback/google`
3. Copy Client ID và Client Secret vào `.env`
4. Test cấu hình: `node test-google-oauth-config.js`

### API Google OAuth

| Endpoint                       | Method | Mô tả                      |
| ------------------------------ | ------ | -------------------------- |
| `/oauth2/authorization/google` | `GET`  | Khởi tạo Google OAuth flow |
| `/oauth2/callback/google`      | `GET`  | Xử lý callback từ Google   |

**Flow:**

1. Frontend redirect đến `/oauth2/authorization/google`
2. User đăng nhập Google và chấp nhận quyền
3. Google redirect về `/oauth2/callback/google?code=...`
4. Backend tạo/cập nhật user và redirect về frontend với tokens
5. Frontend lưu tokens và đăng nhập user

## 💳 Tích Hợp PayPal Sandbox

1. Tạo ứng dụng trên [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Sao chép `Client ID` và `Client Secret` của sandbox vào file `.env`
3. Giữ `PAYPAL_MODE=sandbox` để test, chỉ đổi thành `live` khi sẵn sàng production
4. Test cấu hình: `node test-paypal-auth.js`

### API Thanh Toán

| Endpoint                        | Method | Mô tả                                            |
| ------------------------------- | ------ | ------------------------------------------------ |
| `/payment/paypal/create-order`  | `POST` | Tạo PayPal Order và trả về các đường dẫn approve |
| `/payment/paypal/capture-order` | `POST` | Capture order sau khi user thanh toán thành công |

**Request mẫu**

```json
POST /payment/paypal/create-order
{
  "user_id": 1,
  "totalAmount": 25.5,
  "currency": "USD"
}
```

```json
POST /payment/paypal/capture-order
{
  "user_id": 1,
  "orderID": "REPLACE_WITH_PAYPAL_ORDER_ID"
}
```

Endpoint `POST /payment` vẫn hoạt động như trước để hỗ trợ các phương thức nội bộ (COD, ví,...).

## 📚 Cấu Trúc Project

```
BEU/
├── src/
│   ├── config/
│   │   ├── database.js      # PostgreSQL configuration
│   │   ├── passport.js      # Google OAuth strategy
│   │   └── paypal.js        # PayPal SDK configuration
│   ├── controllers/
│   │   ├── login.controller.js    # Auth & Registration
│   │   ├── oauth.controller.js    # Google OAuth
│   │   ├── payment.controller.js  # PayPal payment
│   │   ├── products.controller.js
│   │   ├── cart.controller.js
│   │   ├── orders.controller.js
│   │   └── ...
│   ├── models/
│   │   ├── user.model.js          # User with OAuth support
│   │   ├── product.model.js
│   │   ├── order.model.js
│   │   └── ...
│   ├── routes/
│   │   ├── login.routes.js        # /login, /register, /refresh-token
│   │   ├── oauth.routes.js        # /oauth2/*
│   │   ├── payment.routes.js      # /payment/*
│   │   └── ...
│   ├── middleware.js              # JWT verification
│   └── index.js                   # Main entry point
├── migrations/
│   └── 20241124-add-oauth-fields.js  # Database migration
├── scripts/
│   ├── sync-database.js
│   └── recreate-database.js
├── test-google-oauth-config.js    # OAuth config tester
├── test-paypal-auth.js            # PayPal config tester
├── GOOGLE_OAUTH_SETUP.md          # Google OAuth guide
├── OAUTH_COMPLETION_SUMMARY.md    # OAuth summary
├── package.json
├── .env                           # Environment variables
└── README.md
```

## 🔐 API Authentication

### Local Authentication (Username/Password)

```
POST /login
POST /register
POST /refresh-token
POST /logout
```

### Google OAuth

```
GET /oauth2/authorization/google    # Initiate OAuth
GET /oauth2/callback/google         # OAuth callback
```

### JWT Headers

```
Authorization: Bearer {access_token}
```

## 📱 Các Chức Năng Chính

### 1. **Authentication** (`/`)

- `POST /login` - Đăng nhập bằng username/password
- `POST /register` - Đăng ký tài khoản mới
- `POST /refresh-token` - Làm mới access token
- `POST /logout` - Đăng xuất

### 2. **Google OAuth** (`/oauth2`)

- `GET /oauth2/authorization/google` - Bắt đầu OAuth flow
- `GET /oauth2/callback/google` - Xử lý Google callback

### 3. **User Management** (`/user`)

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

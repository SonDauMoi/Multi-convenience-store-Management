import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import LayoutShop from "./pages/Layout.jsx";
import ProductListPage from "./pages/ProductListPage/ProductListPage.jsx";
import ProductDetails from "./pages/ProductDetails/ProductDetails.jsx";
import { loaderProductBySlug } from "./routes/product.js";
import AutheticationWrapper from "./pages/AutheticationWrapper";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import OAuth2loginCallback from "./pages/OAuth2loginCallback";
import Cart from "./pages/Cart/Cart";
import Account from "./pages/Account/Account";
import ProtectedRoute from "./components/ProtectdRouter/ProtectedRouter.jsx";
import Checkout from "./pages/Checkout/Checkout.jsx";
import OrderConfirmed from "./pages/OrderComfirmed/OrderComfirmed.jsx";
import Profile from "./pages/Account/Profile.jsx";
import Orders from "./pages/Account/Orders.jsx";
import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import ManagerDashboard from "./pages/Manager/ManagerDashboard.jsx";
import ManagerOrders from "./pages/Manager/ManagerOrders.jsx";
import ShopPages from "./pages/ShopPages/ShopPages.jsx";
import Logouts from "./pages/Account/Logouts.jsx";
import StripeReturnHandler from "./pages/StripeReturnHandler/StripeReturnHandler.jsx";
import PayPalReturnHandler from "./pages/PayPalReturnHandler/PayPalReturnHandler.jsx";
import Page403 from "./components/Page403.jsx";

/**
 * Hệ thống định tuyến (Routing) chính của ứng dụng.
 * Phân chia rõ ràng giữa các trang công khai (Shop), 
 * trang xác thực (Login/Register) và các trang quản trị (Admin/Manager).
 */
export const router = createBrowserRouter([
  // --- NHÓM ROUTE CỬA HÀNG (PUBLIC & CUSTOMER) ---
  {
    path: "/",
    element: <LayoutShop />,
    children: [
      {
        path: "",
        element: <App />,
      },
      {
        path: "all-products",
        element: <ProductListPage />,
      },
      {
        path: "category/:categoryKey",
        element: <Navigate to="/all-products" replace />,
      },
      {
        path: "product/:productSlug",
        loader: loaderProductBySlug,
        element: <ProductDetails />,
      },
      {
        path: "shops",
        element: <ShopPages />,
      },
      {
        path: "cart-items",
        element: <Cart />,
      },
      {
        path: "account-details/",
        element: (
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "profile",
            element: <ProtectedRoute><Profile /></ProtectedRoute>,
          },
          {
            path: "orders",
            element: <ProtectedRoute><Orders /></ProtectedRoute>,
          },
          {
            path: "logout",
            element: <ProtectedRoute><Logouts /></ProtectedRoute>,
          },
        ],
      },
      {
        path: "checkout",
        element: <Checkout />,
      },
      {
        path: "/orderConfirmed",
        element: <OrderConfirmed />,
      },
      {
        path: "/403",
        element: <Page403 />,
      },
    ],
  },

  // --- NHÓM ROUTE XÁC THỰC (AUTH) ---
  {
    path: "/v1/",
    element: <AutheticationWrapper />,
    children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ],
  },
  { path: "/oauth2/callback", element: <OAuth2loginCallback /> },

  // --- XỬ LÝ THANH TOÁN QUỐC TẾ ---
  { path: "/payment/stripe-success", element: <StripeReturnHandler /> },
  { path: "/payment/paypal-success", element: <PayPalReturnHandler /> },

  // --- NHÓM ROUTE QUẢN TRỊ (ADMIN) ---
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },

  // --- NHÓM ROUTE QUẢN LÝ CỬA HÀNG (MANAGER) ---
  {
    path: "/manager",
    element: (
      <ProtectedRoute requiredRole="manager">
        <ManagerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/orders/:id", // Chi tiết đơn hàng cho manager
    element: (
      <ProtectedRoute requiredRole="manager">
        <ManagerOrders />
      </ProtectedRoute>
    ),
  },
]);

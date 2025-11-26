import { createBrowserRouter } from "react-router-dom";
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
import Checkout from "./pages/Payment/CheckoutPayment.jsx";
import OrderConfirmed from "./pages/OrderComfirmed/OrderComfirmed.jsx";
import Profile from "./pages/Account/Profile.jsx";
import Orders from "./pages/Account/Orders.jsx";
import AdminPanel from "./pages/AdminPanel/AdminPanel.jsx";
import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import ManagerDashboard from "./pages/Manager/ManagerDashboard.jsx";
import ManagerOrders from "./pages/Manager/ManagerOrders.jsx";
import ShopPages from "./pages/ShopPages/ShopPages.jsx";
import Logouts from "./pages/Account/Logouts.jsx";
import StripeReturnHandler from "./pages/StripeReturnHandler/StripeReturnHandler.jsx";
import PayPalReturnHandler from "./pages/PayPalReturnHandler/PayPalReturnHandler.jsx";
import Page403 from "./components/Page403.jsx";
import BannerManagement from "./pages/Admin/BannerManagement.jsx";
import ProductTemplateManagement from "./pages/Admin/ProductTemplateManagement.jsx";
import InventoryManagement from "./pages/Admin/InventoryManagement.jsx";
import StoreRevenueAnalytics from "./pages/Admin/StoreRevenueAnalytics.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LayoutShop />,
    children: [
      {
        path: "",
        element: <App />,
      },
      {
        path: "food",
        element: <ProductListPage category="food" />,
      },
      {
        path: "drink",
        element: <ProductListPage category="drink" />,
      },
      {
        path: "household",
        element: <ProductListPage category="household" />,
      },
      {
        path: "personal",
        element: <ProductListPage category="personal" />,
      },
      {
        path: "all-products",
        element: <ProductListPage />,
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
            element: (
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            ),
          },
          {
            path: "orders",
            element: (
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            ),
          },
          {
            path: "logout",
            element: (
              <ProtectedRoute>
                <Logouts />
              </ProtectedRoute>
            ),
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
  {
    path: "/v1/",
    element: <AutheticationWrapper />,
    children: [
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
    ],
  },
  {
    path: "/oauth2/callback",
    element: <OAuth2loginCallback />,
  },
  {
    path: "/payment/stripe-success",
    element: <StripeReturnHandler />,
  },
  {
    path: "/payment/paypal-success",
    element: <PayPalReturnHandler />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/banners",
    element: (
      <ProtectedRoute requiredRole="admin">
        <BannerManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/product-templates",
    element: (
      <ProtectedRoute requiredRole="admin">
        <ProductTemplateManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/revenue",
    element: (
      <ProtectedRoute requiredRole="admin">
        <StoreRevenueAnalytics />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager",
    element: (
      <ProtectedRoute requiredRole="manager">
        <ManagerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/orders",
    element: (
      <ProtectedRoute requiredRole="manager">
        <ManagerOrders />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/inventory",
    element: (
      <ProtectedRoute requiredRole="manager">
        <InventoryManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/*",
    element: (
      <ProtectedRoute requiredRole="manager">
        <AdminPanel />
      </ProtectedRoute>
    ),
  },
]);

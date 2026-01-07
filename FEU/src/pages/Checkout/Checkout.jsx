import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectCartItems, deleteCart } from "../../store/features/cart";
import { formatDisplayPrice } from "../../utils/price-format";
import StripePayment from "../Payment/StripePayment";
import PayPalCheckout from "../Payment/PayPalCheckout";
import { placeOrderAPI } from "../../api/order";
import { getUserInfo } from "../../utils/jwt-helper";
import { getStoreByIdAPI } from "../../api/store";
import Modal from "../../components/Modal";
import {
  provinces,
  districts,
  wards,
  calculateShippingFee,
} from "../../data/vietnam-address-full";

const Checkout = () => {
  const cartItems = useSelector(selectCartItems);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [paymentMethod, setPaymentMethod] = useState(""); // "", "cod", "online"
  const [onlineMethod, setOnlineMethod] = useState(""); // "", "stripe", "paypal"
  const [storeId, setStoreId] = useState(1); // TODO: lấy từ danh sách cửa hàng hoặc cart
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    phone: "",
    address: "",
    provinceId: "",
    districtId: "",
    wardId: "",
  });

  // Dropdown data
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableWards, setAvailableWards] = useState([]);

  // Phí ship tự động tính
  const [shippingFee, setShippingFee] = useState(0);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  // Địa chỉ store (lấy từ API)
  const [storeAddress, setStoreAddress] = useState({
    provinceId: 1, // Mặc định Hà Nội
    districtId: 102, // Mặc định Hoàn Kiếm
  });

  const userInfo = getUserInfo();
  const userId = userInfo?.userId;
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.subTotal || item.price * item.quantity),
    0
  );
  const finalAmount = totalAmount + shippingFee;

  // Load store address từ API
  useEffect(() => {
    const loadStoreAddress = async () => {
      try {
        const store = await getStoreByIdAPI(storeId);
        if (store.provinceId && store.districtId) {
          setStoreAddress({
            provinceId: store.provinceId,
            districtId: store.districtId,
          });
        }
      } catch (err) {
        console.error("Lỗi tải thông tin store:", err);
        // Giữ giá trị mặc định nếu lỗi
      }
    };
    if (storeId) {
      loadStoreAddress();
    }
  }, [storeId]);

  // Load districts when province changes
  useEffect(() => {
    if (shippingAddress.provinceId) {
      const provinceDistricts = districts[shippingAddress.provinceId] || [];
      setAvailableDistricts(provinceDistricts);
      setAvailableWards([]);
      setShippingAddress((prev) => ({ ...prev, districtId: "", wardId: "" }));
      setShippingFee(0);
    }
  }, [shippingAddress.provinceId]);

  // Load wards when district changes
  useEffect(() => {
    if (shippingAddress.districtId) {
      const districtWards = wards[shippingAddress.districtId] || [];
      setAvailableWards(districtWards);
      setShippingAddress((prev) => ({ ...prev, wardId: "" }));
      setShippingFee(0);
    }
  }, [shippingAddress.districtId]);

  // Calculate shipping fee when district is selected
  useEffect(() => {
    if (shippingAddress.provinceId && shippingAddress.districtId) {
      const fee = calculateShippingFee(storeAddress, {
        provinceId: parseInt(shippingAddress.provinceId),
        districtId: parseInt(shippingAddress.districtId),
      });
      setShippingFee(fee);
    }
  }, [shippingAddress.provinceId, shippingAddress.districtId]);

  const handlePlaceOrder = async () => {
    if (!userId) {
      setModalState({
        isOpen: true,
        type: "warning",
        title: "Chưa đăng nhập",
        message: "Vui lòng đăng nhập để đặt hàng",
        onConfirm: () => {
          navigate("/v1/login");
        },
      });
      return;
    }
    if (paymentMethod === "cod") {
      // Kiểm tra thông tin giao hàng
      if (
        !shippingAddress.name ||
        !shippingAddress.phone ||
        !shippingAddress.address ||
        !shippingAddress.provinceId ||
        !shippingAddress.districtId
      ) {
        setModalState({
          isOpen: true,
          type: "warning",
          title: "Thiếu thông tin",
          message: "Vui lòng nhập đầy đủ thông tin giao hàng",
          onConfirm: null,
        });
        return;
      }

      try {
        const items = cartItems.map((item) => ({
          storeProductId: item.storeProductId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        }));

        const orderData = {
          storeId,
          items,
          payment_method: "cash",
          shipping_fee: shippingFee,
          shipping_address: shippingAddress,
        };

        const res = await placeOrderAPI(orderData);

        // Xóa giỏ hàng Redux sau khi đặt hàng thành công
        dispatch(deleteCart());

        // Chuyển đến trang đơn mua với thông báo thành công
        navigate("/account-details/orders", {
          state: {
            success: true,
            message: `Đặt hàng thành công!`,
            orderId: res.order?.id,
          },
        });
      } catch (err) {
        console.error("Lỗi đặt hàng:", err);
        setModalState({
          isOpen: true,
          type: "error",
          title: "Lỗi đặt hàng",
          message:
            "Lỗi khi tạo đơn hàng: " +
            (err.response?.data?.message || err.message),
          onConfirm: null,
        });
      }
    }
  };

  // Tạo order trước khi thanh toán online
  const handleCreateOrderForOnlinePayment = async () => {
    if (!userId) {
      setModalState({
        isOpen: true,
        type: "warning",
        title: "Chưa đăng nhập",
        message: "Vui lòng đăng nhập để thanh toán",
        onConfirm: () => {
          navigate("/v1/login");
        },
      });
      return null;
    }

    if (
      !shippingAddress.name ||
      !shippingAddress.phone ||
      !shippingAddress.address ||
      !shippingAddress.provinceId ||
      !shippingAddress.districtId
    ) {
      setModalState({
        isOpen: true,
        type: "warning",
        title: "Thiếu thông tin",
        message: "Vui lòng nhập đầy đủ thông tin giao hàng",
        onConfirm: null,
      });
      return null;
    }

    try {
      const items = cartItems.map((item) => ({
        storeProductId: item.storeProductId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      const orderData = {
        storeId,
        items,
        payment_method: onlineMethod === "stripe" ? "stripe" : "paypal",
        shipping_fee: shippingFee,
        shipping_address: shippingAddress,
      };

      // Save order data to localStorage for PayPal return handler
      localStorage.setItem("checkout_orderData", JSON.stringify(orderData));
      localStorage.setItem("checkout_storeId", storeId);
      localStorage.setItem("checkout_userId", String(userId));

      // For PayPal, we don't create order yet - wait for capture
      // For Stripe, create order immediately
      if (onlineMethod === "stripe") {
        const res = await placeOrderAPI(orderData);
        setCreatedOrderId(res.order?.id);
        return res.order?.id;
      }

      // For PayPal, return a placeholder
      return "paypal_pending";
    } catch (err) {
      console.error("Lỗi đặt hàng:", err);
      setModalState({
        isOpen: true,
        type: "error",
        title: "Lỗi đặt hàng",
        message:
          "Lỗi khi tạo đơn hàng: " +
          (err.response?.data?.message || err.message),
        onConfirm: null,
      });
      return null;
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Giỏ hàng trống</h2>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-black text-white rounded"
        >
          Tiếp tục mua sắm
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Modal
        {...modalState}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
      />

      <h1 className="text-3xl font-bold mb-6">Đặt hàng</h1>

      {/* Thông tin giao hàng */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Thông tin giao hàng</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Họ và tên"
            value={shippingAddress.name}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, name: e.target.value })
            }
            className="border p-3 rounded"
          />
          <input
            type="text"
            placeholder="Số điện thoại"
            value={shippingAddress.phone}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, phone: e.target.value })
            }
            className="border p-3 rounded"
          />
          <input
            type="text"
            placeholder="Địa chỉ cụ thể (Số nhà, đường...)"
            value={shippingAddress.address}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                address: e.target.value,
              })
            }
            className="border p-3 rounded md:col-span-2"
          />
          <select
            value={shippingAddress.provinceId}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                provinceId: e.target.value,
              })
            }
            className="border p-3 rounded"
          >
            <option value="">Chọn Tỉnh/Thành phố</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={shippingAddress.districtId}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                districtId: e.target.value,
              })
            }
            className="border p-3 rounded"
            disabled={!shippingAddress.provinceId}
          >
            <option value="">Chọn Quận/Huyện</option>
            {availableDistricts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={shippingAddress.wardId}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                wardId: e.target.value,
              })
            }
            className="border p-3 rounded md:col-span-2"
            disabled={!shippingAddress.districtId}
          >
            <option value="">Chọn Phường/Xã</option>
            {availableWards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tóm tắt đơn hàng */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Tóm tắt đơn hàng</h2>
        {cartItems.map((item, index) => (
          <div
            key={item.productId + "-" + (item.variant?.id || index)}
            className="flex justify-between mb-2"
          >
            <span>
              {item.name} x {item.quantity}
            </span>
            <span>
              {formatDisplayPrice(item.subTotal || item.price * item.quantity)}
            </span>
          </div>
        ))}
        <div className="border-t pt-2 mt-2 space-y-2">
          <div className="flex justify-between">
            <span>Tạm tính:</span>
            <span>{formatDisplayPrice(totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Phí vận chuyển:</span>
            <span>{formatDisplayPrice(shippingFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Tổng cộng:</span>
            <span>{formatDisplayPrice(finalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Chọn phương thức thanh toán */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Phương thức thanh toán</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setOnlineMethod("");
              }}
              className="w-4 h-4"
            />
            <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="online"
              checked={paymentMethod === "online"}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
              }}
              className="w-4 h-4"
            />
            <span className="font-medium">Thanh toán trực tuyến</span>
          </label>
        </div>

        {/* Chọn phương thức online */}
        {paymentMethod === "online" && (
          <div className="mt-4 pl-7 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="onlineMethod"
                value="stripe"
                checked={onlineMethod === "stripe"}
                onChange={(e) => setOnlineMethod(e.target.value)}
                className="w-4 h-4"
              />
              <span>Thẻ tín dụng/ghi nợ (Stripe)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="onlineMethod"
                value="paypal"
                checked={onlineMethod === "paypal"}
                onChange={(e) => setOnlineMethod(e.target.value)}
                className="w-4 h-4"
              />
              <span>PayPal</span>
            </label>
          </div>
        )}
      </div>

      {/* Hiển thị form thanh toán */}
      {paymentMethod === "cod" && (
        <button
          onClick={handlePlaceOrder}
          className="w-full bg-black text-white py-3 rounded-lg text-lg font-semibold hover:bg-gray-800"
        >
          Đặt hàng COD
        </button>
      )}

      {paymentMethod === "online" && onlineMethod === "stripe" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Thanh toán bằng thẻ (Stripe)
          </h3>
          <StripePayment
            totalAmount={finalAmount}
            userId={userId}
            orderId={createdOrderId}
            onCreateOrder={handleCreateOrderForOnlinePayment}
          />
        </div>
      )}

      {paymentMethod === "online" && onlineMethod === "paypal" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Thanh toán bằng PayPal</h3>
          <PayPalCheckout
            totalAmount={finalAmount}
            userId={userId}
            orderId={createdOrderId}
            onCreateOrder={handleCreateOrderForOnlinePayment}
          />
        </div>
      )}
    </div>
  );
};

export default Checkout;

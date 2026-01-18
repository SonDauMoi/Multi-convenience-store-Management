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
  const [createdOrderId, setCreatedOrderId] = useState(null);

  // Store addresses (one per storeId)
  const [storeAddressById, setStoreAddressById] = useState({});

  const storeIds = React.useMemo(() => {
    const ids = Array.from(
      new Set(
        (cartItems || []).map((item) => {
          const id = Number(item?.storeId);
          return Number.isFinite(id) && id > 0 ? id : 1;
        })
      )
    );
    return ids.length ? ids : [1];
  }, [cartItems]);

  const storeIdsKey = React.useMemo(() => storeIds.join(","), [storeIds]);

  const isMultiStore = storeIds.length > 1;

  const userInfo = getUserInfo();
  const userId = userInfo?.userId;
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.subTotal || item.price * item.quantity),
    0
  );

  // Load store addresses (one per storeId)
  useEffect(() => {
    let cancelled = false;
    const loadStoreAddresses = async () => {
      try {
        const entries = await Promise.all(
          storeIds.map(async (id) => {
            try {
              const store = await getStoreByIdAPI(id);
              const provinceId = Number(store?.provinceId) || 1;
              const districtId = Number(store?.districtId) || 102;
              return [id, { provinceId, districtId }];
            } catch (err) {
              console.error("Lỗi tải thông tin store:", err);
              return [id, { provinceId: 1, districtId: 102 }];
            }
          })
        );

        if (cancelled) return;
        const next = Object.fromEntries(entries);
        setStoreAddressById((prev) => ({ ...prev, ...next }));
      } catch (err) {
        console.error("Lỗi tải danh sách store:", err);
      }
    };

    loadStoreAddresses();
    return () => {
      cancelled = true;
    };
  }, [storeIds, storeIdsKey]);

  // Load districts when province changes
  useEffect(() => {
    if (shippingAddress.provinceId) {
      const provinceDistricts = districts[shippingAddress.provinceId] || [];
      setAvailableDistricts(provinceDistricts);
      setAvailableWards([]);
      setShippingAddress((prev) => ({ ...prev, districtId: "", wardId: "" }));
    }
  }, [shippingAddress.provinceId]);

  // Load wards when district changes
  useEffect(() => {
    if (shippingAddress.districtId) {
      const districtWards = wards[shippingAddress.districtId] || [];
      setAvailableWards(districtWards);
      setShippingAddress((prev) => ({ ...prev, wardId: "" }));
    }
  }, [shippingAddress.districtId]);

  const shippingFeeByStore = React.useMemo(() => {
    const destinationProvinceId = Number.parseInt(
      shippingAddress.provinceId,
      10
    );
    const destinationDistrictId = Number.parseInt(
      shippingAddress.districtId,
      10
    );

    if (!destinationProvinceId || !destinationDistrictId) return {};

    const fees = {};
    for (const id of storeIds) {
      const storeAddress = storeAddressById[id];
      if (!storeAddress) continue;

      fees[id] = calculateShippingFee(storeAddress, {
        provinceId: destinationProvinceId,
        districtId: destinationDistrictId,
      });
    }
    return fees;
  }, [
    storeIds,
    storeAddressById,
    shippingAddress.provinceId,
    shippingAddress.districtId,
  ]);

  const shippingFeeTotal = React.useMemo(() => {
    return Object.values(shippingFeeByStore).reduce(
      (sum, fee) => sum + (fee || 0),
      0
    );
  }, [shippingFeeByStore]);

  const finalAmount = totalAmount + shippingFeeTotal;

  const buildItemsForStore = (storeId) => {
    const storeIdNumber = Number(storeId);
    return (cartItems || [])
      .filter((item) => Number(item?.storeId || 1) === storeIdNumber)
      .map((item) => ({
        storeProductId: item.storeProductId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));
  };

  const handlePlaceOrder = async () => {
    if (!userId) {
      setModalState({
        isOpen: true,
        type: "warning",
        title: "Not logged in",
        message: "Please log in to place an order",
        onConfirm: () => {
          navigate("/v1/login");
        },
      });
      return;
    }

    if (paymentMethod === "online" && isMultiStore) {
      setModalState({
        isOpen: true,
        type: "warning",
        title: "Not supported yet",
        message:
          "Online payment doesn't support multiple stores yet. Please choose COD or order from only one store.",
        onConfirm: null,
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
          title: "Missing information",
          message: "Please enter complete shipping information",
          onConfirm: null,
        });
        return;
      }

      try {
        const requests = storeIds.map((id) => {
          const items = buildItemsForStore(id);
          const orderData = {
            storeId: id,
            items,
            payment_method: "cash",
            shipping_fee: shippingFeeByStore[id] || 0,
            shipping_address: shippingAddress,
          };
          return placeOrderAPI(orderData);
        });

        const results = await Promise.all(requests);
        const orderIds = results
          .map((r) => r?.order?.id)
          .filter((id) => id !== null && id !== undefined);

        // Xóa giỏ hàng Redux sau khi đặt hàng thành công
        dispatch(deleteCart());

        // Chuyển đến trang đơn mua với thông báo thành công
        navigate("/account-details/orders", {
          state: {
            success: true,
            message: isMultiStore
              ? `Order placed successfully (${orderIds.length} orders)!`
              : `Order placed successfully!`,
            orderId: orderIds[0],
            orderIds,
          },
        });
      } catch (err) {
        console.error("Order error:", err);
        setModalState({
          isOpen: true,
          type: "error",
          title: "Order error",
          message:
            "Failed to create order: " +
            (err.response?.data?.message || err.message || "Unknown error"),
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
        title: "Not logged in",
        message: "Please log in to continue payment",
        onConfirm: () => {
          navigate("/v1/login");
        },
      });
      return null;
    }

    if (isMultiStore) {
      setModalState({
        isOpen: true,
        type: "warning",
        title: "Not supported yet",
        message:
          "Online payment doesn't support multiple stores yet. Please choose COD or order from only one store.",
        onConfirm: null,
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
        title: "Missing information",
        message: "Please enter complete shipping information",
        onConfirm: null,
      });
      return null;
    }

    try {
      const singleStoreId = storeIds[0] || 1;
      const items = buildItemsForStore(singleStoreId);

      const orderData = {
        storeId: singleStoreId,
        items,
        payment_method: onlineMethod === "stripe" ? "stripe" : "paypal",
        shipping_fee: shippingFeeByStore[singleStoreId] || 0,
        shipping_address: shippingAddress,
      };

      // Save order data to localStorage for PayPal return handler
      localStorage.setItem("checkout_orderData", JSON.stringify(orderData));
      localStorage.setItem("checkout_storeId", singleStoreId);
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
      console.error("Order error:", err);
      setModalState({
        isOpen: true,
        type: "error",
        title: "Order error",
        message:
          "Failed to create order: " +
          (err.response?.data?.message || err.message),
        onConfirm: null,
      });
      return null;
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-black text-white rounded"
        >
          Continue shopping
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

      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {/* Thông tin giao hàng */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Shipping information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full name"
            value={shippingAddress.name}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, name: e.target.value })
            }
            className="border p-3 rounded"
          />
          <input
            type="text"
            placeholder="Phone number"
            value={shippingAddress.phone}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, phone: e.target.value })
            }
            className="border p-3 rounded"
          />
          <input
            type="text"
            placeholder="Street address (house number, street...)"
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
            <option value="">Select Province/City</option>
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
            <option value="">Select District</option>
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
            <option value="">Select Ward</option>
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
        <h2 className="text-xl font-semibold mb-4">Order summary</h2>
        {cartItems.map((item, index) => (
          <div
            key={String(item.storeProductId || item.productId || index)}
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
            <span>Subtotal:</span>
            <span>{formatDisplayPrice(totalAmount)}</span>
          </div>
          {storeIds.map((id) => (
            <div
              key={`ship-${id}`}
              className="flex justify-between text-sm text-gray-600"
            >
              <span>Shipping fee (Store #{id}):</span>
              <span>{formatDisplayPrice(shippingFeeByStore[id] || 0)}</span>
            </div>
          ))}
          <div className="flex justify-between">
            <span>Total shipping:</span>
            <span>{formatDisplayPrice(shippingFeeTotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>{formatDisplayPrice(finalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Chọn phương thức thanh toán */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Payment method</h2>
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
            <span className="font-medium">Cash on Delivery (COD)</span>
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
              disabled={isMultiStore}
              className="w-4 h-4"
            />
            <span className="font-medium">Online payment</span>
          </label>
          {isMultiStore && (
            <div className="text-sm text-gray-600 pl-7">
              Online payment currently supports only one store per checkout.
            </div>
          )}
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
          Place COD Order
        </button>
      )}

      {paymentMethod === "online" && onlineMethod === "stripe" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Pay by card (Stripe)</h3>
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
          <h3 className="text-lg font-semibold mb-4">Pay with PayPal</h3>
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

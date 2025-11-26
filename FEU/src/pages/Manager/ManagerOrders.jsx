import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLoading } from "../../store/features/common";
import {
  getPendingOrdersAPI,
  getManagerOrdersAPI,
  acceptOrderAPI,
  declineOrderAPI,
  createShippingAPI,
  completeOrderAPI,
} from "../../api/managerOrder";

const ManagerOrders = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("pending"); // pending, processing, shipping, delivered
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingData, setShippingData] = useState({
    toName: "",
    toPhone: "",
    toAddress: "",
    toWardCode: "",
    toDistrictId: "",
    weight: 200,
    codAmount: 0,
  });

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    dispatch(setLoading(true));
    try {
      let data;
      if (activeTab === "pending") {
        data = await getPendingOrdersAPI();
      } else {
        data = await getManagerOrdersAPI();
      }

      // Lọc theo tab
      const filtered = data.filter((order) => {
        if (activeTab === "pending") return order.status === "pending";
        if (activeTab === "processing") return order.status === "processing";
        if (activeTab === "shipping") return order.status === "shipping";
        if (activeTab === "delivered") return order.status === "delivered";
        return false;
      });

      setOrders(filtered);
    } catch (error) {
      console.error("Load orders failed:", error);
      alert("Không thể tải danh sách đơn hàng");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAcceptOrder = async (orderId) => {
    if (!confirm("Xác nhận duyệt đơn hàng này?")) return;

    try {
      dispatch(setLoading(true));
      await acceptOrderAPI(orderId);
      alert("Đã duyệt đơn hàng thành công");
      loadOrders();
    } catch (error) {
      alert(
        "Duyệt đơn thất bại: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeclineOrder = async (orderId) => {
    if (!confirm("Xác nhận từ chối đơn hàng này? Hàng sẽ được hoàn lại kho."))
      return;

    try {
      dispatch(setLoading(true));
      await declineOrderAPI(orderId);
      alert("Đã từ chối đơn hàng");
      loadOrders();
    } catch (error) {
      alert(
        "Từ chối đơn thất bại: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCreateShipping = async () => {
    try {
      dispatch(setLoading(true));
      const result = await createShippingAPI(selectedOrder.id, shippingData);
      alert(
        `Tạo đơn GHN thành công!\nMã vận đơn: ${
          result.shipping.code
        }\nPhí ship: ${result.shipping.fee.toLocaleString()}đ`
      );
      setShowShippingModal(false);
      loadOrders();
    } catch (error) {
      alert(
        "Tạo đơn GHN thất bại: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCompleteOrder = async (orderId) => {
    if (!confirm("Xác nhận đơn hàng đã giao thành công?")) return;

    try {
      dispatch(setLoading(true));
      await completeOrderAPI(orderId);
      alert("Đã hoàn thành đơn hàng");
      loadOrders();
    } catch (error) {
      alert(
        "Hoàn thành đơn thất bại: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-gray-100 text-gray-800 border border-gray-300",
      processing: "bg-gray-200 text-black border border-gray-400",
      shipping: "bg-gray-300 text-black border border-gray-500",
      delivered: "bg-black text-white",
      cancelled: "bg-gray-100 text-gray-600 border border-gray-300",
    };

    const labels = {
      pending: "Chờ duyệt",
      processing: "Đang xử lý",
      shipping: "Đang giao",
      delivered: "Hoàn thành",
      cancelled: "Đã hủy",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Quản lý đơn hàng</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-300">
        {["pending", "processing", "shipping", "delivered"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium ${
              activeTab === tab
                ? "border-b-2 border-black text-black"
                : "text-gray-600 hover:text-black"
            }`}
          >
            {tab === "pending" && "Chờ duyệt"}
            {tab === "processing" && "Đang xử lý"}
            {tab === "shipping" && "Đang giao"}
            {tab === "delivered" && "Hoàn thành"}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Không có đơn hàng nào
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Đơn hàng #{order.id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(order.order_time).toLocaleString("vi-VN")}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Khách hàng: {order.user?.name || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  {getStatusBadge(order.status)}
                  <p className="text-lg font-bold mt-2">
                    {order.final_price?.toLocaleString()}đ
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.payment_method}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-4 mb-4">
                <p className="font-medium mb-2">Sản phẩm:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {order.orderDetails?.map((item, idx) => (
                    <li key={idx}>
                      {item.name} x{item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Shipping Info */}
              {order.shipping_code && (
                <div className="bg-gray-50 p-3 rounded mb-4">
                  <p className="text-sm">
                    <span className="font-medium">Mã vận đơn:</span>{" "}
                    {order.shipping_code}
                  </p>
                  {order.shipping_fee > 0 && (
                    <p className="text-sm">
                      <span className="font-medium">Phí ship:</span>{" "}
                      {order.shipping_fee.toLocaleString()}đ
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                {order.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                    >
                      Duyệt đơn
                    </button>
                    <button
                      onClick={() => handleDeclineOrder(order.id)}
                      className="px-4 py-2 border border-black text-black rounded hover:bg-gray-100"
                    >
                      Từ chối
                    </button>
                  </>
                )}

                {order.status === "processing" && (
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShippingData((prev) => ({
                        ...prev,
                        codAmount:
                          order.payment_method === "COD"
                            ? order.final_price
                            : 0,
                      }));
                      setShowShippingModal(true);
                    }}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                  >
                    Gửi GHN
                  </button>
                )}

                {order.status === "shipping" && (
                  <button
                    onClick={() => handleCompleteOrder(order.id)}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                  >
                    Xác nhận giao xong
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Shipping Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Tạo đơn GHN</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên người nhận
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={shippingData.toName}
                  onChange={(e) =>
                    setShippingData({ ...shippingData, toName: e.target.value })
                  }
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={shippingData.toPhone}
                  onChange={(e) =>
                    setShippingData({
                      ...shippingData,
                      toPhone: e.target.value,
                    })
                  }
                  placeholder="0912345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Địa chỉ
                </label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={shippingData.toAddress}
                  onChange={(e) =>
                    setShippingData({
                      ...shippingData,
                      toAddress: e.target.value,
                    })
                  }
                  placeholder="123 Nguyễn Văn Linh"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    District ID
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={shippingData.toDistrictId}
                    onChange={(e) =>
                      setShippingData({
                        ...shippingData,
                        toDistrictId: parseInt(e.target.value),
                      })
                    }
                    placeholder="1542"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ward Code
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={shippingData.toWardCode}
                    onChange={(e) =>
                      setShippingData({
                        ...shippingData,
                        toWardCode: e.target.value,
                      })
                    }
                    placeholder="21211"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Trọng lượng (gram)
                </label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={shippingData.weight}
                  onChange={(e) =>
                    setShippingData({
                      ...shippingData,
                      weight: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="bg-gray-100 p-3 rounded border border-gray-300">
                <p className="text-sm">
                  <span className="font-medium">Thu hộ (COD):</span>{" "}
                  {shippingData.codAmount.toLocaleString()}đ
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateShipping}
                className="flex-1 bg-black text-white py-2 rounded hover:bg-gray-800"
              >
                Tạo đơn GHN
              </button>
              <button
                onClick={() => setShowShippingModal(false)}
                className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerOrders;

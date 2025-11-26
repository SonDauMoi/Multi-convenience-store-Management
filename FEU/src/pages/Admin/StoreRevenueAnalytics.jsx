import { useState, useEffect } from "react";
import { getStoreRevenueAPI } from "../../api/admin.js";

const StoreRevenueAnalytics = () => {
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStore, setSelectedStore] = useState("");

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setEndDate(end.toISOString().split("T")[0]);
    setStartDate(start.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadRevenueData();
    }
  }, [startDate, endDate, selectedStore]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedStore) params.storeId = selectedStore;

      const data = await getStoreRevenueAPI(params);
      setRevenueData(data.stores || []);
    } catch (error) {
      console.error("Failed to load revenue data:", error);
      alert("Không thể tải dữ liệu doanh thu");
    } finally {
      setLoading(false);
    }
  };

  const getTotalRevenue = () => {
    return revenueData.reduce(
      (sum, store) => sum + parseFloat(store.totalRevenue || 0),
      0
    );
  };

  const getTotalOrders = () => {
    return revenueData.reduce(
      (sum, store) => sum + parseInt(store.totalOrders || 0),
      0
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Phân tích Doanh thu Cửa hàng
        </h3>
        <p className="text-sm text-gray-600">
          Xem doanh thu của tất cả các cửa hàng
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Từ ngày
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Đến ngày
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lọc theo cửa hàng (tùy chọn)
          </label>
          <input
            type="number"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            placeholder="ID cửa hàng"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Tổng Doanh thu
          </h4>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(getTotalRevenue())}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Tổng Đơn hàng
          </h4>
          <p className="text-2xl font-bold text-gray-900">{getTotalOrders()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Cửa hàng Hoạt động
          </h4>
          <p className="text-2xl font-bold text-gray-900">
            {revenueData.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            TB/Cửa hàng
          </h4>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(
              revenueData.length > 0
                ? getTotalRevenue() / revenueData.length
                : 0
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-black">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Tên cửa hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Địa chỉ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Tổng đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Doanh thu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    TB/Đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Đơn cuối
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenueData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Không có dữ liệu doanh thu trong khoảng thời gian này
                    </td>
                  </tr>
                ) : (
                  revenueData.map((store) => {
                    const avgOrderValue =
                      store.totalOrders > 0
                        ? parseFloat(store.totalRevenue) /
                          parseInt(store.totalOrders)
                        : 0;

                    return (
                      <tr key={store.storeId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {store.storeId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {store.storeName || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {store.storeAddress || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {store.totalOrders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(store.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(avgOrderValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(store.lastOrderDate)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreRevenueAnalytics;

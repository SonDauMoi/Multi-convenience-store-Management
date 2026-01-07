import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../api/constant";
import store from "../../assets/images/store.png";

const ShopPages = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/stores`);
        const data = Array.isArray(res.data) ? res.data : [];
        const normalized = data.map((s) => ({
          label: s.name || `Store #${s.id}`,
          address: s.address || "",
          mapUrl:
            s.mapUrl ||
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              s.address || s.name || "store"
            )}`,
          isNew: false,
        }));
        setShops(normalized);
      } catch (e) {
        setError("Không thể tải danh sách cửa hàng");
        setShops([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  return (
    <>
      <div className=" py-10 px-5 md:px-12 lg:px-15 my-10">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">
          Cửa hàng của chúng tôi
        </h2>
        {loading && (
          <div className="text-center text-gray-600">
            Đang tải danh sách cửa hàng...
          </div>
        )}
        {!!error && !loading && (
          <div className="text-center text-red-600 mb-4">{error}</div>
        )}
        <div className="flex flex-wrap justify-center gap-6">
          {shops.map((shop, index) => (
            <a
              key={index}
              href={shop.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-104 bg-white rounded-lg shadow-md p-4 text-center hover:shadow-lg transition duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-4">
                <img
                  src={store}
                  alt="store"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <p className="text-gray-800 text-base font-semibold">
                {shop.label}
              </p>
              <p className="text-gray-600 text-sm">{shop.address}</p>
              {shop.isNew && (
                <span className="inline-block mt-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  NEW
                </span>
              )}
            </a>
          ))}
          {!loading && shops.length === 0 && !error && (
            <div className="text-center text-gray-600">
              Chưa có cửa hàng nào.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ShopPages;

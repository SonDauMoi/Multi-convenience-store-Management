import React, { useCallback, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { useState } from "react";
import Modal from "../../components/Modal";
import Breadcrumb from "../../components/Breadcrumb/Breadcrumb";
import SectionHeading from "../../components/Sections/SectionHeading";
import ProductCard from "../../pages/ProductListPage/ProductCard.jsx";
import { useDispatch } from "react-redux";
import { getAllProducts } from "../../api/fetchProducts.js";
import { addItemToCartAction } from "../../store/actions/cartAction.js";
import { formatDisplayPrice } from "../../utils/price-format";
import { getStoresWithProductAPI } from "../../api/storeProduct.js";

const ProductDetails = () => {
  const { product } = useLoaderData();
  const [selectedImage, setSelectedImage] = useState();
  const [breadcrumbLinks, setBreadCrumbLink] = useState();
  const dispatch = useDispatch();
  const [similarProducts, setSimilarProducts] = useState([]);
  const [availableStores, setAvailableStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [error, setError] = useState("");
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  // Get all product images (main + additional)
  const productImages = [
    product?.image,
    ...(Array.isArray(product?.images) ? product.images : []),
  ].filter(Boolean);

  // Set initial image
  useEffect(() => {
    if (!product) return;
    setSelectedImage(productImages[0] || "/placeholder.png");
  }, [product]);

  // Set breadcrumb
  useEffect(() => {
    if (!product) return;
    setBreadCrumbLink([
      { title: "Trang chủ", path: "/" },
      { title: product?.name || product?.title },
    ]);
  }, [product]);

  // Fetch available stores for this product
  useEffect(() => {
    if (!product?.id) return;

    getStoresWithProductAPI(product.id)
      .then((res) => {
        const stores = res?.stores || [];
        setAvailableStores(stores);
        // Tự động chọn cửa hàng đầu tiên nếu có
        if (stores.length > 0 && !selectedStore) {
          setSelectedStore(stores[0]);
        }
      })
      .catch((error) => {
        console.error("Error fetching available stores:", error);
        setAvailableStores([]);
      });
  }, [product?.id]);

  // Fetch similar products (same category)
  useEffect(() => {
    if (!product?.category) return;

    getAllProducts({})
      .then((res) => {
        const products = res?.products || [];
        const sameCategoryProducts = products.filter(
          (item) =>
            item?.category === product?.category && item?.id !== product?.id
        );
        setSimilarProducts(sameCategoryProducts.slice(0, 5));
      })
      .catch((error) => {
        console.error("Error fetching similar products:", error);
        setSimilarProducts([]);
      });
  }, [product?.category, product?.id]);

  const addItemToCart = useCallback(() => {
    if (!selectedStore || selectedStore.quantity <= 0) {
      setError("Vui lòng chọn cửa hàng có sản phẩm");
      return;
    }

    const cartItem = {
      storeProductId: selectedStore.storeProductId, // Use StoreProduct ID instead of ProductTemplate ID
      productId: product.id, // Keep for reference
      thumbnail: product.image || product.thumbnail,
      name: product.name,
      quantity: 1,
      price: product.price,
      storeId: selectedStore.storeId,
      storeName: selectedStore.storeName,
      storeAddress: selectedStore.storeAddress,
    };

    dispatch(addItemToCartAction(cartItem));
    setError("");
    setModalState({
      isOpen: true,
      type: "success",
      title: "Thêm vào giỏ hàng",
      message: `Đã thêm vào giỏ hàng từ ${selectedStore.storeName}`,
      onConfirm: null,
    });
  }, [dispatch, product, selectedStore]);

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-gray-900">Không tìm thấy sản phẩm!</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Modal
        {...modalState}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb links={breadcrumbLinks} />

        <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Product Images Section */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                <img
                  src={selectedImage || "/placeholder.png"}
                  alt={product?.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Image Thumbnails */}
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(img)}
                      className={`aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                        selectedImage === img
                          ? "border-blue-600 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product?.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info Section */}
            <div className="space-y-6">
              {/* Category Badge */}
              {product?.category && (
                <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {product.category}
                </span>
              )}

              {/* Product Name */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                {product?.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold text-gray-900">
                  {formatDisplayPrice(product?.price)}
                </p>
              </div>

              {/* Stock Status with Store Selection */}
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  {availableStores.length > 0 ? (
                    <button
                      onClick={() => setShowStoreModal(true)}
                      className="w-full flex items-center justify-between hover:bg-gray-100 transition-colors rounded p-2"
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-green-700 font-semibold">
                          Còn hàng tại {availableStores.length} cửa hàng
                        </span>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-red-700 font-semibold">
                        Hết hàng
                      </span>
                    </div>
                  )}
                </div>

                {/* Selected Store Display */}
                {selectedStore && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {selectedStore.storeName}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedStore.storeAddress}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Còn {selectedStore.quantity} sản phẩm
                        </p>
                      </div>
                      <button
                        onClick={() => setShowStoreModal(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Đổi
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {product?.description && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Mô tả sản phẩm
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Add to Cart Button */}
              <button
                onClick={addItemToCart}
                disabled={!selectedStore || selectedStore.quantity <= 0}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                  selectedStore && selectedStore.quantity > 0
                    ? "bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.5 1.33325H2.00526C2.85578 1.33325 3.56986 1.97367 3.6621 2.81917L4.3379 9.014C4.43014 9.8595 5.14422 10.4999 5.99474 10.4999H13.205C13.9669 10.4999 14.6317 9.98332 14.82 9.2451L15.9699 4.73584C16.2387 3.68204 15.4425 2.65733 14.355 2.65733H4.5M4.52063 13.5207H5.14563M4.52063 14.1457H5.14563M13.6873 13.5207H14.3123M13.6873 14.1457H14.3123M5.66667 13.8333C5.66667 14.2935 5.29357 14.6666 4.83333 14.6666C4.3731 14.6666 4 14.2935 4 13.8333C4 13.373 4.3731 12.9999 4.83333 12.9999C5.29357 12.9999 5.66667 13.373 5.66667 13.8333ZM14.8333 13.8333C14.8333 14.2935 14.4602 14.6666 14 14.6666C13.5398 14.6666 13.1667 14.2935 13.1667 13.8333C13.1667 13.373 13.5398 12.9999 14 12.9999C14.4602 12.9999 14.8333 13.373 14.8333 13.8333Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Thêm vào giỏ hàng
                </div>
              </button>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-gray-700 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Thanh toán an toàn
                    </p>
                    <p className="text-sm text-gray-600">
                      Hỗ trợ nhiều phương thức
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-gray-700 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Chất lượng đảm bảo
                    </p>
                    <p className="text-sm text-gray-600">Sản phẩm chính hãng</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-gray-700 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Giao hàng nhanh
                    </p>
                    <p className="text-sm text-gray-600">Miễn phí vận chuyển</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-gray-700 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Đổi trả dễ dàng
                    </p>
                    <p className="text-sm text-gray-600">Trong vòng 7 ngày</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6 lg:p-8">
            <SectionHeading title="Sản phẩm tương tự" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 mt-6">
              {similarProducts.map((item) => (
                <ProductCard key={item.id} {...item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Store Selection Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Chọn cửa hàng
              </h2>
              <button
                onClick={() => setShowStoreModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {availableStores.length > 0 ? (
                <div className="space-y-3">
                  {availableStores.map((store) => (
                    <button
                      key={store.storeId}
                      onClick={() => {
                        setSelectedStore(store);
                        setShowStoreModal(false);
                      }}
                      className={`w-full p-5 border-2 rounded-xl text-left transition-all ${
                        selectedStore?.storeId === store.storeId
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg mb-2">
                            {store.storeName}
                          </h3>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-start gap-2">
                              <svg
                                className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span>{store.storeAddress}</span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col items-end gap-2">
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                            Còn {store.quantity}
                          </span>
                          {selectedStore?.storeId === store.storeId && (
                            <svg
                              className="w-6 h-6 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <p className="text-gray-600 font-medium">
                    Hiện tại chưa có cửa hàng nào có sản phẩm này
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowStoreModal(false)}
                className="w-full py-3 px-6 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;

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
  
  // New quantity state
  const [cartQuantity, setCartQuantity] = useState(1);

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
      { title: "Home", path: "/" },
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
        // Shuffling for random recommendation
        const shuffled = products
          .filter((item) => item?.id !== product?.id)
          .sort(() => 0.5 - Math.random());
        setSimilarProducts(shuffled.slice(0, 5));
      })
      .catch((error) => {
        console.error("Error fetching similar products:", error);
        setSimilarProducts([]);
      });
  }, [product?.category, product?.id]);

  const handleQuantityChange = (delta) => {
    const nextVal = cartQuantity + delta;
    if (nextVal >= 1 && nextVal <= (selectedStore?.quantity || 1)) {
      setCartQuantity(nextVal);
    }
  };

  const addItemToCart = useCallback(() => {
    if (!selectedStore || selectedStore.quantity <= 0) {
      setError("Please select a store with stock");
      return;
    }

    const cartItem = {
      storeProductId: selectedStore.storeProductId,
      productId: product.id,
      thumbnail: product.image || product.thumbnail,
      name: product.name,
      quantity: cartQuantity,
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
      title: "Successfully Added",
      message: `Added ${cartQuantity} item(s) from ${selectedStore.storeName} to your cart.`,
      onConfirm: null,
    });
  }, [dispatch, product, selectedStore, cartQuantity]);

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-gray-900">Product not found!</p>
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
                <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium uppercase tracking-wider">
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
                        <span className="text-green-700 font-semibold uppercase text-xs">
                          In stock at {availableStores.length} stores
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
                      <span className="text-red-700 font-semibold uppercase text-xs">
                        Out of stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Selected Store Display */}
                {selectedStore && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg relative">
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
                        <p className="font-semibold text-gray-900 uppercase text-xs">
                          {selectedStore.storeName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {selectedStore.storeAddress}
                        </p>
                        <p className="text-xs text-green-600 mt-1 font-bold">
                          {selectedStore.quantity} units left
                        </p>
                      </div>
                      <button
                        onClick={() => setShowStoreModal(true)}
                        className="absolute top-4 right-4 text-blue-600 hover:text-blue-700 text-[10px] font-black uppercase underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {product?.description && (
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">
                    Product Description
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Quantity Selection */}
              <div className="flex flex-col gap-2 pt-4">
                <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Select Quantity</span>
                <div className="flex items-center w-fit border rounded-lg bg-gray-50 overflow-hidden">
                  <button 
                    onClick={() => handleQuantityChange(-1)} 
                    className="w-10 h-10 flex items-center justify-center font-bold text-lg hover:bg-gray-200 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-gray-900 border-x">{cartQuantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(1)} 
                    className="w-10 h-10 flex items-center justify-center font-bold text-lg hover:bg-gray-200 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={addItemToCart}
                disabled={!selectedStore || selectedStore.quantity <= 0}
                className={`w-full py-4 px-6 rounded-lg font-bold text-sm uppercase tracking-widest transition-all shadow-md active:scale-95 ${
                  selectedStore && selectedStore.quantity > 0
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  Add to cart
                </div>
              </button>

              {error && (
                <p className="text-red-600 text-xs font-bold italic">{error}</p>
              )}

              {/* Features - Translated to English */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <div><p className="font-bold text-xs text-gray-900 uppercase">Secure Payment</p><p className="text-[10px] text-gray-500 uppercase font-medium">Multiple methods supported</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                  <div><p className="font-bold text-xs text-gray-900 uppercase">Quality Assured</p><p className="text-[10px] text-gray-500 uppercase font-medium">Genuine products only</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div><p className="font-bold text-xs text-gray-900 uppercase">Fast Delivery</p><p className="text-[10px] text-gray-500 uppercase font-medium">Free shipping on orders</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                  <div><p className="font-bold text-xs text-gray-900 uppercase">Easy Returns</p><p className="text-[10px] text-gray-500 uppercase font-medium">Within 7 days period</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-12">
            <SectionHeading title="Similar Products" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mt-8">
              {similarProducts.map((item) => (
                <ProductCard key={item.id} {...item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Store Selection Modal - Translated to English */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900">Select Pickup Store</h2>
              <button onClick={() => setShowStoreModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
              {availableStores.map((store) => (
                <button
                  key={store.storeId}
                  onClick={() => { setSelectedStore(store); setShowStoreModal(false); setCartQuantity(1); }}
                  className={`w-full p-4 border-2 rounded-xl text-left transition-all ${selectedStore?.storeId === store.storeId ? "border-black bg-gray-50" : "border-gray-100 hover:border-gray-300"}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900 uppercase text-sm">{store.storeName}</h3>
                      <p className="text-xs text-gray-500 mt-1">{store.storeAddress}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-md tracking-tighter">Stock: {store.quantity}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setShowStoreModal(false)} className="w-full py-3 font-bold uppercase text-xs text-gray-500">Close Window</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;

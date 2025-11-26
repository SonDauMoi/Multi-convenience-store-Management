import React, { useCallback, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { useState } from "react";
import Breadcrumb from "../../components/Breadcrumb/Breadcrumb";
import SvgCreditCard from "../../components/commom/SvgCreditCard";
import SvgCloth from "../../components/commom/SvgCloth";
import SvgShipping from "../../components/commom/SvgShipping";
import SvgReturn from "../../components/commom/SvgReturn";
import SectionHeading from "../../components/Sections/SectionHeading";
import ProductCard from "../../pages/ProductListPage/ProductCard.jsx";
import { useDispatch } from "react-redux";
import { getAllProducts } from "../../api/fetchProducts.js";
import { addItemToCartAction } from "../../store/actions/cartAction.js";
import { formatDisplayPrice } from "../../utils/price-format";

const extraSections = [
  {
    icon: <SvgCreditCard />,
    label: "Secure payment",
  },
  {
    icon: <SvgCloth />,
    label: "Size & Fit",
  },
  {
    icon: <SvgShipping />,
    label: "Free shipping",
  },
  {
    icon: <SvgReturn />,
    label: "Free Shipping & Returns",
  },
];

const ProductDetails = () => {
  const { product } = useLoaderData();
  const [image, setImage] = useState();
  const [breadcrumbLinks, setBreadCrumbLink] = useState();
  const dispatch = useDispatch();
  const [similarProducts, setSimilarProducts] = useState([]);
  const [error, setError] = useState("");

  // Get all product images (main + additional)
  const productImages = [
    product?.image,
    ...(Array.isArray(product?.images) ? product.images : []),
  ].filter(Boolean);

  // Set initial image
  useEffect(() => {
    if (!product) return;
    setImage(productImages[0] || "/placeholder.png");
  }, [product]);

  // Set breadcrumb
  useEffect(() => {
    if (!product) return;
    setBreadCrumbLink([
      { title: "Trang chủ", path: "/" },
      { title: product?.name || product?.title },
    ]);
  }, [product]);

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
    if (!product?.quantity || product.quantity <= 0) {
      setError("Sản phẩm đã hết hàng");
      return;
    }

    const cartItem = {
      productId: product.id,
      thumbnail: product.image || product.thumbnail,
      name: product.name,
      quantity: 1,
      price: product.price,
      storeId: product.storeId,
    };

    dispatch(addItemToCartAction(cartItem));
    setError("");
  }, [dispatch, product]);

  // --- Sau khi đã gọi hết hooks, mới return ---
  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">Product not found!</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row px-10 pt-20 gap-8">
        {/* Product Images */}
        <div className="w-full lg:w-1/2">
          {/* Image Thumbnails */}
          {productImages.length > 1 && (
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {productImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setImage(img)}
                  className={`flex-shrink-0 rounded-lg border-2 overflow-hidden ${
                    image === img ? "border-blue-500" : "border-gray-200"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-16 h-16 object-cover hover:opacity-80"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className="border rounded-lg overflow-hidden">
            <img
              src={image || "/placeholder.png"}
              alt={product?.name}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="w-full lg:w-1/2">
          <Breadcrumb links={breadcrumbLinks} />

          <h1 className="text-3xl font-bold mt-4 mb-2">{product?.name}</h1>

          {/* Category Badge */}
          {product?.category && (
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm mb-4">
              {product.category}
            </span>
          )}

          {/* Price */}
          <p className="text-2xl font-bold text-blue-600 mb-4">
            {formatDisplayPrice(product?.price)}
          </p>

          {/* Stock Status */}
          <div className="mb-6">
            {product?.quantity > 0 ? (
              <p className="text-green-600 font-medium">
                ✓ Còn hàng ({product.quantity} sản phẩm)
              </p>
            ) : (
              <p className="text-red-600 font-medium">✗ Hết hàng</p>
            )}
          </div>

          {/* Description */}
          {product?.description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Mô tả sản phẩm:</h3>
              <p className="text-gray-700">{product.description}</p>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={addItemToCart}
            disabled={!product?.quantity || product.quantity <= 0}
            className={`w-full md:w-auto px-8 py-3 rounded-lg font-medium transition-colors ${
              product?.quantity > 0
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                width="20"
                height="20"
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

          {error && <p className="text-red-600 mt-3 font-medium">{error}</p>}

          {/* Extra Info */}
          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t">
            {extraSections.map((section, index) => (
              <div key={index} className="flex items-center gap-2">
                {section.icon}
                <p className="text-sm text-gray-600">{section.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="px-10 py-12">
          <SectionHeading title="Sản phẩm tương tự" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-6">
            {similarProducts.map((item) => (
              <ProductCard key={item.id} {...item} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetails;

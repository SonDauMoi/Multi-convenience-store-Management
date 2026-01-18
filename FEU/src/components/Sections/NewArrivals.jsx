import React, { useEffect, useState } from "react";
import { getAllProducts } from "../../api/fetchProducts";
import ProductCard from "../../pages/ProductListPage/ProductCard";
import Carousel from "../Carousel";
import { Link } from "react-router-dom";

const NewArrivals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBestSellingProducts = async () => {
      setLoading(true);
      try {
        // Lấy 10 sản phẩm mới nhất (bán chạy - tạm thời dùng ID cao nhất)
        // TODO: Sau này có thể thêm field soldCount vào database để sort theo lượt bán thực tế
        const res = await getAllProducts({ size: 10 });
        if (res && Array.isArray(res.products)) {
          setProducts(res.products);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBestSellingProducts();
  }, []);

  return (
    <div className="flex flex-col px-5 md:px-12 lg:px-15 my-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-black">
          Featured Products
        </h2>
        <Link
          to="/all-products"
          className="text-black hover:text-gray-700 font-medium border-b border-black"
        >
          View All →
        </Link>
      </div>

      {loading && <div className="text-center py-8">Loading products...</div>}

      {!loading && products.length > 0 && (
        <Carousel>
          {products.map((item) => (
            <div key={item.id} className="px-2">
              <ProductCard {...item} title={item.name} />
            </div>
          ))}
        </Carousel>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center text-gray-600 py-8">
          No products available
        </div>
      )}
    </div>
  );
};

export default NewArrivals;

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiShoppingBag, FiCoffee, FiHome, FiUser } from "react-icons/fi";
import { fetchCategories } from "../../api/fetchCategories";

const iconMap = {
  food: <FiShoppingBag size={32} />,
  beverages: <FiCoffee size={32} />,
  household: <FiHome size={32} />,
  "personal care": <FiUser size={32} />,
};

const Bycategory = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const data = await fetchCategories({ size: 8 });
        setCategories(data || []);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  if (loading) {
    return (
      <div className="my-8 px-5 md:px-12 lg:px-15">
        <div className="text-center py-4 text-gray-500">
          Loading categories...
        </div>
      </div>
    );
  }

  if (!categories.length) {
    return null;
  }

  return (
    <div className="my-8 px-5 md:px-12 lg:px-15">
      <h2 className="text-xl md:text-2xl font-bold text-black mb-4 text-center">
        Product Categories
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
        {categories.map((cat) => {
          const categoryKey = cat.name?.toLowerCase() || "";
          const icon = iconMap[categoryKey] || <FiShoppingBag size={32} />;

          return (
            <Link
              key={cat.id}
              to={`/all-products?categoryId=${cat.id}`}
              className="group relative overflow-hidden rounded-lg border border-gray-300 hover:border-black transition-all duration-300 bg-white hover:shadow-md"
            >
              <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[120px] md:min-h-[140px]">
                <div className="mb-2 text-black transform group-hover:scale-110 transition-transform duration-300">
                  {icon}
                </div>
                <h3 className="text-sm md:text-base font-semibold text-center text-black">
                  {cat.name}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Bycategory;

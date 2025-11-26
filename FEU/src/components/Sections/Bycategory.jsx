import React from "react";
import { Link } from "react-router-dom";
import { FiShoppingBag, FiCoffee, FiHome, FiUser } from "react-icons/fi";

const categories = [
  {
    id: "food",
    name: "Thực phẩm",
    path: "/food",
    icon: <FiShoppingBag size={48} />,
    description: "Thực phẩm tươi ngon",
  },
  {
    id: "drink",
    name: "Đồ uống",
    path: "/drink",
    icon: <FiCoffee size={48} />,
    description: "Nước giải khát, cà phê",
  },
  {
    id: "household",
    name: "Gia dụng",
    path: "/household",
    icon: <FiHome size={48} />,
    description: "Đồ dùng gia đình",
  },
  {
    id: "personal",
    name: "Cá nhân",
    path: "/personal",
    icon: <FiUser size={48} />,
    description: "Chăm sóc cá nhân",
  },
];

const Bycategory = () => {
  return (
    <div className="my-10 px-5 md:px-12 lg:px-15">
      <h2 className="text-2xl md:text-3xl font-bold text-black mb-8 text-center">
        Danh mục sản phẩm
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={cat.path}
            className="group relative overflow-hidden rounded border-2 border-gray-300 hover:border-black transition-all duration-300 bg-white"
          >
            <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[200px] md:min-h-[250px]">
              <div className="mb-4 text-black transform group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 text-center text-black">
                {cat.name}
              </h3>
              <p className="text-xs md:text-sm text-gray-600 text-center">
                {cat.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Bycategory;

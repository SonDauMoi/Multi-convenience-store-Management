import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiHome,
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiPackage,
  FiList,
} from "react-icons/fi";
import { getAllProducts } from "../../api/fetchProducts";
import { fetchCategories } from "../../api/fetchCategories";
import { loadCategories } from "../../store/features/category.jsx";
import { formatDisplayPrice } from "../../utils/price-format";

const navs = [
  { to: "/", icon: <FiHome size={22} />, label: "Home" },
  { type: "search", icon: <FiSearch size={22} />, label: "Search" },
  { to: "/cart-items", icon: <FiShoppingCart size={22} />, label: "Cart" },
  {
    to: "/account-details/profile",
    icon: <FiUser size={22} />,
    label: "Account",
  },
];

const Navigation = () => {
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchTimeout = useRef();
  const location = useLocation();
  const navigate = useNavigate();

  const cartLength = useSelector((state) =>
    state.cartState.cart.reduce((sum, item) => sum + (item.quantity || 1), 0)
  );

  const userInfo = useSelector((state) => state.userState?.userInfo);
  const username = userInfo?.name || userInfo?.email?.split("@")[0] || "User";

  const navLinkClass = ({ isActive }) =>
    isActive
      ? "text-black font-semibold border-b-2 border-black pb-1"
      : "text-gray-700 hover:text-black transition-colors";

  // Xử lý tìm kiếm sản phẩm
  useEffect(() => {
    if (!searchOpen) {
      setSearchTerm("");
      setSearchResults([]);
      setLoadingSearch(false);
      return;
    }
    if (!searchTerm) {
      setSearchResults([]);
      setLoadingSearch(false);
      return;
    }
    setLoadingSearch(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        const { products } = await getAllProducts({
          name: searchTerm,
          page: 0,
          size: 5,
        });

        setSearchResults(products || []);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 400);

    return () => clearTimeout(searchTimeout.current);
  }, [searchTerm, searchOpen]);

  useEffect(() => {
    const load = async () => {
      const result = await fetchCategories({ page: 0, size: 100 });
      if (Array.isArray(result) && result.length > 0) {
        dispatch(loadCategories(result));
      }
    };

    load();
  }, [dispatch]);

  return (
    <>
      {/* Hiện thanh tìm kiếm */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-start justify-center bg-black/60 transition-opacity"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl mx-4 mt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-xl shadow-lg flex flex-col px-6 py-4 w-full">
              <div className="flex items-center">
                <FiSearch className="h-5 w-5 text-gray-700 mr-3" />
                <input
                  autoFocus
                  type="text"
                  className="flex-1 bg-transparent outline-none text-lg placeholder-gray-400"
                  placeholder="Search ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* Kết quả tìm kiếm */}
              {searchTerm && (
                <div className="absolute left-0 right-0 mt-12 bg-white rounded-xl shadow-lg max-h-80 overflow-y-auto border border-gray-200">
                  {loadingSearch ? (
                    <div className="p-4 text-center text-gray-500">
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.slice(0, 5).map((product) => {
                      const imageSrc = product.thumbnail;
                      return (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchTerm("");
                            setSearchResults([]);
                            navigate(`/product/${product.id}`);
                          }}
                        >
                          <img
                            src={imageSrc}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%236b7280" font-family="Arial" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDisplayPrice(product.price)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No matching products found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Top Navigation (Desktop/Tablet) */}
      <nav className="fixed top-0 left-0 right-0 z-10 hidden lg:flex items-center py-5 px-6 lg:px-12 xl:px-20 bg-white border-b border-gray-200 shadow-sm">
        {/* Logo */}
        <div className="flex items-center mr-8">
          <NavLink to="/" className="flex items-center gap-3">
            <img
              src="/S-store logo.jpg"
              alt="S-Store Logo"
              className="w-14 h-14 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <span className="text-2xl font-bold text-gray-900">S-Store</span>
          </NavLink>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mr-8">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-3 px-5 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
          >
            <FiSearch className="h-6 w-6 text-gray-500" />
            <span className="text-gray-500 text-base">Search product...</span>
          </button>
        </div>

        {/* Main Navigation Items */}
        <div className="flex items-center gap-10">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
          >
            <FiHome className="h-6 w-6" />
            <span className="text-base font-medium">Home page</span>
          </NavLink>

          <NavLink
            to="/all-products"
            className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
          >
            <FiPackage className="h-6 w-6" />
            <span className="text-base font-medium">Product</span>
          </NavLink>

          <Link
            to="/cart-items"
            className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors relative"
          >
            <FiShoppingCart className="h-6 w-6" />
            <span className="text-base font-medium">Cart</span>
            {cartLength > 0 && (
              <span className="absolute -top-2 -right-2 h-6 w-6 text-xs bg-black text-white rounded-full flex items-center justify-center">
                {cartLength}
              </span>
            )}
          </Link>

          <NavLink
            to="/account-details/orders"
            className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
          >
            <FiList className="h-6 w-6" />
            <span className="text-base font-medium">My orders</span>
          </NavLink>
        </div>

        {/* User Profile */}
        <div className="ml-8">
          <button
            onClick={() => navigate("/account-details/profile")}
            className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
          >
            <FiUser className="h-7 w-7" />
            <span className="text-base font-medium">{username}</span>
          </button>
        </div>
      </nav>

      {/* Hamburger + Mobile Menu Overlay */}
      <div className="lg:hidden flex items-center py-4 px-4 justify-between fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-200">
        <NavLink to="/" className="flex items-center gap-2">
          <img
            src="/S-store logo.jpg"
            alt="S-Store Logo"
            className="w-10 h-10 object-contain"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <span className="text-2xl font-bold text-gray-900">S-Store</span>
        </NavLink>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="focus:outline-none p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-7 h-7 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={
                  menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
        {/* Open Menu */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-60 bg-black/40 transition-opacity duration-300 lg:hidden"
              onClick={() => setMenuOpen(false)}
            >
              {/* Nút X ở góc trên bên phải */}
              <button
                onClick={() => setMenuOpen(false)}
                className="absolute top-4 right-4 z-70 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors focus:outline-none"
                aria-label="Close menu"
              >
                <svg
                  className="w-7 h-7 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="fixed top-0 left-0 h-full w-64 bg-white z-70 border-r border-gray-200 transform translate-x-0 transition-transform duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <NavLink
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2"
                >
                  <img
                    src="/S-store logo.jpg"
                    alt="S-Store Logo"
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <span className="text-xl font-bold text-gray-900">
                    S-Store
                  </span>
                </NavLink>
              </div>
              <ul className="flex flex-col gap-6 px-6 py-6">
                <li>
                  <NavLink
                    to="/"
                    className={navLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Home page
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/all-products"
                    className={navLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Product
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/cart-items"
                    className={navLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Cart
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/account-details/orders"
                    className={navLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    My orders
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/account-details/profile"
                    className={navLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </NavLink>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation (Mobile only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex justify-around items-center h-16 lg:hidden">
        {navs.map((nav) =>
          nav.type === "search" ? (
            <button
              key="search"
              type="button"
              onClick={() => setSearchOpen(true)}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                searchOpen ? "text-black font-semibold" : "text-gray-500"
              }`}
              aria-label="Open search"
            >
              <div className="relative">{nav.icon}</div>
            </button>
          ) : (
            <Link
              key={nav.to}
              to={nav.to}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                location.pathname === nav.to
                  ? "text-black font-semibold"
                  : "text-gray-500"
              }`}
            >
              <div className="relative">
                {nav.label === "Cart" && cartLength > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white rounded-full text-xs w-5 h-5 flex items-center justify-center border border-white">
                    {cartLength}
                  </span>
                )}
                {nav.icon}
              </div>
            </Link>
          )
        )}
      </nav>
    </>
  );
};

export default Navigation;

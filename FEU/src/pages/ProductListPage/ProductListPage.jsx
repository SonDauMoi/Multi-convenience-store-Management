import React, { useEffect, useMemo, useState, useCallback } from "react";
import FilterIcon from "../../components/commom/FilterIcon.jsx";
import PriceFilter from "../../components/Filters/PriceFilter.jsx";
import ProductCard from "./ProductCard.jsx";
import { getAllProducts } from "../../api/fetchProducts.js";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../../store/features/common.jsx";
import { GrPowerReset } from "react-icons/gr";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import { useParams } from "react-router-dom";

const ProductListPage = ({ category }) => {
  const dispatch = useDispatch();
  const { categoryKey } = useParams();
  const categories = useSelector((state) => state.categoryState.categories);

  const resolvedCategoryKey = categoryKey ?? category;

  const selectedCategory = useMemo(() => {
    if (!resolvedCategoryKey || !Array.isArray(categories)) return null;
    const key = String(resolvedCategoryKey);
    return (
      categories.find((c) => String(c?.id) === key || c?.slug === key) || null
    );
  }, [resolvedCategoryKey, categories]);

  const categoryId = useMemo(() => {
    if (selectedCategory?.id) return selectedCategory.id;
    if (resolvedCategoryKey && !isNaN(Number(resolvedCategoryKey))) {
      return Number(resolvedCategoryKey);
    }
    return undefined;
  }, [selectedCategory, resolvedCategoryKey]);

  const formatCategoryFallback = useCallback((value) => {
    if (!value) return "All products";
    const words = String(value).replace(/[_-]+/g, " ").trim().split(/\s+/g);
    return words
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  }, []);

  const [products, setProducts] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000000 });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [size] = useState(12);
  const [totalElements, setTotalElements] = useState(0);

  const categoryTitle =
    selectedCategory?.name || formatCategoryFallback(resolvedCategoryKey);

  // Toggle filter mobile
  const handleFilterToggle = useCallback(
    () => setIsFilterOpen((prev) => !prev),
    []
  );
  const handleCloseFilter = useCallback(() => setIsFilterOpen(false), []);
  const handleResetFilters = useCallback(() => {
    setPriceRange({ min: 0, max: 2000000 });
    setSelectedCategoryFilter(null);
    setSortBy("default");
  }, []);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Fetch products
  useEffect(() => {
    dispatch(setLoading(true));
    const fetchProducts = async () => {
      try {
        const effectiveCategoryId = selectedCategoryFilter || categoryId;
        const res = await getAllProducts({
          category: effectiveCategoryId
            ? undefined
            : resolvedCategoryKey || undefined,
          categoryId: effectiveCategoryId,
          page: page - 1,
          size,
        });
        setProducts(res.products || []);
        setTotalElements(res.totalElements || 0);
      } catch {
        setProducts([]);
        setTotalElements(0);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchProducts();
  }, [
    resolvedCategoryKey,
    categoryId,
    selectedCategoryFilter,
    page,
    size,
    dispatch,
  ]);

  // Reset page when category changes
  useEffect(() => {
    setPage(1);
  }, [resolvedCategoryKey, categoryId, selectedCategoryFilter]);

  // Filter by price and apply sorting
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => {
      const priceMatch = p.price >= priceRange.min && p.price <= priceRange.max;
      return priceMatch;
    });

    // Apply sorting
    if (sortBy === "price-asc") {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === "name-asc") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "newest") {
      filtered = [...filtered].sort((a, b) => b.id - a.id);
    }

    return filtered;
  }, [products, priceRange, sortBy]);

  const totalPages = Math.ceil(totalElements / size);

  // --- Render ---
  const renderFilterSection = () => (
    <div
      className={`
      ${isFilterOpen ? "block" : "hidden"} 
      lg:block 
      w-full lg:w-[280px] xl:w-[320px] 
      p-4 lg:p-6 
      border-b lg:border-r lg:border-b-0 border-gray-300 
      bg-white
      lg:rounded
      lg:max-h-[calc(100vh-40px)] lg:overflow-y-auto
    `}
    >
      <div className="flex justify-between items-center mb-4">
        <p className="text-lg font-semibold text-black">Filters</p>
        <div className="flex gap-2">
          <button
            onClick={handleResetFilters}
            className="text-xl text-gray-600 hover:text-black transition-colors"
            aria-label="Reset filters"
          >
            <GrPowerReset />
          </button>
          <div className="lg:hidden">
            <button
              onClick={handleCloseFilter}
              className="text-gray-600 hover:text-black text-lg"
              aria-label="Close filter"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <h3 className="text-base font-semibold text-black mb-3">Category</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={selectedCategoryFilter === null}
                onChange={() => setSelectedCategoryFilter(null)}
                className="w-4 h-4 text-black focus:ring-black"
              />
              <span className="text-sm text-gray-700">All categories</span>
            </label>
            {Array.isArray(categories) &&
              categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategoryFilter === cat.id}
                    onChange={() => setSelectedCategoryFilter(cat.id)}
                    className="w-4 h-4 text-black focus:ring-black"
                  />
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </label>
              ))}
          </div>
        </div>

        {/* Price Filter */}
        <div>
          <PriceFilter onChange={setPriceRange} />
        </div>
      </div>
    </div>
  );

  const renderProductGrid = () => {
    const gridClass =
      "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4";

    return (
      <div className={gridClass}>
        {filteredProducts?.map((item, index) => (
          <ProductCard
            key={item.id || index}
            id={item.id}
            {...item}
            title={item?.name}
          />
        ))}
      </div>
    );
  };

  const renderEmptyState = () => {
    if (products?.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            No products found in this category.
          </p>
        </div>
      );
    }

    if (filteredProducts?.length === 0 && products?.length > 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            No products match the selected filters.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row bg-white">
        <div className="lg:hidden p-4 border-b border-gray-200">
          <button
            onClick={handleFilterToggle}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:border-black transition-colors"
            aria-label="Toggle filters"
          >
            <FilterIcon />
            <span className="text-sm font-medium text-black">Filters</span>
          </button>
        </div>

        {renderFilterSection()}

        <div className="flex-1 p-4 lg:p-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black mb-2">
                  {categoryTitle}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {selectedCategory
                    ? `Explore high-quality ${categoryTitle.toLowerCase()} products`
                    : "Explore all products"}
                </p>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 font-medium">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black transition-colors"
                >
                  <option value="default">Default</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A-Z</option>
                  <option value="name-desc">Name: Z-A</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          </div>
          {renderProductGrid()}
          {renderEmptyState()}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center my-6 bg-white py-4">
          <Stack spacing={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              sx={{
                "& .MuiPaginationItem-root": {
                  color: "black",
                  borderColor: "rgba(0, 0, 0, 0.23)",
                },
                "& .MuiPaginationItem-root.Mui-selected": {
                  backgroundColor: "black",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                  },
                },
              }}
            />
          </Stack>
        </div>
      )}
    </>
  );
};

export default ProductListPage;

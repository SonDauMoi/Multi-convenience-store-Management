import React, { useEffect, useMemo, useState, useCallback } from "react";
import FilterIcon from "../../components/commom/FilterIcon.jsx";
import PriceFilter from "../../components/Filters/PriceFilter.jsx";
import ProductCard from "./ProductCard.jsx";
import { getAllProducts } from "../../api/fetchProducts.js";
import { useDispatch } from "react-redux";
import { setLoading } from "../../store/features/common.jsx";
import { GrPowerReset } from "react-icons/gr";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

const ProductListPage = ({ category }) => {
  const dispatch = useDispatch();

  const [products, setProducts] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [size] = useState(12);
  const [totalElements, setTotalElements] = useState(0);

  // Category titles in Vietnamese
  const categoryTitles = {
    food: "Thực phẩm",
    drink: "Đồ uống",
    household: "Gia dụng",
    personal: "Cá nhân",
  };

  const categoryTitle = category ? categoryTitles[category] : "Tất cả sản phẩm";

  // Toggle filter mobile
  const handleFilterToggle = useCallback(
    () => setIsFilterOpen((prev) => !prev),
    []
  );
  const handleCloseFilter = useCallback(() => setIsFilterOpen(false), []);
  const handleResetFilters = useCallback(() => {
    setPriceRange({ min: 0, max: 1000000 });
  }, []);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Fetch products
  useEffect(() => {
    dispatch(setLoading(true));
    const fetchProducts = async () => {
      try {
        const res = await getAllProducts({
          category: category || undefined,
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
  }, [category, page, size, dispatch]);

  // Reset page when category changes
  useEffect(() => {
    setPage(1);
  }, [category]);

  // Filter by price only (backend handles category)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const priceMatch = p.price >= priceRange.min && p.price <= priceRange.max;
      return priceMatch;
    });
  }, [products, priceRange]);

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
        <p className="text-lg font-semibold text-black">Bộ lọc</p>
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
          <ProductCard key={item.id || index} {...item} title={item?.name} />
        ))}
      </div>
    );
  };

  const renderEmptyState = () => {
    if (products?.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            Không tìm thấy sản phẩm nào trong danh mục này.
          </p>
        </div>
      );
    }

    if (filteredProducts?.length === 0 && products?.length > 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            Không tìm thấy sản phẩm nào phù hợp với bộ lọc đã chọn.
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
            <span className="text-sm font-medium text-black">Bộ lọc</span>
          </button>
        </div>

        {renderFilterSection()}

        <div className="flex-1 p-4 lg:p-6">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black mb-2">
              {categoryTitle}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Khám phá các sản phẩm {categoryTitle.toLowerCase()} chất lượng cao
            </p>
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

import React from "react";

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) { if (!pages.includes(i)) pages.push(i); }
    if (currentPage < totalPages - 2) pages.push("...");
    if (!pages.includes(totalPages)) pages.push(totalPages);
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-8 py-4">
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1} 
        className="px-4 py-2 border rounded-lg disabled:opacity-30 hover:bg-gray-50 text-sm font-bold transition-all"
      >
        Prev
      </button>
      <div className="flex gap-1">
        {pages.map((p, i) => (
          <button 
            key={i} 
            onClick={() => typeof p === 'number' && onPageChange(p)} 
            disabled={typeof p !== 'number'} 
            className={`w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-black transition-all ${
              currentPage === p ? "bg-black text-white border-black" : 
              p === "..." ? "border-transparent cursor-default" : 
              "bg-white text-gray-700 border-gray-200 hover:border-black hover:text-black shadow-sm"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages} 
        className="px-4 py-2 border rounded-lg disabled:opacity-30 hover:bg-gray-50 text-sm font-bold transition-all"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;

import React from "react";

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  onPrev,
  onNext,
  totalCount,
  skip,
  itemsPerPage,
  productsLength,
  onRowsPerPageChange,
}) => {
  const showingFrom = totalCount > 0 ? skip + 1 : 0;
  const showingTo = Math.min(skip + productsLength, totalCount);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-py-5" style={{ marginTop: '20px' }}>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-center" style={{ gap: '16px' }}>
        <div className="tw-text-sm tw-text-[#666]">
          Showing {showingFrom} to {showingTo} of {totalCount} products
        </div>
        {onRowsPerPageChange && (
          <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-[#666]">
            <label htmlFor="rowsPerPage">Rows per page:</label>
            <select
              id="rowsPerPage"
              value={itemsPerPage}
              onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
              className="pagi-rows-select"
            >
              {ROWS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="tw-flex tw-gap-2 tw-items-center tw-flex-wrap tw-justify-center">
          <button
            className="pagi-btn"
            onClick={onPrev}
            disabled={currentPage === 1}
          >
            &laquo; Prev
          </button>
          {getPageNumbers().map((page) => (
            <button
              key={page}
              className={`pagi-btn ${page === currentPage ? "pagi-active" : ""}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="pagi-btn"
            onClick={onNext}
            disabled={currentPage === totalPages}
          >
            Next &raquo;
          </button>
        </div>
      )}
      <style jsx>{`
.pagi-rows-select { padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; cursor: pointer; background: #fff; }
.pagi-rows-select:hover { border-color: #E92227; }
.pagi-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s ease;
}
.pagi-btn:hover:not(:disabled) { background: #f5f5f5; border-color: #E92227; }
.pagi-btn:disabled { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 600px) { .pagi-btn { padding: 6px 10px; font-size: 12px; } }
.pagi-active { background: #E92227; color: #fff; border-color: #E92227; }
`}</style>
    </div>
  );
};

export default Pagination;

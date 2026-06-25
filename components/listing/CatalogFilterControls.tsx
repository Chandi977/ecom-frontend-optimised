import React, { useEffect, useState } from "react";
import { FiFilter, FiSliders } from "react-icons/fi";

const MOBILE_BREAKPOINT = 900;
const DEFAULT_SORT_OPTIONS = [
  { value: "", label: "Default sorting", disabled: true },
  { value: "high to low", label: "High to Low" },
  { value: "low to high", label: "Low to high" },
];

const CatalogFilterControls = ({
  resultsText,
  sortBy,
  onSortChange,
  renderFilterContent,
  sortOptions = DEFAULT_SORT_OPTIONS,
  showFilterButton = false,
  externalFilterOpen = false,
  onExternalFilterToggle,
}: {
  resultsText: any;
  sortBy: any;
  onSortChange: any;
  renderFilterContent?: any;
  sortOptions?: any;
  showFilterButton?: any;
  externalFilterOpen?: any;
  onExternalFilterToggle?: any;
}) => {
  const [mobilePanel, setMobilePanel] = useState(null);
  const usesExternalFilterToggle = typeof onExternalFilterToggle === "function";
  const hasFilters =
    typeof renderFilterContent === "function" ||
    Boolean(showFilterButton) ||
    usesExternalFilterToggle;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        setMobilePanel(null);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMobilePanel = (panel) => {
    if (panel === "filter" && usesExternalFilterToggle) {
      onExternalFilterToggle();
      return;
    }
    setMobilePanel((currentPanel) => (currentPanel === panel ? null : panel));
  };

  const closeMobilePanel = () => {
    setMobilePanel(null);
  };

  const handleSortSelection = (value) => {
    onSortChange(value);
    closeMobilePanel();
  };

  const isFilterButtonActive = usesExternalFilterToggle
    ? externalFilterOpen
    : mobilePanel === "filter";

  return (
    <>
      <div className="cfc-header">
        <div className="cfc-results">{resultsText}</div>
        <div className="cfc-desktop-sort">
          <div className="cfc-sort-control">
            <p className="cfc-sort-label">Sort:</p>
            <select
              className="cfc-sort-select"
              value={sortBy}
              onChange={(event) => handleSortSelection(event.target.value)}
            >
              {sortOptions.map((option) => (
                <option
                  key={option.value || option.label}
                  value={option.value}
                  disabled={Boolean(option.disabled)}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div
        className={`cfc-mobile-toolbar${hasFilters ? " cfc-mobile-toolbar-two-columns" : ""}`}
      >
        <button
          type="button"
          className={`cfc-mobile-toolbar-btn${mobilePanel === "sort" ? " cfc-mobile-toolbar-btn-active" : ""}`}
          onClick={() => toggleMobilePanel("sort")}
        >
          <FiSliders />
          <span>Sort</span>
        </button>
        {hasFilters && (
          <button
            type="button"
            className={`cfc-mobile-toolbar-btn${isFilterButtonActive ? " cfc-mobile-toolbar-btn-active" : ""}`}
            onClick={() => toggleMobilePanel("filter")}
          >
            <FiFilter />
            <span>Filter</span>
          </button>
        )}
      </div>

      {mobilePanel === "sort" && (
        <div className="cfc-mobile-panel">
          <label className="cfc-mobile-panel-label" htmlFor="mobile-sort-select">
            Sort by
          </label>
          <select
            id="mobile-sort-select"
            className="cfc-mobile-sort-select"
            value={sortBy}
            onChange={(event) => handleSortSelection(event.target.value)}
          >
            {sortOptions.map((option) => (
              <option
                key={`mobile-${option.value || option.label}`}
                value={option.value}
                disabled={Boolean(option.disabled)}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {mobilePanel === "filter" && hasFilters && (
        <div className="cfc-mobile-panel">
          <div className="cfc-mobile-filter-stack">
            {renderFilterContent({ closeMobilePanel, isMobile: true })}
          </div>
        </div>
      )}

      <style jsx>{`
.cfc-header {
  display: flex;
  margin-top: 46px;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  padding-left: 25px;
}
@media (max-width: 900px) {
  .cfc-header { flex-direction: column; align-items: flex-start; padding-left: 0; gap: 10px; }
}
.cfc-results { display: flex; align-items: center; min-width: 0; }
@media (max-width: 900px) { .cfc-results { width: 100%; } }
.cfc-desktop-sort { display: flex; align-items: center; }
@media (max-width: 900px) { .cfc-desktop-sort { display: none; } }
.cfc-sort-control { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
.cfc-sort-label { margin: 0; color: #111827; font-family: "Montserrat", sans-serif; font-size: 15px; font-weight: 600; }
.cfc-sort-select, .cfc-mobile-sort-select {
  width: 193px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #111827;
  font-family: "Montserrat", sans-serif;
  font-size: 14px;
}
.cfc-mobile-toolbar { display: none; }
@media (max-width: 900px) {
  .cfc-mobile-toolbar { display: grid; align-items: center; width: 100%; margin-top: 6px; border-top: 1px solid #d9d9d9; border-bottom: 1px solid #d9d9d9; background: #fff; }
}
.cfc-mobile-toolbar-two-columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.cfc-mobile-toolbar-two-columns .cfc-mobile-toolbar-btn:first-child { border-right: 1px solid #d9d9d9; }
.cfc-mobile-toolbar-btn {
  border: 0;
  background: transparent;
  color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 50px;
  padding: 0 16px;
  font-family: "Montserrat", sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.01em;
}
.cfc-mobile-toolbar-btn-active { color: #182c5a; }
.cfc-mobile-panel { display: none; }
@media (max-width: 900px) {
  .cfc-mobile-panel { display: block; margin-top: 12px; padding: 12px 12px 16px; border: 1px solid #e6e6e6; background: #fff; max-height: min(70vh, 720px); overflow-y: auto; -webkit-overflow-scrolling: touch; }
}
.cfc-mobile-panel-label { display: block; margin-bottom: 8px; color: #111827; font-family: "Montserrat", sans-serif; font-size: 14px; font-weight: 600; }
.cfc-mobile-filter-stack { display: flex; flex-direction: column; gap: 16px; }
.cfc-mobile-filter-stack > * { width: 100%; }
@media (max-width: 900px) { .cfc-mobile-sort-select { width: 100%; } }
`}</style>
    </>
  );
};

export default CatalogFilterControls;

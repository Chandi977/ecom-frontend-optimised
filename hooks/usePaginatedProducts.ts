import { useCallback, useEffect, useState } from "react";
import { getPrimaryPriceTier } from "../utils/productCatalog";

export const ITEMS_PER_PAGE = 10;

const sortProductsByPrice = (items, sortBy) => {
  if (!sortBy) {
    return items;
  }
  if (sortBy === "low to high") {
    return items
      .slice()
      .sort(
        (a, b) =>
          getPrimaryPriceTier(a).sellingPrice -
          getPrimaryPriceTier(b).sellingPrice,
      );
  }
  if (sortBy === "high to low") {
    return items
      .slice()
      .sort(
        (a, b) =>
          getPrimaryPriceTier(b).sellingPrice -
          getPrimaryPriceTier(a).sellingPrice,
      );
  }
  return items;
};

export const usePaginatedProducts = ({
  initialProducts = [],
  initialMeta = null,
  initialFilter = {},
  fetcher,
  itemsPerPage: initialItemsPerPage = ITEMS_PER_PAGE,
}) => {
  const [products, setProducts] = useState(initialProducts);
  const [sortBy, setSortBy] = useState("");
  const [totalCount, setTotalCount] = useState(
    typeof initialMeta?.total === "number"
      ? initialMeta.total
      : initialProducts.length,
  );
  const [skip, setSkip] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilter, setCurrentFilter] = useState(initialFilter);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const currentPage = Math.floor(skip / itemsPerPage) + 1;

  const fetchProducts = useCallback(
    async (newSkip, filterPayload, overrideLimit = null) => {
      const limitToUse = overrideLimit ?? itemsPerPage;
      setIsLoading(true);
      try {
        const requestPayload = {
          ...filterPayload,
          skip: newSkip,
          limit: limitToUse,
          includeMeta: true,
        };
        const response = await fetcher(requestPayload);
        const items = response?.data?.data ?? [];
        const responseMeta = response?.data?.meta;
        const sortedItems = sortBy ? sortProductsByPrice(items, sortBy) : items;
        setProducts(sortedItems);
        setTotalCount(
          typeof responseMeta?.total === "number"
            ? responseMeta.total
            : items.length,
        );
        setSkip(newSkip);
      } catch (error) {
        console.error("Error occurred:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [fetcher, itemsPerPage, sortBy],
  );

  const applyFilter = useCallback(
    async (payload) => {
      setCurrentFilter(payload);
      await fetchProducts(0, payload);
    },
    [fetchProducts],
  );

  const goToPage = useCallback(
    (page) => {
      const newSkip = (page - 1) * itemsPerPage;
      fetchProducts(newSkip, currentFilter);
    },
    [fetchProducts, itemsPerPage, currentFilter],
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const changeRowsPerPage = useCallback(
    (newRowsPerPage) => {
      setItemsPerPage(newRowsPerPage);
      setSkip(0);
      fetchProducts(0, currentFilter, newRowsPerPage);
    },
    [fetchProducts, currentFilter],
  );

  useEffect(() => {
    if (sortBy && products.length > 0) {
      setProducts((prev) => sortProductsByPrice(prev, sortBy));
    }
  }, [sortBy]);

  // Initialize from SSR props
  useEffect(() => {
    const nextItems = Array.isArray(initialProducts) ? initialProducts : [];
    const sortedItems = sortBy
      ? sortProductsByPrice(nextItems, sortBy)
      : nextItems;
    setProducts(sortedItems);
    setTotalCount(
      typeof initialMeta?.total === "number"
        ? initialMeta.total
        : nextItems.length,
    );
    setSkip(0);
    setCurrentFilter(initialFilter);
  }, [initialProducts, initialMeta, initialFilter]);

  return {
    products,
    sortBy,
    setSortBy,
    totalCount,
    totalPages,
    currentPage,
    skip,
    isLoading,
    applyFilter,
    goToPage,
    nextPage,
    prevPage,
    itemsPerPage,
    changeRowsPerPage,
  };
};

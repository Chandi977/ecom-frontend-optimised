import { useCallback, useEffect, useRef, useState } from "react";
import { getPrimaryPriceTier } from "../utils/productCatalog";

export const DEFAULT_INITIAL_LIMIT = 20;
export const DEFAULT_NEXT_LIMIT = 10;

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

const getTotalCount = (meta) =>
  typeof meta?.total === "number" ? meta.total : null;

const getHasMore = (meta, count, limit) => {
  if (typeof meta?.total === "number") {
    return count < meta.total;
  }
  return Number.isFinite(limit) ? count === limit : false;
};

export const useInfiniteProducts = ({
  initialProducts = [],
  initialMeta = null,
  initialFilter = {},
  fetcher,
  initialLimit = DEFAULT_INITIAL_LIMIT,
  nextLimit = DEFAULT_NEXT_LIMIT,
}) => {
  const [products, setProducts] = useState(initialProducts);
  const [sortBy, setSortBy] = useState("");
  const [totalCount, setTotalCount] = useState(getTotalCount(initialMeta));
  const [offset, setOffset] = useState(initialProducts.length);
  const [hasMore, setHasMore] = useState(
    getHasMore(initialMeta, initialProducts.length, initialLimit)
  );
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilter, setCurrentFilter] = useState(initialFilter);
  const [observerNode, setObserverNode] = useState(null);
  const sortRef = useRef(sortBy);

  useEffect(() => {
    sortRef.current = sortBy;
  }, [sortBy]);

  const applyFilter = useCallback(
    async (payload) => {
      setIsLoading(true);
      try {
        const requestPayload = {
          ...payload,
          skip: 0,
          limit: initialLimit,
          includeMeta: true,
        };
        const response = await fetcher(requestPayload);
        const items = response?.data?.data ?? [];
        const responseMeta = response?.data?.meta;
        const sortedItems = sortRef.current
          ? sortProductsByPrice(items, sortRef.current)
          : items;
        setProducts(sortedItems);
        setTotalCount(getTotalCount(responseMeta));
        setOffset(sortedItems.length);
        setHasMore(getHasMore(responseMeta, sortedItems.length, initialLimit));
        setCurrentFilter(payload);
      } catch (error) {
        console.error("Error occurred:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [fetcher, initialLimit]
  );

  const fetchMore = useCallback(async () => {
    if (isFetchingMore || !hasMore || isLoading) {
      return;
    }
    setIsFetchingMore(true);
    try {
      const response = await fetcher({
        ...currentFilter,
        skip: offset,
        limit: nextLimit,
        includeMeta: true,
      });
      const nextItems = response?.data?.data ?? [];
      const responseMeta = response?.data?.meta;
      setProducts((prev) => {
        const merged = [...prev, ...nextItems];
        return sortRef.current
          ? sortProductsByPrice(merged, sortRef.current)
          : merged;
      });
      setOffset((prev) => {
        const nextOffset = prev + nextItems.length;
        if (typeof responseMeta?.total === "number") {
          setTotalCount(responseMeta.total);
          setHasMore(nextOffset < responseMeta.total);
        } else {
          setHasMore(nextItems.length === nextLimit);
        }
        return nextOffset;
      });
    } catch (error) {
      console.error("Error occurred:", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [
    currentFilter,
    fetcher,
    hasMore,
    isFetchingMore,
    isLoading,
    nextLimit,
    offset,
  ]);

  const loadMoreRef = useCallback((node) => {
    setObserverNode((prev) => (prev === node ? prev : node));
  }, []);

  useEffect(() => {
    if (!observerNode || !hasMore) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(observerNode);
    return () => observer.disconnect();
  }, [fetchMore, hasMore, observerNode]);

  useEffect(() => {
    const nextItems = Array.isArray(initialProducts) ? initialProducts : [];
    const responseMeta = initialMeta;
    const sortedItems = sortRef.current
      ? sortProductsByPrice(nextItems, sortRef.current)
      : nextItems;
    setProducts(sortedItems);
    setTotalCount(getTotalCount(responseMeta));
    setOffset(sortedItems.length);
    setHasMore(getHasMore(responseMeta, sortedItems.length, initialLimit));
    setCurrentFilter(initialFilter);
  }, [initialProducts, initialMeta, initialFilter, initialLimit]);

  useEffect(() => {
    if (!sortBy) {
      return;
    }
    setProducts((prev) => sortProductsByPrice(prev, sortBy));
  }, [sortBy]);

  return {
    products,
    sortBy,
    setSortBy,
    totalCount,
    hasMore,
    isFetchingMore,
    isLoading,
    applyFilter,
    loadMoreRef,
  };
};

import { useCallback, useEffect, useRef, useState } from "react";
import { sortProducts } from "../utils/productSorting";

export const DEFAULT_INITIAL_LIMIT = 20;
export const DEFAULT_NEXT_LIMIT = 10;

const getTotalCount = (meta: any) =>
  typeof meta?.total === "number" ? meta.total : null;

const getHasMore = (meta: any, count: number, limit: number) => {
  if (typeof meta?.total === "number") {
    return count < meta.total;
  }
  return Number.isFinite(limit) ? count === limit : false;
};

export const useInfiniteProducts = ({
  initialProducts = [] as any[],
  initialMeta = null as any,
  initialFilter = {} as any,
  fetcher,
  initialLimit = DEFAULT_INITIAL_LIMIT,
  nextLimit = DEFAULT_NEXT_LIMIT,
}: {
  initialProducts?: any[];
  initialMeta?: any;
  initialFilter?: any;
  fetcher: (payload: any) => Promise<any>;
  initialLimit?: number;
  nextLimit?: number;
}) => {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [sortBy, setSortBy] = useState("");
  const [totalCount, setTotalCount] = useState(getTotalCount(initialMeta));
  const [offset, setOffset] = useState(initialProducts.length);
  const [hasMore, setHasMore] = useState(
    getHasMore(initialMeta, initialProducts.length, initialLimit)
  );
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilter, setCurrentFilter] = useState(initialFilter);
  const [observerNode, setObserverNode] = useState<any>(null);
  const sortRef = useRef(sortBy);

  useEffect(() => {
    sortRef.current = sortBy;
  }, [sortBy]);

  const applyFilter = useCallback(
    async (payload: any) => {
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
          ? sortProducts(items, sortRef.current)
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
          ? sortProducts(merged, sortRef.current)
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

  const loadMoreRef = useCallback((node: any) => {
    setObserverNode((prev: any) => (prev === node ? prev : node));
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
      ? sortProducts(nextItems, sortRef.current)
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
    setProducts((prev) => sortProducts(prev, sortBy));
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

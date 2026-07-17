import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Brand,
  buildBrandNameById,
  fetchBrands,
  findBrandIdByName,
  findBrandIdBySlug,
} from "../utils/brands";

type BrandContextValue = {
  brands: Brand[];
  brandNameById: Record<string, string>;
  // Resolve a brand _id from a brand name or route slug (case-insensitive).
  resolveId: (nameOrSlug: string) => string | undefined;
};

const BrandContext = createContext<BrandContextValue>({
  brands: [],
  brandNameById: {},
  resolveId: () => undefined,
});

export const BrandProvider = ({ children }: { children: React.ReactNode }) => {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    let active = true;
    fetchBrands().then((list) => {
      if (active) setBrands(list);
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<BrandContextValue>(() => {
    const brandNameById = buildBrandNameById(brands);
    return {
      brands,
      brandNameById,
      resolveId: (nameOrSlug: string) =>
        findBrandIdByName(brands, nameOrSlug) ||
        findBrandIdBySlug(brands, nameOrSlug),
    };
  }, [brands]);

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
};

export const useBrands = (): BrandContextValue => useContext(BrandContext);

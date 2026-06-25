const PACKPRO_TAPE_CATEGORY_IDS = ["6557df64301ec4f2f4266141"];
const PACKPRO_CARRY_BAG_CATEGORY_IDS = [
  "6557df71301ec4f2f4266145",
  "689d73214687bb4e437542e0",
];
const PACKPRO_FOOD_WRAPPING_CATEGORY_IDS = [
  "69dcb22e733b8ba056529a9f",
  "679ca70f2833ca433fa0aa9c",
];

const PACKPRO_ALL_CATEGORY_IDS = Array.from(
  new Set([
    ...PACKPRO_CARRY_BAG_CATEGORY_IDS,
    ...PACKPRO_FOOD_WRAPPING_CATEGORY_IDS,
    ...PACKPRO_TAPE_CATEGORY_IDS,
  ]),
);

export const PACKPRO_SEGMENTS = Object.freeze({
  all: Object.freeze({
    id: "all",
    label: "All Products",
    heading: "PackPro",
    description:
      "Browse carry bags, food wrapping papers, and tapes in one PackPro catalog.",
    categoryIds: PACKPRO_ALL_CATEGORY_IDS,
  }),
  "carry-bags": Object.freeze({
    id: "carry-bags",
    label: "Carry Bags",
    heading: "PackPro Carry Bags",
    description: "Filter the PackPro catalog to carry bags only.",
    categoryIds: PACKPRO_CARRY_BAG_CATEGORY_IDS,
  }),
  "food-wrapping-papers": Object.freeze({
    id: "food-wrapping-papers",
    label: "Food Wrapping Papers",
    heading: "PackPro Food Wrapping Papers",
    description: "Filter the PackPro catalog to food wrapping papers only.",
    categoryIds: PACKPRO_FOOD_WRAPPING_CATEGORY_IDS,
  }),
  tapes: Object.freeze({
    id: "tapes",
    label: "Tapes",
    heading: "PackPro Tapes",
    description: "Filter the PackPro catalog to tapes only.",
    categoryIds: PACKPRO_TAPE_CATEGORY_IDS,
  }),
});

export const PACKPRO_SEGMENT_OPTIONS = Object.freeze([
  PACKPRO_SEGMENTS.all,
  PACKPRO_SEGMENTS["carry-bags"],
  PACKPRO_SEGMENTS["food-wrapping-papers"],
  PACKPRO_SEGMENTS.tapes,
]);

export const normalizePackproSegment = (value) => {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return PACKPRO_SEGMENTS[normalizedValue] ? normalizedValue : "all";
};

export const getPackproSegmentConfig = (value) =>
  PACKPRO_SEGMENTS[normalizePackproSegment(value)];

export const buildPackproRoute = (segment = "all", extraQuery = {}) => {
  const normalizedSegment = normalizePackproSegment(segment);
  const query = {
    ...(normalizedSegment !== "all" ? { segment: normalizedSegment } : {}),
    ...extraQuery,
  };

  return Object.keys(query).length > 0
    ? {
        pathname: "/packpro",
        query,
      }
    : "/packpro";
};

// constants.js (PURE, NO IMPORTS)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/premind/api/";

export const DEV = API_BASE_URL;
export const PRODUCTION = API_BASE_URL;

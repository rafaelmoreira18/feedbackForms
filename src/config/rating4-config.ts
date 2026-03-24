const NOTO_BASE = "https://fonts.gstatic.com/s/e/notoemoji/latest";

export const RATING4_LABELS: Record<number, string> = {
  1: "Ruim",
  2: "Regular",
  3: "Bom",
  4: "Excelente",
};

export const RATING4_EMOJI_URLS: Record<number, string> = {
  1: `${NOTO_BASE}/1f614/512.webp`,
  2: `${NOTO_BASE}/1f610/512.webp`,
  3: `${NOTO_BASE}/1f642/512.webp`,
  4: `${NOTO_BASE}/1f601/512.webp`,
};

/** Active button styles per rating value */
export const RATING4_ACTIVE_STYLES: Record<number, string> = {
  1: "bg-red-base border-red-base text-white shadow-md",
  2: "bg-yellow-base border-yellow-base text-white shadow-md",
  3: "bg-teal-base border-teal-base text-white shadow-md",
  4: "bg-green-base border-green-base text-white shadow-md",
};

/** Inactive button styles per rating value (includes hover) */
export const RATING4_INACTIVE_STYLES: Record<number, string> = {
  1: "bg-white border-gray-200 text-gray-300 hover:border-red-base hover:text-red-base",
  2: "bg-white border-gray-200 text-gray-300 hover:border-yellow-base hover:text-yellow-base",
  3: "bg-white border-gray-200 text-gray-300 hover:border-teal-base hover:text-teal-base",
  4: "bg-white border-gray-200 text-gray-300 hover:border-green-base hover:text-green-base",
};

/** Badge/display styles per rating value (read-only, always active) */
export const RATING4_BADGE_STYLES: Record<number, string> = {
  1: "bg-red-base border-red-base text-white",
  2: "bg-yellow-base border-yellow-base text-white",
  3: "bg-teal-base border-teal-base text-white",
  4: "bg-green-base border-green-base text-white",
};

/** Chart / analytics color per rating label */
export const RATING4_CHART_COLORS: Record<string, string> = {
  Ruim: "#e74c3c",
  Regular: "#f1c40f",
  Bom: "#4a90e2",
  Excelente: "#52a350",
};

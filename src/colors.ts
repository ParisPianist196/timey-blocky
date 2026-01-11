export function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function contrastText(hex: string) {
  // Remove leading #
  const cleanHex = hex.replace("#", "");

  // Parse RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  // Convert sRGB → linear RGB
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  // Relative luminance
  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;

  // Contrast ratios
  const whiteContrast = 1.05 / (luminance + 0.05);
  const blackContrast = (luminance + 0.05) / 0.05;

  // Pick higher contrast
  return whiteContrast > blackContrast ? "#FFFFFF" : "#000000";
}

export const COLORS = [
  "#3B82F6",
  "#2563EB",
  "#1D4ED8",
  "#60A5FA",
  "#93C5FD",
  "#06B6D4",
  "#0891B2",
  "#0E7490",
  "#22D3EE",
  "#67E8F9",
  "#10B981",
  "#059669",
  "#047857",
  "#34D399",
  "#6EE7B7",
  "#84CC16",
  "#65A30D",
  "#4D7C0F",
  "#A3E635",
  "#BEF264",
  "#FACC15",
  "#EAB308",
  "#CA8A04",
  "#FDE047",
  "#FEF08A",
  "#F97316",
  "#EA580C",
  "#C2410C",
  "#FDBA74",
  "#FED7AA",
  "#EF4444",
  "#DC2626",
  "#B91C1C",
  "#F87171",
  "#FCA5A5",
  "#EC4899",
  "#DB2777",
  "#BE185D",
  "#F472B6",
  "#F9A8D4",
  "#8B5CF6",
  "#7C3AED",
  "#6D28D9",
  "#A78BFA",
  "#C4B5FD",
  "#6366F1",
  "#4F46E5",
  "#4338CA",
  "#818CF8",
  "#A5B4FC",
  "#0F766E",
  "#115E59",
  "#134E4A",
  "#2DD4BF",
  "#5EEAD4",
  "#14B8A6",
  "#0D9488",
  "#0F766E",
  "#5EEAD4",
  "#99F6E4",
  "#64748B",
  "#475569",
  "#334155",
  "#94A3B8",
  "#CBD5E1",
  "#78716C",
  "#57534E",
  "#44403C",
  "#A8A29E",
  "#D6D3D1",
  "#1F2937",
  "#111827",
  "#030712",
  "#374151",
  "#6B7280",
  "#7E22CE",
  "#6B21A8",
  "#581C87",
  "#C084FC",
  "#D8B4FE",
  "#9333EA",
  "#7E22CE",
  "#6B21A8",
  "#D8B4FE",
  "#E9D5FF",
];

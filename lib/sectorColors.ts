// Fixed categorical assignment — color follows the sector identity, never its
// rank in any particular sort, so the same sector always reads the same hue.
export const SECTOR_COLORS: Record<string, string> = {
  Semiconductors: "#3987e5", // series 1 blue
  "Consumer Technology": "#d95926", // series 2 orange
  Automotive: "#199e70", // series 3 aqua
  Software: "#c98500", // series 4 yellow
  Healthcare: "#d55181", // series 5 magenta
  "Consumer Staples": "#008300", // series 6 green
  "Real Estate": "#9085e9", // series 7 violet
  Energy: "#e66767", // series 8 red
};

export function sectorColor(sector: string) {
  return SECTOR_COLORS[sector] ?? "#5b6580";
}

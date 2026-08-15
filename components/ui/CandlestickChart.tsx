export type Candle = { open: number; high: number; low: number; close: number };

/**
 * Plain OHLC candlestick renderer — body from open to close, wick from high
 * to low, green when close >= open, red otherwise. No axis/hover, just the
 * candles themselves; used by the Learning Game's candlestick-reading
 * module to show real, correctly-drawn patterns rather than describing them
 * in prose alone.
 */
export function CandlestickChart({ candles, height = 160 }: { candles: Candle[]; height?: number }) {
  const width = Math.max(120, candles.length * 60);
  const padY = 16;
  const padX = 20;
  const usableH = height - padY * 2;
  const usableW = width - padX * 2;

  const min = Math.min(...candles.map((c) => c.low));
  const max = Math.max(...candles.map((c) => c.high));
  const span = max - min || 1;
  const y = (v: number) => padY + usableH - ((v - min) / span) * usableH;

  const slotW = usableW / candles.length;
  const bodyW = Math.min(28, slotW * 0.55);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Candlestick chart">
      {candles.map((c, i) => {
        const cx = padX + slotW * (i + 0.5);
        const up = c.close >= c.open;
        const color = up ? "#0ca30c" : "#d03b3b";
        const bodyTop = y(Math.max(c.open, c.close));
        const bodyBottom = y(Math.min(c.open, c.close));
        const bodyHeight = Math.max(1.5, bodyBottom - bodyTop);
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1.5} />
            <rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={bodyHeight} fill={color} rx={1.5} />
          </g>
        );
      })}
    </svg>
  );
}

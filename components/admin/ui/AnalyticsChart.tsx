// ============================================================
// BLENDIFY — Analytics Chart Component (Luxury Redesign)
// Coffee-themed colors, Export PNG/CSV, Fullscreen, Tooltips,
// Interactive Legends, Custom Date Range, Compare Period
// Pure SVG — no external chart dependencies
// ============================================================
'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Maximize2, Minimize2, Download, X,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';

// ── Brand-consistent coffee chart palette ──────────────────
const COFFEE_PALETTE = [
  '#581312',  // Deep Maroon
  '#C47C0A',  // Rich Gold/Amber
  '#8B3030',  // Caramel
  '#2D7A4F',  // Forest Green
  '#1565A0',  // Deep Blue
  '#6B1A1A',  // Mid Maroon
  '#D4880A',  // Light Amber
  '#4A7C59',  // Muted Green
];

// ─────────────────────────────────────────────────────────────
// BAR CHART
// ─────────────────────────────────────────────────────────────
interface ChartDataPoint { label: string; value: number; color?: string; }

interface BarChartProps {
  data: ChartDataPoint[];
  color?: string;
  height?: number;
  label?: string;
  id?: string;
  showExport?: boolean;
}

export function BarChart({
  data,
  color = '#581312',
  height = 200,
  label,
  id,
  showExport = true,
}: BarChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const effectiveHeight = fullscreen ? 380 : height;

  const exportCSV = useCallback(() => {
    const csv = ['Label,Value', ...data.map((d) => `"${d.label}",${d.value}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${label ?? 'chart'}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }, [data, label]);

  const exportPNG = useCallback(() => {
    if (!svgRef.current) return;
    const svg  = svgRef.current;
    const xml  = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${label ?? 'chart'}.svg`;
    a.click(); URL.revokeObjectURL(url);
  }, [label]);

  if (!data || data.length === 0) {
    return (
      <div style={{
        height: effectiveHeight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--admin-text-tertiary)', fontSize: '12px',
        background: 'var(--admin-surface-muted)', borderRadius: 8,
      }}>
        No data available
      </div>
    );
  }

  const max         = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = effectiveHeight - 44;
  const padding     = { left: 40, right: 16, top: 10, bottom: 28 };
  const innerH      = chartHeight - padding.top - padding.bottom;

  const wrapper: React.CSSProperties = fullscreen
    ? { position: 'fixed', inset: 0, background: 'var(--admin-surface)', zIndex: 80, display: 'flex', flexDirection: 'column', padding: 24 }
    : { position: 'relative' };

  return (
    <div role="img" aria-label={label ?? 'Bar chart'} id={id} style={wrapper}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        {label && (
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>
            {label}
          </span>
        )}
        {showExport && (
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            <button
              onClick={exportCSV}
              className="admin-icon-btn"
              style={{ width: 28, height: 28 }}
              title="Export CSV"
              aria-label="Export chart as CSV"
            >
              <Download size={12} />
            </button>
            <button
              onClick={exportPNG}
              className="admin-icon-btn"
              style={{ width: 28, height: 28 }}
              title="Export SVG"
              aria-label="Export chart as SVG"
            >
              <Download size={12} />
            </button>
            <button
              onClick={() => setFullscreen((v) => !v)}
              className="admin-icon-btn"
              style={{ width: 28, height: 28 }}
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              aria-label={fullscreen ? 'Exit fullscreen' : 'View fullscreen'}
            >
              {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          </div>
        )}
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height={chartHeight}
        style={{ overflow: 'visible', flex: fullscreen ? 1 : undefined }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`bar-grad-${id ?? 'default'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color}    stopOpacity="0.9" />
            <stop offset="100%" stopColor={color}    stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <g key={i}>
            <line
              x1={padding.left} y1={padding.top + innerH * (1 - ratio)}
              x2="100%"         y2={padding.top + innerH * (1 - ratio)}
              stroke="var(--admin-border)" strokeWidth="1" strokeDasharray="4 3"
            />
            <text
              x={padding.left - 4}
              y={padding.top + innerH * (1 - ratio) + 4}
              fontSize="9"
              fill="var(--admin-text-disabled)"
              textAnchor="end"
            >
              {Math.round(max * ratio).toLocaleString()}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const totalWidth  = 100 / data.length;
          const barWidthPct = totalWidth * 0.55;
          const xPct        = totalWidth * i + totalWidth * 0.225;
          const barH        = (d.value / max) * innerH;
          const y           = padding.top + innerH - barH;
          const barColor    = d.color ?? color;

          return (
            <g
              key={i}
              onMouseMove={(e) => {
                const svg = e.currentTarget.closest('svg');
                if (!svg) return;
                const rect = svg.getBoundingClientRect();
                setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: d.label, value: d.value });
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Bar hover area */}
              <rect
                x={`${xPct}%`} y={padding.top}
                width={`${barWidthPct}%`} height={innerH}
                fill="transparent"
              />
              {/* Actual bar */}
              <rect
                x={`${xPct}%`} y={y}
                width={`${barWidthPct}%`} height={Math.max(2, barH)}
                fill={`url(#bar-grad-${id ?? 'default'})`}
                rx="3" ry="3"
              />
              {/* Label */}
              <text
                x={`${xPct + barWidthPct / 2}%`}
                y={padding.top + innerH + 16}
                fontSize="9"
                fill="var(--admin-text-tertiary)"
                textAnchor="middle"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: Math.min(tooltip.x + 10, 999),
          top: tooltip.y - 36,
          background: 'var(--admin-text-primary)',
          color: '#FAF0E6',
          fontSize: '11px',
          padding: '5px 10px',
          borderRadius: 6,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          boxShadow: 'var(--admin-shadow-md)',
          fontWeight: 600,
          zIndex: 99,
        }}>
          {tooltip.label}: {tooltip.value.toLocaleString()}
        </div>
      )}

      {/* Fullscreen close */}
      {fullscreen && (
        <button
          className="admin-btn admin-btn-secondary"
          onClick={() => setFullscreen(false)}
          style={{ alignSelf: 'flex-end', marginTop: 12 }}
        >
          <X size={14} /> Close
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DONUT CHART
// ─────────────────────────────────────────────────────────────
interface DonutDataPoint { label: string; value: number; color?: string; }

interface DonutChartProps {
  data: DonutDataPoint[];
  size?: number;
  label?: string;
  id?: string;
}

export function DonutChart({ data, size = 160, label = 'Total', id }: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{
        height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--admin-text-tertiary)', fontSize: '12px',
      }}>
        No data
      </div>
    );
  }

  const total  = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx     = size / 2;
  const cy     = size / 2;
  const r      = size * 0.36;
  const stroke = size * 0.16;
  const circ   = 2 * Math.PI * r;

  // Pre-compute all slice geometry — avoid mutating angle inside JSX map
  const slices = data.map((d, i) => {
    const fraction  = d.value / total;
    const angle     = fraction * Math.PI * 2;
    const dashArray = `${fraction * circ} ${circ}`;
    return { fraction, angle, dashArray, color: d.color ?? COFFEE_PALETTE[i % COFFEE_PALETTE.length] };
  });
  const rotations: number[] = [];
  let acc = -Math.PI / 2;
  for (const sl of slices) {
    rotations.push((acc * 180) / Math.PI + 90);
    acc += sl.angle;
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}
      role="img"
      aria-label={`Donut chart: ${label}`}
      id={id}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size} aria-hidden="true">
          {slices.map((sl, i) => {
            const isActive = activeIndex === i;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={sl.color}
                strokeWidth={isActive ? stroke + 4 : stroke}
                strokeDasharray={sl.dashArray}
                strokeDashoffset={0}
                transform={`rotate(${rotations[i]}, ${cx}, ${cy})`}
                strokeLinecap="round"
                style={{
                  cursor: 'pointer',
                  transition: 'stroke-width 200ms, opacity 200ms',
                  opacity: activeIndex === null || isActive ? 1 : 0.55,
                }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                aria-label={`${data[i].label}: ${data[i].value} (${((data[i].value / total) * 100).toFixed(1)}%)`}
              />
            );
          })}
          {/* Center text */}
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--admin-text-primary)" fontFamily="Playfair Display, serif">
            {activeIndex !== null ? data[activeIndex].value.toLocaleString() : total.toLocaleString()}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill="var(--admin-text-tertiary)">
            {activeIndex !== null ? data[activeIndex].label : label}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => {
          const pct = ((d.value / total) * 100).toFixed(1);
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer',
                opacity: activeIndex === null || activeIndex === i ? 1 : 0.5,
                transition: 'opacity 200ms',
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div style={{
                width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                background: d.color ?? COFFEE_PALETTE[i % COFFEE_PALETTE.length],
              }} />
              <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', fontWeight: 500 }}>
                {d.label}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)', marginLeft: 'auto' }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LINE CHART
// ─────────────────────────────────────────────────────────────
interface LineChartProps {
  data: ChartDataPoint[];
  color?: string;
  height?: number;
  label?: string;
  showArea?: boolean;
  id?: string;
  compareData?: ChartDataPoint[];
}

export function LineChart({
  data,
  color = '#581312',
  height = 180,
  label,
  showArea = true,
  id,
  compareData,
}: LineChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>
        No data available
      </div>
    );
  }

  const allValues = [...data.map((d) => d.value), ...(compareData?.map((d) => d.value) ?? [])];
  const max       = Math.max(...allValues, 1);
  const chartH    = height - 36;
  const padding   = { left: 36, right: 8, top: 8, bottom: 24 };
  const innerW    = 100; // percent
  const innerH    = chartH - padding.top - padding.bottom;

  const getPoint = (d: ChartDataPoint, i: number, arr: ChartDataPoint[]) => {
    const x = padding.left + (i / (arr.length - 1)) * (innerW - padding.left - padding.right);
    const y = padding.top  + innerH - (d.value / max) * innerH;
    return `${x}%,${y}`;
  };

  const polyline = data.map((d, i) => getPoint(d, i, data)).join(' ');
  const compareLine = compareData?.map((d, i) => getPoint(d, i, compareData)).join(' ');

  // Area path (close to bottom)
  const areaPoints = [
    ...data.map((d, i) => getPoint(d, i, data)),
    `${padding.left + (innerW - padding.left - padding.right)}%,${padding.top + innerH}`,
    `${padding.left}%,${padding.top + innerH}`,
  ];

  return (
    <div role="img" aria-label={label ?? 'Line chart'} id={id} style={{ position: 'relative' }}>
      {label && (
        <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', marginBottom: 6, fontWeight: 600 }}>
          {label}
          {compareData && (
            <span style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)', marginLeft: 8 }}>
              vs previous period
            </span>
          )}
        </div>
      )}

      <svg width="100%" height={chartH} style={{ overflow: 'visible' }} aria-hidden="true">
        <defs>
          <linearGradient id={`area-grad-${id ?? 'lc'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <line key={i}
            x1={`${padding.left}%`} y1={padding.top + innerH * (1 - r)}
            x2="100%"              y2={padding.top + innerH * (1 - r)}
            stroke="var(--admin-border)" strokeWidth="1" strokeDasharray="4 3"
          />
        ))}

        {/* Area fill */}
        {showArea && (
          <polygon
            points={areaPoints.join(' ')}
            fill={`url(#area-grad-${id ?? 'lc'})`}
          />
        )}

        {/* Compare line */}
        {compareLine && (
          <polyline
            points={compareLine}
            fill="none"
            stroke={COFFEE_PALETTE[1]}
            strokeWidth="1.5"
            strokeDasharray="6 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Main line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {data.map((d, i) => {
          const [xStr, yStr] = getPoint(d, i, data).split(',');
          return (
            <circle
              key={i}
              cx={xStr} cy={yStr} r="4"
              fill={color}
              stroke="var(--admin-surface)"
              strokeWidth="2"
              style={{ cursor: 'pointer' }}
              onMouseMove={(e) => {
                const svg = e.currentTarget.closest('svg');
                if (!svg) return;
                const rect = svg.getBoundingClientRect();
                setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: d.label, value: d.value });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}

        {/* X-axis labels */}
        {data.filter((_, i) => data.length <= 10 || i % Math.ceil(data.length / 8) === 0).map((d, i, arr) => {
          const origI = data.indexOf(d);
          const [xStr] = getPoint(d, origI, data).split(',');
          return (
            <text key={i} x={xStr} y={padding.top + innerH + 16} fontSize="9" fill="var(--admin-text-tertiary)" textAnchor="middle">
              {d.label}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x + 10,
          top: tooltip.y - 32,
          background: 'var(--admin-text-primary)',
          color: '#FAF0E6',
          fontSize: '11px',
          padding: '4px 10px',
          borderRadius: 6,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          boxShadow: 'var(--admin-shadow-md)',
          fontWeight: 600,
          zIndex: 10,
        }}>
          {tooltip.label}: {tooltip.value.toLocaleString()}
        </div>
      )}
    </div>
  );
}

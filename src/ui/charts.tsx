import { useId, useState, type PointerEvent } from 'react';

export interface Datum {
  label: string;
  value: number;
}

interface ChartProps {
  data: Datum[];
  format: (v: number) => string;
  title: string;
  height?: number;
  color?: string;
  /** indeks batang yang ditonjolkan (mis. customer terpilih) */
  highlight?: number;
  baselineZero?: boolean;
}

const W = 340;
const PAD = { l: 44, r: 10, t: 12, b: 24 };

function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || 1;
  const step = Math.pow(10, Math.floor(Math.log10(span / count)));
  const err = span / count / step;
  const nice = step * (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1);
  const lo = Math.floor(min / nice) * nice;
  const hi = Math.ceil(max / nice) * nice;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + nice / 2; v += nice) ticks.push(Math.round(v * 1000) / 1000);
  return ticks;
}

const compact = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 100) / 10}rb` : String(Math.round(v * 10) / 10));

/** Grafik garis 1 seri dengan crosshair + tooltip */
export function LineChart({ data, format, title, height = 170, color = 'var(--series-1)' }: ChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const values = data.map((d) => d.value);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const H = height;
  const x = (i: number) => PAD.l + (i / (data.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join('');

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <figure className="chart">
      <figcaption id={id}>{title}</figcaption>
      <div className="chart__wrap">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={id} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="chart__grid" />
              <text x={PAD.l - 6} y={y(t) + 4} className="chart__tick" textAnchor="end">
                {compact(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % 2 === 0 || i === data.length - 1 ? (
              <text key={d.label} x={x(i)} y={H - 6} className="chart__tick" textAnchor="middle">
                {d.label.split(' ')[0]}
              </text>
            ) : null,
          )}
          <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(data.length - 1)} cy={y(values[values.length - 1])} r={4} fill={color} stroke="var(--surface-1)" strokeWidth={2} />
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} className="chart__cross" />
              <circle cx={x(hover)} cy={y(data[hover].value)} r={5} fill={color} stroke="var(--surface-1)" strokeWidth={2} />
            </g>
          )}
        </svg>
        {hover !== null && (
          <div className="chart__tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(data[hover].value) / H) * 100}%` }}>
            <span>{data[hover].label}</span>
            <b>{format(data[hover].value)}</b>
          </div>
        )}
      </div>
    </figure>
  );
}

/** Grafik batang vertikal 1 seri dengan tooltip per batang */
export function BarChart({ data, format, title, height = 170, color = 'var(--series-1)', highlight, baselineZero = true }: ChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const values = data.map((d) => d.value);
  const ticks = niceTicks(baselineZero ? 0 : Math.min(...values) * 0.995, Math.max(...values));
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const H = height;
  const plotW = W - PAD.l - PAD.r;
  const bw = plotW / data.length;
  const barW = Math.min(28, bw - 2);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const base = y(lo);

  return (
    <figure className="chart">
      <figcaption id={id}>{title}</figcaption>
      <div className="chart__wrap">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={id} onPointerLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="chart__grid" />
              <text x={PAD.l - 6} y={y(t) + 4} className="chart__tick" textAnchor="end">
                {compact(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = PAD.l + bw * i + bw / 2;
            const top = y(d.value);
            const h = Math.max(1, base - top);
            const r = Math.min(4, barW / 2, h);
            const x0 = cx - barW / 2;
            const shape = `M${x0},${base}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + barW - r}Q${x0 + barW},${top} ${x0 + barW},${top + r}V${base}Z`;
            const muted = highlight !== undefined && highlight !== i;
            return (
              <g key={d.label} onPointerEnter={() => setHover(i)}>
                <rect x={PAD.l + bw * i} y={PAD.t} width={bw} height={H - PAD.t - PAD.b} fill="transparent" />
                <path d={shape} fill={color} opacity={muted ? 0.35 : hover === null || hover === i ? 1 : 0.6} />
                {(i % 2 === 0 || data.length <= 6) && (
                  <text x={cx} y={H - 6} className="chart__tick" textAnchor="middle">
                    {d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label.split(' ')[0]}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={PAD.l} x2={W - PAD.r} y1={base} y2={base} className="chart__axis" />
        </svg>
        {hover !== null && (
          <div className="chart__tip" style={{ left: `${((PAD.l + bw * hover + bw / 2) / W) * 100}%`, top: `${(y(data[hover].value) / H) * 100}%` }}>
            <span>{data[hover].label}</span>
            <b>{format(data[hover].value)}</b>
          </div>
        )}
      </div>
    </figure>
  );
}

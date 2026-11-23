import * as THREE from 'three';
import { COAL_PRICES, COMPETITOR_QUOTES, CUSTOMERS } from '../data/dummy';
import { COLORS } from '../data/process';

/**
 * Isi layar monitor digambar sekali di <canvas> 2D lalu dipakai sebagai tekstur.
 * Grafik dibuat lokal; logo merek dimuat dari public/brands.
 */
export type ScreenKind =
  | 'site'
  | 'risk'
  | 'fat'
  | 'marketing'
  | 'warehouse'
  | 'optima'
  | 'analytics'
  | 'sales'
  | 'gm'
  | 'nc'
  | 'building';

const W = 512;
const H = 320;
const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const cache = new Map<ScreenKind, THREE.CanvasTexture>();

function header(ctx: CanvasRenderingContext2D, title: string, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, 46);
  ctx.fillStyle = '#fff';
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText(title, 18, 31);
}

function lineChart(ctx: CanvasRenderingContext2D, values: number[], x: number, y: number, w: number, h: number, color: string) {
  const min = Math.min(...values) - 3;
  const max = Math.max(...values) + 3;
  ctx.strokeStyle = '#e1e0d9';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const gy = y + (h / 3) * i;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  values.forEach((v, i) => {
    const px = x + (w / (values.length - 1)) * i;
    const py = y + h - ((v - min) / (max - min)) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
}

function bars(ctx: CanvasRenderingContext2D, values: number[], x: number, y: number, w: number, h: number, color: string, highlight = -1) {
  const max = Math.max(...values);
  const bw = w / values.length;
  values.forEach((v, i) => {
    const bh = (v / max) * h;
    ctx.fillStyle = i === highlight ? '#173a63' : color;
    ctx.beginPath();
    ctx.roundRect(x + i * bw + 4, y + h - bh, bw - 8, bh, [5, 5, 0, 0]);
    ctx.fill();
  });
}

function rows(ctx: CanvasRenderingContext2D, data: string[][], y0: number, colX: number[], zebra = '#f2f5f8') {
  ctx.font = `500 17px ${FONT}`;
  data.forEach((r, i) => {
    const y = y0 + i * 34;
    if (i % 2 === 0) {
      ctx.fillStyle = zebra;
      ctx.fillRect(10, y - 23, W - 20, 34);
    }
    ctx.fillStyle = i === 0 ? '#52514e' : '#0b0b0b';
    ctx.font = `${i === 0 ? 600 : 500} 17px ${FONT}`;
    r.forEach((cell, ci) => ctx.fillText(cell, colX[ci], y));
  });
}

function draw(kind: ScreenKind, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#fcfcfb';
  ctx.fillRect(0, 0, W, H);
  const nc = COAL_PRICES.map((p) => p.usdPerTon);

  switch (kind) {
    case 'site': {
      header(ctx, 'Data Site Customer', COLORS.risk);
      rows(ctx, [['Site', 'Cost US$/t', 'Mt/thn'], ...CUSTOMERS.slice(0, 6).map((c) => [c.site, String(c.coalCashCostUsd), String(c.productionMtPerYear)])], 80, [20, 290, 410]);
      break;
    }
    case 'risk': {
      header(ctx, 'Credit Risk · Data Site + NC Coal', COLORS.risk);
      ctx.fillStyle = '#52514e';
      ctx.font = `500 18px ${FONT}`;
      ctx.fillText('NC Coal Price (US$/t)', 20, 80);
      lineChart(ctx, nc, 20, 96, 300, 180, COLORS.risk);
      ctx.fillStyle = '#0b0b0b';
      ctx.font = `700 40px ${FONT}`;
      ctx.fillText(nc[nc.length - 1].toFixed(1), 350, 150);
      ctx.font = `500 18px ${FONT}`;
      ctx.fillStyle = '#52514e';
      ctx.fillText('Tier customer', 350, 200);
      ['A', 'B', 'C'].forEach((t, i) => {
        ctx.fillStyle = ['#0ca30c', '#fab219', '#d03b3b'][i];
        ctx.beginPath();
        ctx.roundRect(350 + i * 48, 214, 40, 40, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `700 22px ${FONT}`;
        ctx.fillText(t, 362 + i * 48, 242);
      });
      break;
    }
    case 'fat': {
      header(ctx, 'Profitabilitas TEM · FAT', COLORS.fat);
      rows(
        ctx,
        [['Customer', 'Margin', 'Volume'], ...CUSTOMERS.slice(0, 6).map((c, i) => [c.name.replace('PT ', '').slice(0, 18), `${(3.1 + i * 0.4).toFixed(1)}%`, `${c.avgMonthlyVolumeKL}`])],
        80,
        [20, 300, 410],
      );
      break;
    }
    case 'marketing': {
      header(ctx, 'Competitor Benchmark', COLORS.marketing);
      const vals = COMPETITOR_QUOTES.filter((q) => q.region === 'kaltim').map((q) => q.priceRp - 13_000);
      bars(ctx, [...vals, 640], 30, 70, 300, 220, COLORS.marketing, vals.length);
      ctx.fillStyle = '#52514e';
      ctx.font = `500 18px ${FONT}`;
      ctx.fillText('Harga HSD (Rp/L)', 350, 90);
      ctx.fillStyle = '#0b0b0b';
      ctx.font = `700 30px ${FONT}`;
      ctx.fillText('13.720', 350, 135);
      ctx.font = `500 16px ${FONT}`;
      ctx.fillStyle = '#52514e';
      ctx.fillText('termurah · Kaltim', 350, 160);
      ctx.fillText('Benchmark harga HSD', 350, 280);
      break;
    }
    case 'warehouse': {
      header(ctx, 'PostgreSQL · Data Warehouse', COLORS.warehouse);
      rows(ctx, [['Data domain', 'Source', 'Status'], ['Credit Risk', 'Site + NC', 'Ready'], ['Profitabilitas', 'NetSuite', 'Ready'], ['Benchmark', 'Marketing', 'Ready'], ['Histori', 'Transaksi', 'Ready'], ['Parameter', 'TEM', 'Ready']], 80, [20, 230, 410]);
      break;
    }
    case 'optima':
    case 'sales': {
      header(ctx, kind === 'optima' ? 'OPTIMA · Kalkulator Penawaran' : 'OPTIMA', COLORS.optima);
      ctx.fillStyle = '#52514e';
      ctx.font = `500 17px ${FONT}`;
      ['Customer', 'Volume (KL/bln)', 'Termin (hari)'].forEach((l, i) => {
        ctx.fillText(l, 20, 82 + i * 52);
        ctx.strokeStyle = '#c3c2b7';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 90 + i * 52, 220, 24);
      });
      ctx.fillStyle = '#e6f6f8';
      ctx.beginPath();
      ctx.roundRect(262, 62, 232, 236, 14);
      ctx.fill();
      ctx.fillStyle = '#0b5f6c';
      ctx.font = `600 18px ${FONT}`;
      ctx.fillText('Rekomendasi', 280, 96);
      ctx.fillStyle = '#0b0b0b';
      ctx.font = `700 42px ${FONT}`;
      ctx.fillText('13.660', 280, 150);
      ctx.font = `500 16px ${FONT}`;
      ctx.fillStyle = '#52514e';
      ctx.fillText('Rp / liter', 280, 174);
      ctx.fillStyle = '#0ca30c';
      ctx.font = `600 18px ${FONT}`;
      ctx.fillText('✓ Margin 3,4%', 280, 214);
      ctx.fillStyle = '#52514e';
      ctx.fillText('Peluang menang 61%', 280, 246);
      ctx.fillStyle = COLORS.optima;
      ctx.beginPath();
      ctx.roundRect(20, 262, 220, 36, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `600 17px ${FONT}`;
      ctx.fillText('Hitung Penawaran', 56, 286);
      break;
    }
    case 'analytics': {
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(0, 0, W, 46);
      ctx.fillStyle = COLORS.analytics;
      ctx.fillRect(16, 12, 8, 24);
      ctx.fillRect(28, 18, 8, 18);
      ctx.fillRect(40, 8, 8, 28);
      ctx.fillStyle = '#fff';
      ctx.font = `600 21px ${FONT}`;
      ctx.fillText('OPTIMA · Dashboard Analytics', 60, 31);
      [['Volume', '24.1 rb KL'], ['Margin', '3,2%'], ['Customer', '6']].forEach(([k, v], i) => {
        ctx.fillStyle = '#f2f2f0';
        ctx.fillRect(14 + i * 166, 58, 156, 64);
        ctx.fillStyle = '#52514e';
        ctx.font = `500 15px ${FONT}`;
        ctx.fillText(k, 26 + i * 166, 80);
        ctx.fillStyle = '#0b0b0b';
        ctx.font = `700 24px ${FONT}`;
        ctx.fillText(v, 26 + i * 166, 110);
      });
      bars(ctx, [62, 70, 58, 74, 80, 77, 85, 79, 88, 92, 86, 95], 14, 136, 484, 170, COLORS.analytics);
      break;
    }
    case 'gm': {
      header(ctx, 'Inbox · GM Sales', COLORS.gm);
      [
        ['Proposal HSD – PT Bara Mahakam', 'Sales TEM', true],
        ['Laporan mingguan', 'Tim FAT', false],
        ['Update harga kompetitor', 'Marketing', false],
        ['Review risiko Q4', 'Tim Risk', false],
      ].forEach(([t, f, unread], i) => {
        const y = 62 + i * 62;
        ctx.fillStyle = unread ? '#eef3fb' : '#fff';
        ctx.fillRect(10, y, W - 20, 56);
        ctx.fillStyle = unread ? '#2a78d6' : '#c3c2b7';
        ctx.beginPath();
        ctx.arc(30, y + 28, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0b0b0b';
        ctx.font = `${unread ? 700 : 500} 18px ${FONT}`;
        ctx.fillText(String(t), 50, y + 24);
        ctx.fillStyle = '#52514e';
        ctx.font = `500 15px ${FONT}`;
        ctx.fillText(String(f), 50, y + 46);
      });
      break;
    }
    case 'nc': {
      ctx.fillStyle = '#10243d';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = `700 26px ${FONT}`;
      ctx.fillText('NC COAL PRICE', 20, 42);
      ctx.fillStyle = '#9fb4cc';
      ctx.font = `500 16px ${FONT}`;
      ctx.fillText('Newcastle · US$/ton · 12 bulan', 20, 66);
      ctx.fillStyle = '#f5a524';
      ctx.font = `700 54px ${FONT}`;
      ctx.fillText(nc[nc.length - 1].toFixed(1), 330, 60);
      ctx.save();
      ctx.globalAlpha = 0.9;
      lineChart(ctx, nc, 20, 100, 472, 190, '#f5a524');
      ctx.restore();
      break;
    }
    case 'building': {
      ctx.fillStyle = '#8b97a6';
      ctx.fillRect(0, 0, W, H);
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 8; c++) {
          ctx.fillStyle = (r * 3 + c) % 4 === 0 ? '#ffe39a' : '#cfe2f3';
          ctx.fillRect(18 + c * 62, 18 + r * 60, 44, 40);
        }
      }
      break;
    }
  }
}

export function getScreenTexture(kind: ScreenKind): THREE.CanvasTexture {
  const hit = cache.get(kind);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  draw(kind, ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(kind, tex);
  return tex;
}

const screenMats = new Map<ScreenKind, THREE.MeshBasicMaterial>();
export function screenMaterial(kind: ScreenKind) {
  let m = screenMats.get(kind);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ map: getScreenTexture(kind), toneMapped: false });
    screenMats.set(kind, m);
  }
  return m;
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_SEASON,
  SEASON_ORDER,
  SEASON_THEMES,
  type SeasonId,
} from './seasons/seasonConfig';

/**
 * PlantSidebar — "Matcha Range · Seasonal Living Canvas"
 *
 * Full-height (540px) interactive seasonal botanical experience:
 *   • Defaults to `december` (luminous snow-dusted evergreen tree, sweeping
 *     golden garlands, 28 twinkling bokeh ornaments, radiant North Star,
 *     northern lights aurora, and 68 depth-layered snowflakes).
 *   • Modular seasonal switcher (`Dec`, `Spr`, `Aut`, `Cyb`) powered by
 *     `seasons/seasonConfig.ts` so changing seasons is a 1-line config change
 *     or a single click.
 *   • Genuinely fun to interact with:
 *       - Pointer gently swirls the snow/petals/leaves around the cursor.
 *       - Clicking the tree launches a luminous sparkle burst + an upward
 *         shimmer wave that makes the North Star flare brightly.
 *   • Pauses automatically off-screen via IntersectionObserver.
 *   • Zero localStorage usage.
 */

interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  phase: number;
  colorIdx: number;
  rot: number;
  rotSpeed: number;
}

interface SparkleBurst {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface BulbPos {
  tierIdx: number;
  t: number; // 0..1 across garland arc
  colorIdx: number;
  phase: number;
}

interface TreeTier {
  yTop: number;
  yBot: number;
  halfWidth: number;
}

function buildTreeTiers(w: number, h: number): TreeTier[] {
  const topY = h * 0.17;
  const baseY = h * 0.83;
  const totalH = baseY - topY;
  const count = 6;
  const tiers: TreeTier[] = [];

  for (let i = 0; i < count; i++) {
    const f0 = i / count;
    const f1 = (i + 1) / count;
    const overlap = i === 0 ? 0 : totalH * 0.065;
    tiers.push({
      yTop: topY + f0 * totalH - overlap,
      yBot: topY + f1 * totalH,
      halfWidth: w * (0.12 + f1 * 0.31),
    });
  }
  return tiers;
}

function buildBulbs(): BulbPos[] {
  const bulbs: BulbPos[] = [];
  const countsPerTier = [2, 3, 4, 5, 6, 7];
  let idx = 0;
  countsPerTier.forEach((n, tierIdx) => {
    for (let k = 0; k < n; k++) {
      bulbs.push({
        tierIdx,
        t: (k + 0.5) / n,
        colorIdx: idx % 6,
        phase: idx * 0.85,
      });
      idx += 1;
    }
  });
  return bulbs;
}

export default function PlantSidebar() {
  const [season, setSeason] = useState<SeasonId>(DEFAULT_SEASON);
  const [sparklesTriggered, setSparklesTriggered] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const seasonRef = useRef<SeasonId>(season);
  seasonRef.current = season;

  const theme = SEASON_THEMES[season];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 260;
    let height = 540;
    let dpr = 1;
    let rafId: number | null = null;
    let isVisible = true;
    let time = 0;

    // Interactive pointer & festive wave state
    const pointer = { x: -999, y: -999, active: false };
    let waveProgress = -1; // 0..1 climbs up the tree on click
    let starFlare = 0;

    const bulbs = buildBulbs();
    const bursts: SparkleBurst[] = [];

    const createParticles = (w: number, h: number): WeatherParticle[] =>
      Array.from({ length: 68 }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: 0.45 + Math.random() * 1.05,
        radius: 1.2 + Math.random() * 2.8,
        alpha: 0.35 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        colorIdx: i % 3,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
      }));

    let particles = createParticles(width, height);

    const stars = Array.from({ length: 28 }, (_, i) => ({
      xFrac: ((i * 37 + 13) % 94 + 3) / 100,
      yFrac: ((i * 23 + 7) % 44 + 3) / 100,
      r: 0.7 + (i % 3) * 0.55,
      phase: i * 0.7,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(180, Math.floor(rect.width));
      height = Math.max(420, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(width, height);
    };

    const spawnBurst = (cx: number, cy: number) => {
      const activeTheme = SEASON_THEMES[seasonRef.current];
      for (let i = 0; i < 24; i++) {
        const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.25;
        const speed = 1.2 + Math.random() * 3.1;
        bursts.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          life: 0,
          maxLife: 34 + Math.random() * 22,
          size: 1.8 + Math.random() * 2.6,
          color: activeTheme.bulbColors[i % activeTheme.bulbColors.length],
        });
      }
      waveProgress = 0;
      starFlare = 1;
    };

    const drawStar = (
      cx: number,
      cy: number,
      outerR: number,
      innerR: number,
      color: string,
      flare: number,
    ) => {
      // Soft radiant halo
      const haloR = outerR * (3.1 + flare * 1.4);
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
      halo.addColorStop(0, color);
      halo.addColorStop(0.3, 'rgba(254, 240, 138, 0.45)');
      halo.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
      ctx.fill();

      // 8-point crystalline star
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(time * 0.9) * 0.08);
      ctx.beginPath();
      const spikes = 8;
      for (let i = 0; i < spikes * 2; i++) {
        const r =
          i % 2 === 0
            ? i % 4 === 0
              ? outerR * (1 + flare * 0.25)
              : outerR * 0.68
            : innerR;
        const ang = (i * Math.PI) / spikes - Math.PI / 2;
        const x = Math.cos(ang) * r;
        const y = Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = '#FFFBEB';
      ctx.fill();
      ctx.restore();
    };

    const renderFrame = () => {
      const cfg = SEASON_THEMES[seasonRef.current];
      const cx = width * 0.5;
      const tiers = buildTreeTiers(width, height);
      const baseY = height * 0.83;

      // 1. Luminous Sky Backdrop
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, cfg.skyTop);
      sky.addColorStop(0.55, cfg.skyMid);
      sky.addColorStop(1, cfg.skyBottom);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      // 2. Dancing Northern Lights / Seasonal Aurora Ribbon
      const auroraY = height * 0.22 + Math.sin(time * 0.6) * 14;
      const aur1 = ctx.createRadialGradient(
        width * 0.28 + Math.sin(time * 0.45) * 28,
        auroraY,
        8,
        width * 0.35,
        auroraY,
        width * 0.65,
      );
      aur1.addColorStop(0, cfg.auroraA);
      aur1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aur1;
      ctx.fillRect(0, 0, width, height * 0.65);

      const aur2 = ctx.createRadialGradient(
        width * 0.72 + Math.cos(time * 0.4) * 24,
        height * 0.3,
        8,
        width * 0.68,
        height * 0.32,
        width * 0.6,
      );
      aur2.addColorStop(0, cfg.auroraB);
      aur2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aur2;
      ctx.fillRect(0, 0, width, height * 0.7);

      // 3. Twinkling Background Stars
      for (const s of stars) {
        const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 1.8 + s.phase));
        ctx.beginPath();
        ctx.arc(s.xFrac * width, s.yFrac * height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 252, 235, ${(twinkle * 0.75).toFixed(3)})`;
        ctx.fill();
      }

      // 4. Curved Luminous Snow / Meadow Ground
      const groundGrad = ctx.createLinearGradient(0, baseY - 12, 0, height);
      groundGrad.addColorStop(0, cfg.groundTop);
      groundGrad.addColorStop(1, cfg.groundBottom);
      ctx.beginPath();
      ctx.moveTo(0, baseY + 18);
      ctx.quadraticCurveTo(cx, baseY - 16, width, baseY + 20);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = groundGrad;
      ctx.fill();

      // Warm reflection pool on the ground beneath the tree
      const floorGlow = ctx.createRadialGradient(
        cx,
        baseY + 24,
        6,
        cx,
        baseY + 24,
        width * 0.42,
      );
      floorGlow.addColorStop(0, 'rgba(254, 240, 138, 0.42)');
      floorGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = floorGlow;
      ctx.fillRect(0, baseY - 10, width, height - baseY + 10);

      // 5. Tree Trunk
      const trunkW = Math.max(18, width * 0.095);
      const trunkGrad = ctx.createLinearGradient(cx - trunkW / 2, 0, cx + trunkW / 2, 0);
      trunkGrad.addColorStop(0, '#451A03');
      trunkGrad.addColorStop(0.5, '#78350F');
      trunkGrad.addColorStop(1, '#3B1603');
      ctx.fillStyle = trunkGrad;
      ctx.beginPath();
      ctx.roundRect(cx - trunkW / 2, baseY - 14, trunkW, 38, 5);
      ctx.fill();

      // Minimalist festive gift boxes under the tree in December
      if (cfg.id === 'december') {
        const gifts = [
          { x: cx - trunkW * 1.85, y: baseY + 8, w: 22, h: 17, body: '#F43F5E', ribbon: '#FDE68A' },
          { x: cx + trunkW * 0.95, y: baseY + 10, w: 26, h: 19, body: '#38BDF8', ribbon: '#FEF3C7' },
          { x: cx - trunkW * 0.55, y: baseY + 14, w: 18, h: 14, body: '#FBBF24', ribbon: '#FFFFFF' },
        ];
        for (const g of gifts) {
          ctx.fillStyle = g.body;
          ctx.beginPath();
          ctx.roundRect(g.x, g.y, g.w, g.h, 3);
          ctx.fill();
          ctx.fillStyle = g.ribbon;
          ctx.fillRect(g.x + g.w * 0.44, g.y, g.w * 0.14, g.h);
          ctx.fillRect(g.x, g.y + g.h * 0.42, g.w, g.h * 0.16);
        }
      }

      // 6. Sculpted Multi-Tier Lush Tree (bottom → top for layered depth)
      for (let i = tiers.length - 1; i >= 0; i--) {
        const tier = tiers[i];
        const sway = Math.sin(time * 1.15 + i * 0.55) * (1.8 + (tiers.length - i) * 0.25);

        const grad = ctx.createLinearGradient(cx, tier.yTop, cx, tier.yBot);
        grad.addColorStop(0, cfg.foliageLight);
        grad.addColorStop(0.55, cfg.foliageMid);
        grad.addColorStop(1, cfg.foliageDeep);

        const leftX = cx - tier.halfWidth + sway;
        const rightX = cx + tier.halfWidth + sway;
        const apexX = cx + sway * 0.55;

        // Soft ambient drop shadow behind each bough
        ctx.save();
        ctx.shadowColor = 'rgba(2, 6, 23, 0.35)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 5;

        ctx.beginPath();
        ctx.moveTo(apexX, tier.yTop);
        ctx.quadraticCurveTo(
          cx + tier.halfWidth * 0.55 + sway,
          (tier.yTop + tier.yBot) * 0.55,
          rightX,
          tier.yBot,
        );
        // Scalloped organic pine bottom hem
        ctx.quadraticCurveTo(cx + tier.halfWidth * 0.45 + sway, tier.yBot + 11, cx + sway, tier.yBot + 4);
        ctx.quadraticCurveTo(cx - tier.halfWidth * 0.45 + sway, tier.yBot + 11, leftX, tier.yBot);
        ctx.quadraticCurveTo(
          cx - tier.halfWidth * 0.55 + sway,
          (tier.yTop + tier.yBot) * 0.55,
          apexX,
          tier.yTop,
        );
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        // Luminous Fluffy Snow Caps along December pine edges
        if (cfg.snowCap) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(leftX + 3, tier.yBot - 2);
          ctx.quadraticCurveTo(cx - tier.halfWidth * 0.45 + sway, tier.yBot + 10, cx + sway, tier.yBot + 3);
          ctx.quadraticCurveTo(cx + tier.halfWidth * 0.45 + sway, tier.yBot + 10, rightX - 3, tier.yBot - 2);
          ctx.strokeStyle = 'rgba(248, 252, 255, 0.92)';
          ctx.lineWidth = 4.2;
          ctx.lineCap = 'round';
          ctx.shadowColor = 'rgba(186, 230, 253, 0.65)';
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.restore();
        }

        // Draped Golden Garland Arc on each tier
        const gLeftX = cx - tier.halfWidth * 0.72 + sway;
        const gRightX = cx + tier.halfWidth * 0.72 + sway;
        const gY = tier.yBot - (tier.yBot - tier.yTop) * 0.28;
        ctx.beginPath();
        ctx.moveTo(gLeftX, gY - 5);
        ctx.quadraticCurveTo(cx + sway, gY + 13, gRightX, gY - 2);
        ctx.strokeStyle =
          cfg.id === 'december'
            ? 'rgba(253, 230, 138, 0.58)'
            : 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // 7. Twinkling Luminous Ornaments / Bokeh Lights along Garlands
      for (const b of bulbs) {
        const tier = tiers[b.tierIdx];
        if (!tier) continue;
        const sway = Math.sin(time * 1.15 + b.tierIdx * 0.55) * (1.8 + (tiers.length - b.tierIdx) * 0.25);
        const gLeftX = cx - tier.halfWidth * 0.7 + sway;
        const gRightX = cx + tier.halfWidth * 0.7 + sway;
        const gY = tier.yBot - (tier.yBot - tier.yTop) * 0.28;

        // Quadratic Bézier point at parameter t
        const u = 1 - b.t;
        const bx = u * u * gLeftX + 2 * u * b.t * (cx + sway) + b.t * b.t * gRightX;
        const by = u * u * (gY - 5) + 2 * u * b.t * (gY + 13) + b.t * b.t * (gY - 2);

        // Shimmer boost when click wave passes this vertical level
        const heightNorm = 1 - b.tierIdx / (tiers.length - 1);
        const waveBoost =
          waveProgress >= 0
            ? Math.max(0, 1 - Math.abs(waveProgress - heightNorm) * 4.5)
            : 0;

        const pulse = 0.55 + 0.45 * Math.sin(time * 2.6 + b.phase);
        const intensity = Math.min(1, pulse + waveBoost * 0.85);
        const color = cfg.bulbColors[b.colorIdx % cfg.bulbColors.length];

        // Bokeh outer glow
        const glowR = 9 + intensity * 6 + waveBoost * 7;
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, glowR);
        glow.addColorStop(0, color);
        glow.addColorStop(0.45, color + '55');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(bx, by, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Crisp bright bulb core
        ctx.beginPath();
        ctx.arc(bx, by, 2.7 + waveBoost * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }

      // 8. Radiant Apex North Star
      const apexTier = tiers[0];
      const starX = cx + Math.sin(time * 1.15) * 1.5;
      const starY = apexTier.yTop - 8;
      drawStar(starX, starY, 15, 5.5, cfg.starColor, starFlare);

      // 9. Interactive Weather Particles (Snow / Petals / Leaves / Spores)
      for (const p of particles) {
        if (!prefersReducedMotion) {
          const drift = Math.sin(time * 1.2 + p.phase) * 0.45;
          if (cfg.particleMode === 'spores') {
            p.y -= p.vy * 0.7;
          } else {
            p.y += p.vy;
          }
          p.x += p.vx + drift;
          p.rot += p.rotSpeed;

          // Interactive cursor swirl!
          if (pointer.active) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 64 && dist > 1) {
              const force = (1 - dist / 64) * 1.9;
              p.x += (dx / dist) * force;
              p.y += (dy / dist) * force * 0.6;
            }
          }

          if (p.y > height + 8) {
            p.y = -8;
            p.x = Math.random() * width;
          } else if (p.y < -8) {
            p.y = height + 8;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        const pColor = cfg.particleColors[p.colorIdx % cfg.particleColors.length];
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        if (cfg.particleMode === 'snow' || cfg.particleMode === 'spores') {
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = pColor;
          ctx.shadowColor = pColor;
          ctx.shadowBlur = p.radius * 2.5;
          ctx.fill();
        } else {
          // Soft organic petal / leaf shape
          ctx.beginPath();
          ctx.ellipse(0, 0, p.radius * 1.5, p.radius * 0.85, 0, 0, Math.PI * 2);
          ctx.fillStyle = pColor;
          ctx.fill();
        }
        ctx.restore();
      }

      // 10. Interactive Click Sparkle Bursts
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.life += 1;
        if (b.life >= b.maxLife) {
          bursts.splice(i, 1);
          continue;
        }
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.04;
        b.vx *= 0.97;

        const lifeAlpha = 1 - b.life / b.maxLife;
        ctx.save();
        ctx.globalAlpha = lifeAlpha;
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * lifeAlpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const tick = () => {
      if (!isVisible) {
        rafId = null;
        return;
      }
      time += 0.018;
      if (waveProgress >= 0) {
        waveProgress += 0.022;
        if (waveProgress > 1.25) waveProgress = -1;
      }
      if (starFlare > 0.01) {
        starFlare *= 0.95;
      } else {
        starFlare = 0;
      }
      renderFrame();
      rafId = window.requestAnimationFrame(tick);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      spawnBurst(e.clientX - rect.left, e.clientY - rect.top);
      setSparklesTriggered((n) => n + 1);
      if (prefersReducedMotion) renderFrame();
    };

    resize();
    renderFrame();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) renderFrame();
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
        if (isVisible && !prefersReducedMotion && rafId === null) {
          rafId = window.requestAnimationFrame(tick);
        }
      },
      { threshold: 0.05 },
    );
    intersectionObserver.observe(canvas);

    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
    canvas.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    canvas.addEventListener('click', handleClick);

    if (!prefersReducedMotion) {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <aside
      aria-label="Matcha Range interactive seasonal companion"
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#0B111E] dark:shadow-[0_18px_48px_-18px_rgba(0,0,0,0.75)]"
    >
      {/* Card Header + Modular Season Switcher */}
      <div className="flex flex-col gap-3 p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2
              className="text-base font-semibold tracking-tight text-slate-900 dark:text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Matcha Range
            </h2>
            <p
              className="text-[11px] text-slate-500 dark:text-slate-400"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {theme.title} · {theme.subtitle}
            </p>
          </div>

          {sparklesTriggered > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span aria-hidden="true">✦</span>
              <span>{sparklesTriggered}</span>
            </span>
          )}
        </div>

        {/* Modular 4-Season Pill Bar */}
        <div
          className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/[0.05]"
          role="group"
          aria-label="Season theme selector"
        >
          {SEASON_ORDER.map((id) => {
            const item = SEASON_THEMES[id];
            const active = season === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSeason(id)}
                aria-pressed={active}
                className={`inline-flex items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-white/15 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-Height Interactive Luminous Seasonal Canvas */}
      <div className="relative h-[520px] w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Interactive ${theme.title} seasonal tree — click to sparkle`}
          className="block h-full w-full cursor-pointer select-none"
        />

        {/* Discreet interactive hint pill */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
          <span
            className="rounded-full bg-slate-950/55 px-3 py-1 text-[10px] tracking-wide text-white/90 backdrop-blur-md"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {theme.hint}
          </span>
        </div>
      </div>

      {/* Footer — Social Links */}
      <div className="flex items-center justify-between border-t border-slate-200/80 px-4 py-3.5 dark:border-white/[0.06]">
        <span
          className="text-[10px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {theme.shortLabel} · SEASON
        </span>
        <div className="flex items-center space-x-3.5">
          <a
            href="https://github.com/jonesh05"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-slate-500 transition-transform hover:-translate-y-0.5 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <a
            href="https://linkedin.com/in/jhonny-pimiento"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-slate-500 transition-transform hover:-translate-y-0.5 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>
      </div>
    </aside>
  );
}

'use client';

import { useEffect, useRef } from 'react';

/**
 * BlogBanner3D
 * Real-time GPU-raymarched interactive 3D iridescent cryptographic sculpture
 * rendered via WebGL (GLSL fragment shader, zero external dependencies).
 *
 * Craft & Visual Quality:
 *   • 2x2 Rotated-Grid Supersampling (RGSS) inside the fragment shader for
 *     razor-sharp, alias-free silhouette edges on the rings and crystal facets.
 *   • Smooth circular radial edge mask + CSS mask so the ambient glow fades
 *     to pure 0.0 alpha well before the canvas bounds (zero rectangular frame).
 *   • Physically-inspired Fresnel iridescence, studio softbox specular lights,
 *     and ambient occlusion — dynamically adapting to Light & Dark theme.
 *
 * Interactivity:
 *   • Scroll-reactive kinetic impulse: nudging scroll down immediately spins
 *     and tilts the 3D sculpture with smooth inertia + subtle light shimmer.
 *   • Drag (mouse or touch) to orbit 360° freely with smooth momentum.
 *   • Hover bends the studio key-light across facets.
 *   • Click triggers a luminous harmonic energy pulse.
 *   • Pauses automatically off-screen via IntersectionObserver.
 */

const VERTEX_SHADER = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

varying vec2 v_uv;
uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_rot;      // yaw, pitch from drag + scroll impulse + idle spin
uniform vec2  u_pointer;  // normalized pointer [-1, 1] for key-light shift
uniform float u_pulse;    // 0..1 click / scroll energy shimmer
uniform float u_dark;     // 1.0 dark mode, 0.0 light mode

mat2 rot2D(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

float sdOctahedron(vec3 p, float s) {
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.57735027;
}

// mat 1.0 = iridescent faceted crystal core
// mat 2.0 = brushed titanium gyroscope rings
// mat 3.0 = glowing orbital security shards
vec2 mapScene(vec3 p) {
  p.xz *= rot2D(u_rot.x);
  p.yz *= rot2D(u_rot.y);

  // 1. Faceted + harmonic crystal core
  vec3 pc = p;
  pc.xy *= rot2D(u_time * 0.28);
  pc.xz *= rot2D(u_time * 0.21);

  float pulseWave = u_pulse * 0.065 * sin(length(pc) * 12.0 - u_time * 9.0);
  float harmonic = 0.028 * sin(pc.x * 4.2 + u_time * 1.0)
                 * cos(pc.y * 4.2 - u_time * 0.85)
                 * sin(pc.z * 4.2 + u_time * 0.75);

  float octa = sdOctahedron(pc, 0.96) - 0.08;
  float sphere = length(pc) - 0.72;
  float core = smin(octa, sphere, 0.28) + harmonic + pulseWave;

  vec2 res = vec2(core, 1.0);

  // 2. Outer Gyroscopic Ring A
  vec3 r1 = p;
  r1.xy *= rot2D(0.58 + u_time * 0.34);
  r1.yz *= rot2D(0.45);
  float ringA = sdTorus(r1, vec2(1.16, 0.052));
  if (ringA < res.x) res = vec2(ringA, 2.0);

  // 3. Inner Gyroscopic Ring B (counter-rotating)
  vec3 r2 = p;
  r2.yz *= rot2D(-0.72 - u_time * 0.42);
  r2.xz *= rot2D(0.65);
  float ringB = sdTorus(r2, vec2(0.96, 0.042));
  if (ringB < res.x) res = vec2(ringB, 2.0);

  // 4. Three orbiting security crystal satellites
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float ang = u_time * (0.65 + fi * 0.14) + fi * 2.094395;
    float tilt = 0.48 * sin(ang * 1.3 + fi);
    vec3 orbPos = vec3(cos(ang) * 1.36, tilt, sin(ang) * 1.36);
    float orb = length(p - orbPos) - (0.082 + u_pulse * 0.02);
    if (orb < res.x) res = vec2(orb, 3.0);
  }

  return res;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.0022, 0.0);
  return normalize(vec3(
    mapScene(p + e.xyy).x - mapScene(p - e.xyy).x,
    mapScene(p + e.yxy).x - mapScene(p - e.yxy).x,
    mapScene(p + e.yyx).x - mapScene(p - e.yyx).x
  ));
}

float calcAO(vec3 pos, vec3 nor) {
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 4; i++) {
    float h = 0.04 + 0.11 * float(i) / 3.0;
    float d = mapScene(pos + h * nor).x;
    occ += (h - d) * sca;
    sca *= 0.85;
  }
  return clamp(1.0 - 2.1 * occ, 0.0, 1.0);
}

vec3 iridescence(float t, float darkMode) {
  vec3 a = mix(vec3(0.46, 0.56, 0.80), vec3(0.18, 0.24, 0.44), darkMode);
  vec3 b = mix(vec3(0.28, 0.26, 0.36), vec3(0.26, 0.30, 0.42), darkMode);
  vec3 c = vec3(0.85, 0.90, 1.0);
  vec3 d = vec3(0.12, 0.38, 0.68);
  return a + b * cos(6.28318 * (c * t + d));
}

vec4 traceSample(vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * u_res) / min(u_res.x, u_res.y);
  vec2 normUv = fragCoord / u_res;

  // Camera distanced cleanly so all rings & orbiting satellites stay 100%
  // inside the canvas bounds with generous breathing room (zero clipping)
  vec3 ro = vec3(0.0, 0.0, 4.38);
  vec3 rd = normalize(vec3(uv, -1.78));

  float radialDist = length((normUv - 0.5) * 2.0);
  float edgeMask = 1.0 - smoothstep(0.54, 0.95, radialDist);
  float bgGlow = exp(-dot(uv, uv) * 4.8) * edgeMask;

  float t = 0.0;
  float matId = -1.0;
  float minDist = 10.0;

  for (int i = 0; i < 64; i++) {
    vec3 p = ro + rd * t;
    vec2 h = mapScene(p);
    minDist = min(minDist, h.x);
    if (h.x < 0.0018) {
      matId = h.y;
      break;
    }
    t += h.x * 0.90;
    if (t > 8.2) break;
  }

  vec3 col = vec3(0.0);
  float alpha = 0.0;

  if (matId > 0.0) {
    vec3 pos = ro + rd * t;
    vec3 nor = calcNormal(pos);
    vec3 viewDir = -rd;
    float ao = calcAO(pos, nor);

    vec3 keyLight = normalize(vec3(1.8 + u_pointer.x * 1.4, 2.2 - u_pointer.y * 1.1, 2.4));
    vec3 rimLight = normalize(vec3(-2.1, -1.0, -1.4));
    vec3 topLight = normalize(vec3(0.0, 3.0, 0.6));

    float diff = max(dot(nor, keyLight), 0.0);
    float topDiff = max(dot(nor, topLight), 0.0);
    float fresnel = pow(1.0 - max(dot(nor, viewDir), 0.0), 3.2);

    vec3 halfKey = normalize(keyLight + viewDir);
    float spec = pow(max(dot(nor, halfKey), 0.0), 48.0);

    vec3 halfRim = normalize(rimLight + viewDir);
    float rimSpec = pow(max(dot(nor, halfRim), 0.0), 22.0);

    vec3 irid = iridescence(fresnel * 0.9 + pos.y * 0.28 + u_time * 0.08 + u_pulse * 0.35, u_dark);

    if (matId < 1.5) {
      vec3 baseTone = mix(
        vec3(0.76, 0.82, 0.96),
        vec3(0.09, 0.12, 0.22),
        u_dark
      );
      vec3 shadowTint = mix(vec3(0.45, 0.48, 0.72), vec3(0.03, 0.05, 0.11), u_dark);

      col = mix(shadowTint, baseTone, diff * 0.75 + topDiff * 0.25);
      col = mix(col, irid, 0.38 + fresnel * 0.55);
      col += vec3(0.95, 0.98, 1.0) * spec * mix(0.95, 1.35, u_dark);
      col += vec3(0.35, 0.88, 1.0) * rimSpec * 0.55;
      col += vec3(0.45, 0.95, 0.85) * u_pulse * (0.35 + fresnel * 0.65);
      col *= (0.45 + 0.55 * ao);
    } else if (matId < 2.5) {
      vec3 metalBase = mix(
        vec3(0.62, 0.68, 0.82),
        vec3(0.28, 0.33, 0.48),
        u_dark
      );
      col = metalBase * (0.35 + diff * 0.65) * ao;
      col += irid * fresnel * 0.65;
      col += vec3(1.0) * spec * 1.4;
      col += vec3(0.55, 0.45, 1.0) * rimSpec * 0.45;
    } else {
      vec3 orbColor = mix(
        vec3(0.24, 0.52, 0.98),
        vec3(0.22, 0.94, 0.78),
        u_dark
      );
      col = orbColor * (0.65 + diff * 0.45) + vec3(1.0) * spec * 1.1;
      col += irid * fresnel * 0.5;
    }

    alpha = 1.0;
  } else {
    float proximityGlow = exp(-minDist * 8.5) * edgeMask;
    vec3 auraCol = mix(
      vec3(0.42, 0.56, 0.96),
      vec3(0.34, 0.62, 0.98),
      u_dark
    );
    vec3 secondaryAura = mix(
      vec3(0.64, 0.48, 0.96),
      vec3(0.16, 0.85, 0.72),
      u_dark
    );
    vec3 glowTint = mix(auraCol, secondaryAura, smoothstep(-0.4, 0.4, uv.x));
    float strength = (proximityGlow * 0.34 + bgGlow * 0.13) * (1.0 + u_pulse * 0.75);
    col = glowTint;
    alpha = clamp(strength * mix(0.40, 0.66, u_dark) * edgeMask, 0.0, 0.70);
  }

  col = pow(max(col, 0.0), vec3(0.92));
  return vec4(col * alpha, alpha);
}

void main() {
  // 2x2 Rotated-Grid Supersampling (RGSS) for silky, alias-free ring & crystal edges
  vec4 acc = vec4(0.0);
  acc += traceSample(gl_FragCoord.xy + vec2(-0.18, -0.36));
  acc += traceSample(gl_FragCoord.xy + vec2( 0.36, -0.18));
  acc += traceSample(gl_FragCoord.xy + vec2( 0.18,  0.36));
  acc += traceSample(gl_FragCoord.xy + vec2(-0.36,  0.18));
  gl_FragColor = acc * 0.25;
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function BlogBanner3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const gl =
      canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        premultipliedAlpha: true,
      }) ?? null;

    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const posLoc = gl.getAttribLocation(program, 'a_pos');
    const uRes = gl.getUniformLocation(program, 'u_res');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRot = gl.getUniformLocation(program, 'u_rot');
    const uPointer = gl.getUniformLocation(program, 'u_pointer');
    const uPulse = gl.getUniformLocation(program, 'u_pulse');
    const uDark = gl.getUniformLocation(program, 'u_dark');

    gl.useProgram(program);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    let rafId: number | null = null;
    let isVisible = true;
    let time = 1.2;

    // Interactive 3D orbital + scroll-reactive physics
    let yaw = 0.45;
    let pitch = 0.22;
    let velYaw = 0;
    let velPitch = 0;
    let isDragging = false;
    let dragMoved = false;
    let lastX = 0;
    let lastY = 0;
    let lastScrollY = window.scrollY;
    let pulse = 0;

    const targetPointer = { x: 0, y: 0 };
    const pointer = { x: 0, y: 0 };

    const readIsDark = () =>
      document.documentElement.classList.contains('dark') ? 1.0 : 0.0;
    let darkVal = readIsDark();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    };

    const draw = () => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uRot, yaw, pitch);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.uniform1f(uPulse, pulse);
      gl.uniform1f(uDark, darkVal);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const tick = () => {
      if (!isVisible) {
        rafId = null;
        return;
      }
      time += 0.014;
      pointer.x += (targetPointer.x - pointer.x) * 0.08;
      pointer.y += (targetPointer.y - pointer.y) * 0.08;

      if (!isDragging) {
        // Subtle cursor-following yaw/pitch lean + momentum from drag/scroll
        yaw += 0.0045 + velYaw;
        pitch = Math.max(-1.05, Math.min(1.05, pitch + velPitch));
        velYaw *= 0.92;
        velPitch *= 0.92;
      }

      if (pulse > 0.001) {
        pulse *= 0.92;
      } else {
        pulse = 0;
      }

      draw();
      rafId = window.requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (prefersReducedMotion || !isVisible) return;
      const currentY = window.scrollY;
      const deltaY = currentY - lastScrollY;
      lastScrollY = currentY;
      if (Math.abs(deltaY) < 1) return;

      // Immediate tactile kinetic reaction when reader scrolls down/up
      const clampedDelta = Math.max(-120, Math.min(120, deltaY));
      velYaw += clampedDelta * 0.00085;
      velPitch += clampedDelta * 0.00028;
      pulse = Math.max(pulse, Math.min(0.42, Math.abs(clampedDelta) * 0.006));
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragMoved = false;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        targetPointer.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        targetPointer.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      }
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
      lastX = e.clientX;
      lastY = e.clientY;
      yaw += dx * 0.011;
      pitch = Math.max(-1.05, Math.min(1.05, pitch + dy * 0.011));
      velYaw = dx * 0.004;
      velPitch = dy * 0.004;
      if (prefersReducedMotion) draw();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDragging && !dragMoved) {
        pulse = 1.0;
        velYaw += 0.05;
      }
      isDragging = false;
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    };

    const onPointerLeave = () => {
      targetPointer.x = 0;
      targetPointer.y = 0;
    };

    resize();
    draw();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) draw();
    });
    resizeObserver.observe(canvas);

    const themeObserver = new MutationObserver(() => {
      darkVal = readIsDark();
      if (prefersReducedMotion) draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
        if (isVisible && !prefersReducedMotion && rafId === null) {
          lastScrollY = window.scrollY;
          rafId = window.requestAnimationFrame(tick);
        }
      },
      { threshold: 0.05 },
    );
    intersectionObserver.observe(canvas);

    window.addEventListener('scroll', onScroll, { passive: true });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave, { passive: true });

    if (!prefersReducedMotion) {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Interactive 3D cryptographic crystal sculpture — drag to rotate, scroll to react, or click to pulse"
      className="block h-full w-full touch-none cursor-grab active:cursor-grabbing select-none border-0 outline-none bg-transparent"
    />
  );
}

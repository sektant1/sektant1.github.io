uniform sampler2D tDiffuse;
uniform vec2 uTexel;
uniform float uEdge;
uniform float uDither;
uniform float uContrast;
uniform float uBoot;
uniform vec2 uResolution;
uniform vec2 uCell;
uniform vec3 uInk;
uniform float uMinLevel;

varying vec2 vUv;

// Rec. 601, which is what the ASCII effect itself uses downstream. Matching it
// means this pass is operating on the same number the ramp will read.
float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

// 4x4 Bayer matrix, as a lookup over integer pixel coordinates. Ordered rather
// than random: noise would crawl between frames and the whole grid would
// shimmer, while this holds still as the object turns under it.
float bayer(vec2 p) {
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  int index = x + y * 4;

  // GLSL ES 1.0 cannot index a const array with a non-constant expression, so
  // the matrix is unrolled.
  float m = 0.0;
  if (index == 0) m = 0.0;   else if (index == 1) m = 8.0;
  else if (index == 2) m = 2.0;   else if (index == 3) m = 10.0;
  else if (index == 4) m = 12.0;  else if (index == 5) m = 4.0;
  else if (index == 6) m = 14.0;  else if (index == 7) m = 6.0;
  else if (index == 8) m = 3.0;   else if (index == 9) m = 11.0;
  else if (index == 10) m = 1.0;  else if (index == 11) m = 9.0;
  else if (index == 12) m = 15.0; else if (index == 13) m = 7.0;
  else if (index == 14) m = 13.0; else m = 5.0;

  return m / 16.0 - 0.5;
}

float same(float a, float b) {
  return 1.0 - step(0.1, abs(a - b));
}

float between(float value, float low, float high) {
  return step(low, value) * step(value, high);
}

float glyph(vec2 uv, float level) {
  vec2 p = floor(clamp(uv, 0.0, 0.999) * vec2(5.0, 7.0));
  float x = p.x;
  float y = p.y;

  if (level < 0.5) return 0.0;
  if (level < 1.5) return same(x, 2.0) * same(y, 1.0);
  if (level < 2.5) {
    return same(x, 2.0) * max(same(y, 1.0), same(y, 5.0));
  }
  if (level < 3.5) {
    return same(y, 3.0) * between(x, 1.0, 3.0);
  }
  if (level < 4.5) {
    float horizontal = same(y, 3.0) * between(x, 0.0, 4.0);
    float vertical = same(x, 2.0) * between(y, 1.0, 5.0);
    return max(horizontal, vertical);
  }
  if (level < 5.5) {
    float plus = max(
      same(y, 3.0) * between(x, 0.0, 4.0),
      same(x, 2.0) * between(y, 1.0, 5.0)
    );
    float diagonals = max(
      same(abs(x - 2.0), abs(y - 3.0)),
      same(x + y, 5.0)
    ) * between(y, 2.0, 4.0);
    return max(plus, diagonals);
  }
  if (level < 6.5) {
    float uprights = max(same(x, 1.0), same(x, 3.0));
    float crossbars = max(same(y, 2.0), same(y, 4.0));
    return max(uprights * between(y, 0.0, 6.0), crossbars);
  }
  if (level < 7.5) {
    float diagonal = same(x, floor((6.0 - y) * 0.67));
    float dots = max(
      between(x, 0.0, 1.0) * between(y, 5.0, 6.0),
      between(x, 3.0, 4.0) * between(y, 0.0, 1.0)
    );
    return max(diagonal, dots);
  }

  float outside = max(
    max(same(x, 0.0), same(x, 4.0)) * between(y, 1.0, 5.0),
    max(same(y, 0.0), same(y, 6.0)) * between(x, 1.0, 3.0)
  );
  float counter = max(
    max(same(y, 2.0), same(y, 4.0)) * between(x, 1.0, 3.0),
    max(same(x, 1.0), same(x, 3.0)) * between(y, 2.0, 4.0)
  );
  float tail = same(x, 4.0) * same(y, 2.0);
  return max(outside, max(counter, tail));
}

void main() {
  float boot = clamp(uBoot, 0.0, 1.0);
  float unstable = 1.0 - boot;
  vec2 cellSize = max(floor(uCell), vec2(3.0, 5.0));
  vec2 cellId = floor(gl_FragCoord.xy / cellSize);
  vec2 cellUv = (cellId + 0.5) * cellSize / uResolution;
  vec2 glyphUv = fract(gl_FragCoord.xy / cellSize);
  float row = cellId.y;
  float phase = floor(boot * 28.0);
  float jitter = sin(row * 12.9898 + phase * 78.233) * unstable * 0.008;
  vec2 sampleUv = clamp(cellUv + vec2(jitter, 0.0), uTexel, vec2(1.0) - uTexel);
  vec4 base = texture2D(tDiffuse, sampleUv);

  // The image locks from top to bottom once per boot. This is one acquisition
  // pass, not a persistent scanline treatment.
  float sweepY = 1.05 - boot * 1.1;
  float reveal = smoothstep(sweepY - 0.025, sweepY + 0.025, vUv.y);

  // Nothing was drawn here. Left fully transparent so the ramp reads it as the
  // empty glyph and the art keeps a clean silhouette.
  if (base.a < 0.01 || reveal < 0.01) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float c = luma(base.rgb);

  // A displaced echo makes the first unstable frames read like sync hunting,
  // then disappears before the model finishes resolving.
  vec2 ghostUv = clamp(sampleUv + vec2(unstable * 0.014, 0.0), uTexel, vec2(1.0) - uTexel);
  c = max(c, luma(texture2D(tDiffuse, ghostUv).rgb) * unstable * 0.45);

  // Sobel over luminance. Nine taps, which at 24fps on a quarter-resolution
  // buffer is not worth optimising into two passes.
  vec2 edgeTexel = cellSize / uResolution * 0.55;
  float tl = luma(texture2D(tDiffuse, sampleUv + edgeTexel * vec2(-1.0,  1.0)).rgb);
  float t  = luma(texture2D(tDiffuse, sampleUv + edgeTexel * vec2( 0.0,  1.0)).rgb);
  float tr = luma(texture2D(tDiffuse, sampleUv + edgeTexel * vec2( 1.0,  1.0)).rgb);
  float l  = luma(texture2D(tDiffuse, sampleUv + edgeTexel * vec2(-1.0,  0.0)).rgb);
  float r  = luma(texture2D(tDiffuse, sampleUv + edgeTexel * vec2( 1.0,  0.0)).rgb);
  float bl = luma(texture2D(tDiffuse, sampleUv + edgeTexel * vec2(-1.0, -1.0)).rgb);
  float b  = luma(texture2D(tDiffuse, sampleUv + edgeTexel * vec2( 0.0, -1.0)).rgb);
  float br = luma(texture2D(tDiffuse, sampleUv + edgeTexel * vec2( 1.0, -1.0)).rgb);

  float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
  float gy =  tl + 2.0 * t + tr - bl - 2.0 * b - br;
  float edge = sqrt(gx * gx + gy * gy);

  // Added, not multiplied: an edge should push a cell up the ramp toward a
  // denser glyph, which is how relief reads as relief rather than as an
  // outline drawn over the top.
  c += edge * uEdge;

  // Contrast about mid grey, to spread the midtones the object occupies
  // across more of the ramp than a linear response would give them.
  c = clamp((c - 0.5) * uContrast + 0.5, 0.0, 1.0);

  // One ramp step is 1/9, so the dither is scaled to that: any larger and it
  // is visible as noise, any smaller and it fails to cross the boundary.
  c += bayer(cellId) * uDither;

  float acquisition = exp(-abs(vUv.y - sweepY) * 85.0);
  c += acquisition * 0.45;

  float level = max(uMinLevel, floor(clamp(c, 0.0, 1.0) * 8.999));
  float mask = glyph(glyphUv, level);
  float intensity = mix(0.58, 1.0, clamp(c, 0.0, 1.0));
  gl_FragColor = vec4(uInk * intensity * mask, base.a * reveal * mask);
  #include <colorspace_fragment>
}

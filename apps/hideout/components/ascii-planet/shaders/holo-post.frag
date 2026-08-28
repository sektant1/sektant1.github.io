uniform sampler2D tDiffuse;
uniform vec2 uTexel;
uniform float uBoot;
uniform vec2 uResolution;
uniform vec2 uCell;
uniform vec3 uInk;
uniform float uScanline;
uniform float uLevels;

varying vec2 vUv;

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

/**
 * One tube, four phosphors.
 *
 * A single ink scaled by brightness gives a picture that is the same colour
 * everywhere and only varies in how dim it is, which on a dark page reads as
 * one flat tone. A real phosphor shifts as it is driven harder: the low end
 * sits deep and blue-green where the beam barely excites it, the middle is the
 * tube's own colour, and the top blooms toward white at the core of the line.
 *
 * Stops rather than a gradient, because the raster has already quantised the
 * value — a continuous ramp between them would only be resampled back onto
 * these steps.
 */
vec3 phosphor(float v) {
  vec3 deep = uInk * vec3(0.30, 0.42, 0.36);
  vec3 low = uInk * 0.62;
  vec3 mid = uInk;
  // The top stops stay on the tube. Mixing toward flat white reads as a
  // different display bleeding through the green one; mixing toward a pale
  // green keeps the hot end as the same phosphor driven harder, which is what
  // the halo around it is already telling the eye.
  vec3 hot = mix(uInk, vec3(0.62, 1.0, 0.74), 0.35);
  vec3 core = mix(uInk, vec3(0.80, 1.0, 0.86), 0.50);

  if (v < 0.22) return deep;
  if (v < 0.42) return low;
  if (v < 0.66) return mid;
  if (v < 0.86) return hot;
  return core;
}

/**
 * The brightest sample in the cell, not the average.
 *
 * The subject here is drawn as lines a pixel or two wide. Point sampling a
 * cell that is six pixels across misses most of them, and averaging thins
 * every line it does catch until the quantiser drops it. Taking the maximum
 * dilates the wire onto the cell it crosses, which is what keeps a projection
 * looking like a projection rather than a dotted rash.
 */
vec4 cellPeak(vec2 uv, vec2 step) {
  vec4 peak = texture2D(tDiffuse, uv);
  float best = luma(peak.rgb) * peak.a;

  for (int i = 0; i < 4; i++) {
    vec2 offset = vec2(
      i == 0 || i == 3 ? -step.x : step.x,
      i < 2 ? -step.y : step.y
    );
    vec4 tap = texture2D(tDiffuse, clamp(uv + offset, uTexel, vec2(1.0) - uTexel));
    float weight = luma(tap.rgb) * tap.a;
    if (weight > best) {
      best = weight;
      peak = tap;
    }
  }

  return peak;
}

void main() {
  float boot = clamp(uBoot, 0.0, 1.0);
  float unstable = 1.0 - boot;

  // The grid the ASCII pass uses, kept square: a hologram is projected on a
  // raster, and a raster's pixels are not letter-shaped.
  vec2 cellSize = max(floor(vec2(uCell.y)), vec2(2.0));
  vec2 cellId = floor(gl_FragCoord.xy / cellSize);
  vec2 cellUv = (cellId + 0.5) * cellSize / uResolution;

  // Rows slip sideways while the projection is still finding its lock, then
  // settle. One band, moving down, rather than a permanent wobble.
  float band = fract(cellUv.y * 3.0 - boot * 2.2);
  float slip = smoothstep(0.92, 1.0, band) * unstable;
  vec2 sampleUv = clamp(
    cellUv + vec2(slip * 0.03, 0.0),
    uTexel,
    vec2(1.0) - uTexel
  );

  vec2 tap = cellSize / uResolution * 0.35;
  vec4 base = cellPeak(sampleUv, tap);

  // The image builds from the bottom, the way a projector fills its volume.
  float sweepY = 1.05 - boot * 1.1;
  float reveal = smoothstep(sweepY - 0.03, sweepY + 0.03, vUv.y);
  if (reveal < 0.01) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float c = luma(base.rgb) * base.a;

  // Split the channels by a cell as the beam settles: a projection that has
  // not converged reads as one that is being aimed.
  if (unstable > 0.001) {
    vec2 ghostUv = clamp(
      sampleUv + vec2(tap.x * 2.0 * unstable, 0.0),
      uTexel,
      vec2(1.0) - uTexel
    );
    vec4 ghost = cellPeak(ghostUv, tap);
    c = max(c, luma(ghost.rgb) * ghost.a * 0.6);
  }

  // Quantised, but to brightness rather than to glyphs: the wire keeps its
  // shape and the shading behind it steps, which is the difference between
  // this pass and the character grid.
  float levels = max(uLevels, 2.0);
  float stepped = floor(clamp(c, 0.0, 1.0) * levels) / levels;

  // The horizon of the sweep is where the beam is putting its energy.
  float acquisition = exp(-abs(vUv.y - sweepY) * 60.0) * unstable;

  float intensity = stepped + acquisition * 0.5;
  if (intensity < 0.02) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // Every other raster row is a gap the page shows through, not a dark bar
  // painted over it. Painted, the unlit half of the picture fills the
  // silhouette with black and the projection stops being a projection.
  // Measured in cells, so the lines hold still while the subject turns.
  float gap = mod(cellId.y, 2.0) < 1.0 ? 0.0 : 1.0;
  float alpha = 1.0 - gap * uScanline;

  // The tone carries the level, not a brightness multiplier: scaling one ink
  // toward black loses the picture in the page, while stepping through the
  // phosphors keeps every level its own colour.
  vec3 colour = phosphor(clamp(intensity, 0.0, 1.0));

  // Full alpha on a lit row: a cell that fades into the page has a soft
  // border, and a raster of soft borders is a blurred picture.
  gl_FragColor = vec4(colour, alpha);
  #include <colorspace_fragment>
}

uniform sampler2D uMap;
uniform float uWater;
uniform float uLand;
uniform float uLimb;
uniform float uLimbPower;
uniform vec2 uWire;
uniform float uWireWidth;
uniform float uWireTone;
uniform float uBackTone;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;

/**
 * The globe as a terminal draws one: a wire sphere with the continents filled
 * in, in four tones and nothing else.
 *
 * Neither pass downstream can see anything that is not a brightness
 * difference, and both quantise what they do see — the raster to four levels,
 * the character grid to nine. So the material does not shade a ball and hope
 * the reduction finds a picture in it: it emits one value per tone and puts
 * each of them where a step lands.
 *
 *   water   the body of the sphere, dim. It used to be lit for a shading model
 *           and then cut to three levels, which dropped it under the first step
 *           and stopped drawing it at all — leaving the continents floating with
 *           nothing under them, a mass off to one side of a sight aimed at the
 *           middle of a sphere nobody could see.
 *
 *   land    every coastline the map holds, a step and a half above the water.
 *
 *   wire    the sphere's own slices. A projection of a sphere is drawn as the
 *           lines it was built out of, and those lines are what make a flat
 *           disc read as a turning body: they crowd at the limb, they run into
 *           the poles, and they carry the rotation on their own — an ocean with
 *           no features in it says nothing about which way the globe is facing.
 *
 *   limb    the edge. A sphere lit from the camera has no silhouette in
 *           luminance — the brightness at the rim is the brightness at the
 *           centre — so the curvature is put in by hand.
 */

/**
 * One line of the graticule, held to a constant width on screen.
 *
 * `fwidth` is how much the coordinate moves in one pixel, so dividing by it
 * measures the distance to the line in pixels rather than in surface — which is
 * what keeps a meridian the same weight where they crowd at the limb as where
 * they are wide open at the middle. The clamp is the seam: `fract` jumps a
 * whole turn in one step there, and an unclamped derivative reads that as a
 * pixel the size of the globe and paints the entire hemisphere as one line.
 */
float wire(float coord, float width) {
  float distance = abs(fract(coord - 0.5) - 0.5);
  float pixel = min(fwidth(coord), 0.25);
  return 1.0 - smoothstep(0.0, width * pixel, distance);
}

void main() {
  // The far side of the sphere, drawn through the near side's gaps: wire only,
  // and dimmer. Its coastlines are left off — a second set of continents seen
  // from the inside, mirrored and crossing the ones in front, is the picture
  // arguing with itself, and the near half is the half being read.
  float back = gl_FrontFacing ? 1.0 : 0.0;

  // The texture is already two-valued: the loader flattens the earth to water,
  // land and ice before it is ever uploaded. So this is a choice between tones,
  // not a sample to be shaded.
  float ground = texture2D(uMap, vUv).r;
  float land = step(0.5, ground) * back;
  float body = mix(uWater, uLand, land);

  // Meridians and parallels on the sphere's own divisions. Both are taken from
  // the UV rather than from the position: the map is laid on equirectangularly,
  // so a line of constant u *is* a meridian, and the grid stays locked to the
  // coastlines it is drawn over instead of swimming under them.
  float lines = max(
    wire(vUv.x * uWire.x, uWireWidth),
    wire(vUv.y * uWire.y, uWireWidth)
  );

  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vView);
  float facing = clamp(dot(normal, view), 0.0, 1.0);
  float limb = pow(1.0 - facing, uLimbPower);

  float tone = mix(uBackTone, uWireTone, back);
  float level = max(body, lines * tone);
  level = clamp(level + limb * uLimb * back, 0.0, 1.0);

  // Nothing was drawn here, so nothing is: the ocean is the page showing
  // through, not a dark fill painted over it. Discarded rather than written at
  // zero alpha, because a fragment that is written still takes its turn in the
  // blend and the pass behind this one reads a cell it thinks was drawn.
  if (level < 0.02) discard;

  // No colour transform on the way out. Every other material on this page is
  // describing a surface and hands the pipeline a linear colour to encode; this
  // one is describing a level on a quantiser four steps deep, and an encode
  // between here and there moves each tone off the step it was put on — which
  // is how the ocean and the continents ended up on neighbouring stops of the
  // same phosphor, a hair apart on a screen that only has four tones.
  gl_FragColor = vec4(vec3(level), 1.0);
}

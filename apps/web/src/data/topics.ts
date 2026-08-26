export type Area =
  "Rendering" | "Physics" | "ECS" | "Shaders" | "Netcode" | "Tooling"

export type Difficulty = "intro" | "working" | "deep"

export type Section = {
  heading: string
  body: string
  code?: { lang: string; source: string }
}

export type Topic = {
  slug: string
  title: string
  area: Area
  summary: string
  readingMinutes: number
  /** 0–100. Fixture stand-in for per-reader progress. */
  progress: number
  prerequisites: string[]
  sections: Section[]
  caveats: string[]
  references: { label: string; href: string }[]
}

export const AREAS: Area[] = [
  "Rendering",
  "Physics",
  "ECS",
  "Shaders",
  "Netcode",
  "Tooling",
]

export const topics: Topic[] = [
  {
    slug: "deferred-shading",
    title: "Deferred Shading and the G-Buffer",
    area: "Rendering",
    summary:
      "Decouple geometry cost from light count by writing surface attributes to a buffer first and shading once per pixel afterwards.",
    readingMinutes: 14,
    progress: 62,
    prerequisites: [],
    sections: [
      {
        heading: "Why defer at all",
        body: "A forward renderer shades every fragment for every light that touches it, so cost scales with geometry times lights. Deferred shading breaks that product: the geometry pass writes position, normal, albedo and roughness into render targets, and a full-screen pass shades each visible pixel exactly once per light. The win is that overdraw stops multiplying with your light count.",
      },
      {
        heading: "Laying out the G-buffer",
        body: "Bandwidth, not arithmetic, is the limit. Pack aggressively: store normals as two channels via octahedral encoding and reconstruct the third, and derive world position from depth rather than storing it. Three RGBA8 targets plus depth is a common budget.",
        code: {
          lang: "glsl",
          source: `// Octahedral normal encoding — 3 floats into 2, no branches.
vec2 encodeNormal(vec3 n) {
  n /= abs(n.x) + abs(n.y) + abs(n.z);
  vec2 e = n.xy;
  if (n.z < 0.0) {
    e = (1.0 - abs(e.yx)) * vec2(n.x >= 0.0 ? 1.0 : -1.0, n.y >= 0.0 ? 1.0 : -1.0);
  }
  return e * 0.5 + 0.5;
}`,
        },
      },
      {
        heading: "Reconstructing position from depth",
        body: "Storing world position wastes an entire target for information you already have. Take the non-linear depth value, move to clip space, multiply by the inverse view-projection matrix and divide by w. One matrix multiply per pixel is far cheaper than the memory traffic it replaces.",
        code: {
          lang: "glsl",
          source: `vec3 worldFromDepth(vec2 uv, float depth, mat4 invViewProj) {
  vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  vec4 world = invViewProj * clip;
  return world.xyz / world.w;
}`,
        },
      },
    ],
    caveats: [
      "Transparency does not fit. A G-buffer stores one surface per pixel, so blended geometry needs a separate forward pass composited afterwards.",
      "Hardware MSAA becomes expensive, because resolving must happen per-sample before lighting rather than after.",
      "Material variety is constrained by what fits in the buffer. Anything needing per-material branching wants a shading model ID channel.",
    ],
    references: [
      {
        label: "Deferred shading — Wikipedia",
        href: "https://en.wikipedia.org/wiki/Deferred_shading",
      },
      {
        label: "LearnOpenGL: Deferred Shading",
        href: "https://learnopengl.com/Advanced-Lighting/Deferred-Shading",
      },
    ],
  },
  {
    slug: "rendering-equation",
    title: "The Rendering Equation, Read Slowly",
    area: "Rendering",
    summary:
      "Every offline and real-time renderer is an approximation of one integral. Knowing which terms you dropped tells you which artefacts to expect.",
    readingMinutes: 18,
    progress: 0,
    prerequisites: ["deferred-shading"],
    sections: [
      {
        heading: "The statement",
        body: "Outgoing radiance at a point in a direction equals emitted radiance plus the integral, over the hemisphere, of incoming radiance times the BRDF times the cosine of the angle to the normal. That is the whole thing. Every renderer differs only in how it approximates the integral.",
      },
      {
        heading: "What real-time drops",
        body: "Rasterisation with punctual lights replaces the hemisphere integral with a small sum: one term per light, incoming radiance assumed to arrive from a single direction. Everything the sum omits — light arriving after bouncing off other surfaces — is what ambient occlusion, light probes and global illumination try to put back.",
      },
      {
        heading: "Why energy conservation matters",
        body: "A BRDF that reflects more energy than it receives makes a scene brighten with every bounce. Physically based models normalise so the integral over the hemisphere never exceeds one, which is why a rough metal looks dimmer than a smooth one instead of merely blurrier.",
      },
    ],
    caveats: [
      "The equation says nothing about how to solve it. Convergence behaviour comes from your sampling strategy, not from the formulation.",
      "It assumes light transport is instantaneous and wavelength-independent. Dispersion and subsurface scattering need extensions.",
    ],
    references: [
      {
        label: "Kajiya, The Rendering Equation (1986)",
        href: "https://dl.acm.org/doi/10.1145/15922.15902",
      },
      {
        label: "Physically Based Rendering, 4th ed.",
        href: "https://pbr-book.org/",
      },
    ],
  },
  {
    slug: "fixed-timestep",
    title:
      "The Fixed Timestep Accumulator and Why Your Physics Is Frame-Rate Dependent",
    area: "Physics",
    summary:
      "Variable timesteps make simulation results depend on frame rate. An accumulator separates simulation cadence from render cadence.",
    readingMinutes: 11,
    progress: 100,
    prerequisites: [],
    sections: [
      {
        heading: "The failure",
        body: "Integrating with the frame's delta time means a machine running at 30 fps and one at 144 fps take different numbers of differently sized steps. Numerical integration error depends on step size, so the two machines disagree — a jump height changes with frame rate, and a replay recorded on one machine desynchronises on another.",
      },
      {
        heading: "The accumulator",
        body: "Add the frame's real elapsed time to an accumulator, then consume it in fixed-size chunks. Whatever remains under one step size stays for the next frame. The simulation only ever sees a constant dt.",
        code: {
          lang: "cpp",
          source: `constexpr double kStep = 1.0 / 60.0;
double accumulator = 0.0;

while (running) {
  const double frame = std::min(clock.Tick(), 0.25); // clamp: see caveats
  accumulator += frame;

  while (accumulator >= kStep) {
    previous = current;
    Integrate(current, kStep);
    accumulator -= kStep;
  }

  Render(Lerp(previous, current, accumulator / kStep));
}`,
        },
      },
      {
        heading: "Interpolating for the renderer",
        body: "The leftover accumulator is exactly how far the render time sits between the last two simulation states. Interpolate between them by that fraction, or motion stutters visibly whenever the simulation and display cadences disagree.",
      },
    ],
    caveats: [
      "Clamp the frame time. Without a ceiling, a long stall makes the inner loop run many steps, which takes longer, which grows the accumulator further — the spiral of death.",
      "Interpolation renders one step in the past. For input-sensitive games, extrapolation trades latency for occasional overshoot correction.",
      "Fixed steps alone do not give determinism across platforms; floating point still has to match.",
    ],
    references: [
      {
        label: "Gaffer On Games: Fix Your Timestep!",
        href: "https://gafferongames.com/post/fix_your_timestep/",
      },
    ],
  },
  {
    slug: "gjk-collision",
    title: "GJK Collision Detection",
    area: "Physics",
    summary:
      "Test any two convex shapes for intersection by asking whether their Minkowski difference contains the origin.",
    readingMinutes: 16,
    progress: 24,
    prerequisites: ["fixed-timestep"],
    sections: [
      {
        heading: "The reframing",
        body: "Two convex shapes intersect precisely when their Minkowski difference contains the origin. This turns 'do these two complicated shapes overlap' into 'does this one shape contain a specific point', which is a far easier question.",
      },
      {
        heading: "Support functions",
        body: "GJK never builds the Minkowski difference. It only needs the support function: given a direction, return the furthest point of the shape that way. For a sphere it is centre plus radius times the direction; for a polytope it is a dot-product scan over the vertices. Any shape with a support function works, which is why GJK handles capsules and hulls with the same code.",
        code: {
          lang: "rust",
          source: `fn support(a: &Shape, b: &Shape, dir: Vec3) -> Vec3 {
    // A point on the boundary of the Minkowski difference A - B.
    a.furthest_in(dir) - b.furthest_in(-dir)
}`,
        },
      },
      {
        heading: "Evolving the simplex",
        body: "Build up to a tetrahedron that might enclose the origin. Each iteration adds a support point in the current search direction, then discards the vertices that cannot be part of the region closest to the origin. If a new support point does not pass the origin, no such tetrahedron exists and the shapes are disjoint.",
      },
    ],
    caveats: [
      "GJK answers whether, not how much. Penetration depth needs EPA as a second phase.",
      "Convex only. Concave geometry has to be decomposed first.",
      "Termination needs care with near-degenerate simplices; an iteration cap is not optional in shipping code.",
    ],
    references: [
      {
        label:
          "Gino van den Bergen, Collision Detection in Interactive 3D Environments",
        href: "https://www.taylorfrancis.com/books/mono/10.1201/9781482297997",
      },
      {
        label: "Casey Muratori, Implementing GJK",
        href: "https://caseymuratori.com/blog_0003",
      },
    ],
  },
  {
    slug: "ecs-storage",
    title: "Archetype vs Sparse Set ECS Storage",
    area: "ECS",
    summary:
      "The two dominant component storage layouts, and the workloads each one wins.",
    readingMinutes: 15,
    progress: 45,
    prerequisites: [],
    sections: [
      {
        heading: "Archetypes",
        body: "Group entities by their exact component set. All entities with precisely {Transform, Velocity, Mesh} live in one table, each component a contiguous column. Iteration is a linear walk over dense arrays with no indirection, which is as cache-friendly as it gets.",
      },
      {
        heading: "Sparse sets",
        body: "Each component type owns a dense array of values plus a sparse array mapping entity ID to dense index. Adding or removing a component touches only that component's arrays, so structural change is cheap. Iterating several component types means intersecting sets, which costs indirection.",
      },
      {
        heading: "Choosing",
        body: "Archetypes win when component sets are stable and queries are wide — the common case for rendering and transform hierarchies. Sparse sets win when components are added and removed constantly, as with gameplay tags and status effects, because an archetype implementation has to move the entity's whole row between tables on every change.",
        code: {
          lang: "cpp",
          source: `// Archetype iteration: one linear pass, no indirection.
for (Archetype& arch : MatchingArchetypes({Transform::ID, Velocity::ID})) {
  auto* xf = arch.Column<Transform>();
  auto* vel = arch.Column<Velocity>();
  for (size_t i = 0; i < arch.Count(); ++i) {
    xf[i].position += vel[i].value * kStep;
  }
}`,
        },
      },
    ],
    caveats: [
      "Archetype fragmentation is real: many rare component combinations produce many tables with few entities each, and iteration degenerates.",
      "Neither layout fixes a bad query. Iterating one entity at a time by ID defeats both.",
      "Benchmark against your actual component distribution; synthetic ECS benchmarks rarely match a real game's.",
    ],
    references: [
      {
        label: "Sander Mertens, ECS FAQ",
        href: "https://github.com/SanderMertens/ecs-faq",
      },
      { label: "EnTT documentation", href: "https://github.com/skypjack/entt" },
    ],
  },
  {
    slug: "signed-distance-fields",
    title: "Signed Distance Fields",
    area: "Shaders",
    summary:
      "A function returning the distance to the nearest surface, which turns rendering into sphere tracing and gives cheap soft shadows and ambient occlusion.",
    readingMinutes: 13,
    progress: 8,
    prerequisites: [],
    sections: [
      {
        heading: "The definition",
        body: "An SDF maps a point to the distance to the nearest surface, negative inside. Because the value is a true distance, you can step along a ray by exactly that amount and be certain you have not passed through anything. That is sphere tracing.",
        code: {
          lang: "glsl",
          source: `float sdSphere(vec3 p, float r) { return length(p) - r; }

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Union, intersection, subtraction — CSG for free.
float opUnion(float a, float b) { return min(a, b); }
float opSubtract(float a, float b) { return max(-a, b); }`,
        },
      },
      {
        heading: "Normals without geometry",
        body: "The gradient of the distance field is the surface normal. Sample the field four to six times around the point and take differences; there is no mesh and no vertex data involved.",
      },
      {
        heading: "Free shadows and occlusion",
        body: "March toward the light and track the smallest ratio of distance to travel — that gives a penumbra for the cost of one extra march. Ambient occlusion falls out of sampling the field along the normal and comparing against expected distances.",
      },
    ],
    caveats: [
      "Operations like smooth-min and non-uniform scaling break the true-distance property, producing a bound rather than a distance. Overstepping artefacts follow, so step conservatively after them.",
      "Cost scales with scene complexity per pixel, not per triangle. Large scenes need spatial acceleration.",
    ],
    references: [
      {
        label: "Inigo Quilez, distance functions",
        href: "https://iquilezles.org/articles/distfunctions/",
      },
    ],
  },
  {
    slug: "client-prediction",
    title: "Client-Side Prediction and Server Reconciliation",
    area: "Netcode",
    summary:
      "Hide latency by simulating locally, then correct without visible snapping when the authoritative server disagrees.",
    readingMinutes: 17,
    progress: 0,
    prerequisites: ["fixed-timestep"],
    sections: [
      {
        heading: "The problem",
        body: "If the client waits for the server to acknowledge an input before moving, every action costs a round trip. At 80 ms that is unplayable for anything twitch-based.",
      },
      {
        heading: "Predict locally",
        body: "Apply input immediately on the client and simulate the result, while sending the input to the server tagged with a sequence number. The player sees an instant response. The server remains authoritative.",
      },
      {
        heading: "Reconcile on disagreement",
        body: "The server's state snapshot names the last input it processed. Discard acknowledged inputs from the local buffer, snap to the server state, then re-apply every unacknowledged input in order. If the client's prediction was right, the replay lands on the same place and nothing visibly moves.",
        code: {
          lang: "typescript",
          source: `function reconcile(server: Snapshot, pending: Input[], state: State) {
  state = server.state
  // Everything the server has already seen is settled.
  const unacked = pending.filter((input) => input.seq > server.lastProcessedSeq)
  for (const input of unacked) {
    state = step(state, input, FIXED_DT)
  }
  return { state, pending: unacked }
}`,
        },
      },
    ],
    caveats: [
      "Reconciliation requires a deterministic step function. Any non-determinism turns every replay into a visible correction.",
      "Prediction only works for what the client controls. Other players need interpolation, which renders them slightly in the past.",
      "Correcting by snapping is honest but harsh; smoothing the visual offset over a few frames hides small errors without lying about the authoritative state.",
    ],
    references: [
      {
        label: "Gabriel Gambetta, Fast-Paced Multiplayer",
        href: "https://gabrielgambetta.com/client-server-game-architecture.html",
      },
      {
        label: "Valve, Source Multiplayer Networking",
        href: "https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking",
      },
    ],
  },
  {
    slug: "hot-reload-assets",
    title: "Hot-Reloading an Asset Pipeline",
    area: "Tooling",
    summary:
      "Watch, rebuild and swap assets while the game runs, without leaking GPU resources or invalidating live handles.",
    readingMinutes: 12,
    progress: 0,
    prerequisites: [],
    sections: [
      {
        heading: "Indirection is the whole trick",
        body: "Systems must never hold a raw pointer to a loaded resource. They hold a handle, which indexes a table the loader owns. Swapping an asset means replacing a table entry; every holder picks up the new version without knowing a reload happened.",
      },
      {
        heading: "Debounce the watcher",
        body: "Filesystem events arrive in bursts — editors write atomically via a temporary file and a rename, producing several events per save. Coalesce events per path over a short window before rebuilding, or you will rebuild the same texture four times.",
      },
      {
        heading: "Fail without breaking the running game",
        body: "A shader that fails to compile should log the error and keep the previous version bound. Swapping in a broken asset because the reload path assumed success turns a typo into a crash mid-session.",
        code: {
          lang: "rust",
          source: `match compile(&source) {
    Ok(new_shader) => {
        let old = std::mem::replace(&mut table[handle.index()], new_shader);
        gpu.destroy_after_frames(old, FRAMES_IN_FLIGHT); // still referenced
    }
    Err(err) => {
        // Keep the last good version bound; the session survives a typo.
        log::error!("shader reload failed: {err}");
    }
}`,
        },
      },
    ],
    caveats: [
      "Do not free the old GPU resource immediately — frames in flight may still reference it. Defer destruction by the swap-chain depth.",
      "Reloading changes only data. Anything cached derived from the asset, such as a baked material or a descriptor set, has to be invalidated too.",
    ],
    references: [
      {
        label: "Our Machinery, asset pipelines",
        href: "https://ruby0x1.github.io/machinery_blog_archive/",
      },
    ],
  },
]

export function topicBySlug(slug: string) {
  return topics.find((topic) => topic.slug === slug)
}

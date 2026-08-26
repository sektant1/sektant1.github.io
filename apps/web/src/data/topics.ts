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
      "Lorem sit adipiscing do incididunt et aliqua minim nostrud. Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur.",
    readingMinutes: 14,
    progress: 62,
    prerequisites: [],
    sections: [
      {
        heading: "Why defer at all",
        body: "Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo aute reprehenderit esse. Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem. Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu.",
      },
      {
        heading: "Laying out the G-buffer",
        body: "Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum nulla sint non. Elit eiusmod ut dolore enim veniam exercitation nisi ea. Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt.",
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
        body: "Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat proident qui mollit est. Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse. Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem.",
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
      "Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua.",
      "Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo aute reprehenderit.",
      "Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat proident qui mollit.",
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
      "Elit eiusmod ut dolore enim veniam exercitation nisi ea duis. Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia.",
    readingMinutes: 18,
    progress: 0,
    prerequisites: ["deferred-shading"],
    sections: [
      {
        heading: "The statement",
        body: "Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed. Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non. Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit eiusmod.",
      },
      {
        heading: "What real-time drops",
        body: "Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua. Nisi ea duis in velit eu pariatur occaecat proident qui mollit est. Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore magna ad.",
      },
      {
        heading: "Why energy conservation matters",
        body: "Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation nisi. Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed. Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex.",
      },
    ],
    caveats: [
      "Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et.",
      "Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur.",
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
      "Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat. Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit.",
    readingMinutes: 11,
    progress: 100,
    prerequisites: [],
    sections: [
      {
        heading: "The failure",
        body: "Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim. Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua. Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit.",
      },
      {
        heading: "The accumulator",
        body: "Cillum nulla sint non culpa deserunt id lorem sit adipiscing. Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation nisi. Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat.",
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
        body: "Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore. Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo aute reprehenderit. Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id.",
      },
    ],
    caveats: [
      "Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation.",
      "Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum nulla.",
      "Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor.",
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
      "Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa. Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit eiusmod ut.",
    readingMinutes: 16,
    progress: 24,
    prerequisites: ["fixed-timestep"],
    sections: [
      {
        heading: "The reframing",
        body: "Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco. Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum nulla sint. Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit.",
      },
      {
        heading: "Support functions",
        body: "Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure. Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat proident qui mollit. Labore magna ad quis ullamco aliquip commodo aute reprehenderit.",
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
        body: "Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur. Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur. Minim nostrud laboris ex consequat irure voluptate cillum nulla sint.",
      },
    ],
    caveats: [
      "Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam.",
      "Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt.",
      "Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo.",
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
      "Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum. Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore magna ad quis.",
    readingMinutes: 15,
    progress: 45,
    prerequisites: [],
    sections: [
      {
        heading: "Archetypes",
        body: "Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia. Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et. Nisi ea duis in velit eu pariatur occaecat proident qui mollit.",
      },
      {
        heading: "Sparse sets",
        body: "Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit. Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation. Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur.",
      },
      {
        heading: "Choosing",
        body: "Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit eiusmod ut. Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo aute. Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et.",
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
      "Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat proident.",
      "Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit adipiscing do.",
      "Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip.",
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
      "Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor. Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat.",
    readingMinutes: 13,
    progress: 8,
    prerequisites: [],
    sections: [
      {
        heading: "The definition",
        body: "Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore magna ad quis. Cillum nulla sint non culpa deserunt id lorem sit. Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation.",
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
        body: "Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat. Occaecat proident qui mollit est ipsum amet elit eiusmod ut. Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo aute.",
      },
      {
        heading: "Free shadows and occlusion",
        body: "Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu. Officia anim laborum dolor consectetur sed tempor labore magna ad quis. Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum nulla.",
      },
    ],
    caveats: [
      "Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim.",
      "Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate.",
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
      "Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim. Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu.",
    readingMinutes: 17,
    progress: 0,
    prerequisites: ["fixed-timestep"],
    sections: [
      {
        heading: "The problem",
        body: "Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt. Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat. Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat proident qui.",
      },
      {
        heading: "Predict locally",
        body: "Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem. Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu. Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor.",
      },
      {
        heading: "Reconcile on disagreement",
        body: "Elit eiusmod ut dolore enim veniam exercitation nisi ea. Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt. Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt.",
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
      "Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim.",
      "Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore.",
      "Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure.",
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
      "Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation nisi ea. Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt.",
    readingMinutes: 12,
    progress: 0,
    prerequisites: [],
    sections: [
      {
        heading: "Indirection is the whole trick",
        body: "Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse. Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem. Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam.",
      },
      {
        heading: "Debounce the watcher",
        body: "Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non. Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit eiusmod. Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo.",
      },
      {
        heading: "Fail without breaking the running game",
        body: "Nisi ea duis in velit eu pariatur occaecat proident qui mollit est. Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore magna ad. Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum.",
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
      "Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco.",
      "Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur.",
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

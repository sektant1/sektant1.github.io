import type { Area } from "@/data/topics"

export type Snippet = {
  id: string
  title: string
  language: "C++" | "Rust" | "TypeScript" | "GLSL" | "WGSL" | "C#"
  area: Area
  description: string
  source: string
}

export const snippets: Snippet[] = [
  {
    id: "sn-01",
    title: "GGX normal distribution",
    language: "GLSL",
    area: "Shaders",
    description:
      "Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo. Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa.",
    source: `float D_GGX(float NoH, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float d = (NoH * a2 - NoH) * NoH + 1.0;
  return a2 / (PI * d * d);
}`,
  },
  {
    id: "sn-02",
    title: "Height-correlated Smith visibility",
    language: "GLSL",
    area: "Shaders",
    description:
      "Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum. Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum.",
    source: `float V_SmithGGXCorrelated(float NoV, float NoL, float roughness) {
  float a2 = pow(roughness, 4.0);
  float lv = NoL * sqrt(NoV * NoV * (1.0 - a2) + a2);
  float ll = NoV * sqrt(NoL * NoL * (1.0 - a2) + a2);
  return 0.5 / max(lv + ll, 1e-5);
}`,
  },
  {
    id: "sn-03",
    title: "Octahedral normal encode and decode",
    language: "GLSL",
    area: "Rendering",
    description:
      "Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat proident. Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor.",
    source: `vec2 encodeOct(vec3 n) {
  n /= abs(n.x) + abs(n.y) + abs(n.z);
  vec2 e = n.z >= 0.0 ? n.xy : (1.0 - abs(n.yx)) * sign(n.xy);
  return e * 0.5 + 0.5;
}

vec3 decodeOct(vec2 e) {
  e = e * 2.0 - 1.0;
  vec3 n = vec3(e.xy, 1.0 - abs(e.x) - abs(e.y));
  float t = max(-n.z, 0.0);
  n.xy += vec2(n.x >= 0.0 ? -t : t, n.y >= 0.0 ? -t : t);
  return normalize(n);
}`,
  },
  {
    id: "sn-04",
    title: "Fixed timestep loop with spiral-of-death guard",
    language: "C++",
    area: "Physics",
    description:
      "Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum. Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim.",
    source: `constexpr double kStep = 1.0 / 60.0;
constexpr double kMaxFrame = 0.25; // never simulate more than 15 steps at once

double accumulator = 0.0;
while (running) {
  accumulator += std::min(clock.Tick(), kMaxFrame);
  while (accumulator >= kStep) {
    previous = current;
    Integrate(current, kStep);
    accumulator -= kStep;
  }
  Render(Lerp(previous, current, accumulator / kStep));
}`,
  },
  {
    id: "sn-05",
    title: "Semi-implicit Euler",
    language: "C++",
    area: "Physics",
    description:
      "Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit adipiscing do. Nisi ea duis in velit eu pariatur occaecat proident.",
    source: `void Integrate(Body& body, double dt) {
  body.velocity += body.acceleration * dt;  // velocity first —
  body.position += body.velocity * dt;      // — position uses the new value
}`,
  },
  {
    id: "sn-06",
    title: "Support function for a convex hull",
    language: "Rust",
    area: "Physics",
    description:
      "Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim. Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum.",
    source: `fn furthest_in(&self, dir: Vec3) -> Vec3 {
    self.vertices
        .iter()
        .copied()
        .max_by(|a, b| a.dot(dir).partial_cmp(&b.dot(dir)).unwrap())
        .expect("hull must have at least one vertex")
}`,
  },
  {
    id: "sn-07",
    title: "Sparse set removal by swap and pop",
    language: "Rust",
    area: "ECS",
    description:
      "Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip. Cillum nulla sint non culpa deserunt id lorem sit adipiscing do.",
    source: `pub fn remove(&mut self, entity: Entity) -> Option<T> {
    let dense_index = self.sparse.get(entity.index())?.to_owned()?;
    let moved = *self.entities.last()?;

    let value = self.dense.swap_remove(dense_index);
    self.entities.swap_remove(dense_index);

    // The entity that got swapped into this slot needs its index repaired.
    if moved != entity {
        self.sparse[moved.index()] = Some(dense_index);
    }
    self.sparse[entity.index()] = None;
    Some(value)
}`,
  },
  {
    id: "sn-08",
    title: "Generational entity handle",
    language: "Rust",
    area: "ECS",
    description:
      "Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate. Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim.",
    source: `#[derive(Copy, Clone, PartialEq, Eq, Hash)]
pub struct Entity(u64);

impl Entity {
    pub fn new(index: u32, generation: u32) -> Self {
        Entity(((generation as u64) << 32) | index as u64)
    }
    pub fn index(self) -> usize { (self.0 & 0xFFFF_FFFF) as usize }
    pub fn generation(self) -> u32 { (self.0 >> 32) as u32 }
}`,
  },
  {
    id: "sn-09",
    title: "Input ring buffer for prediction",
    language: "TypeScript",
    area: "Netcode",
    description:
      "Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat. Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip.",
    source: `export class InputBuffer {
  private readonly items: (Input | undefined)[]
  constructor(private readonly capacity: number) {
    this.items = new Array(capacity)
  }
  push(input: Input) {
    this.items[input.seq % this.capacity] = input
  }
  since(seq: number): Input[] {
    const out: Input[] = []
    for (const item of this.items) {
      if (item && item.seq > seq) out.push(item)
    }
    return out.sort((a, b) => a.seq - b.seq)
  }
}`,
  },
  {
    id: "sn-10",
    title: "Snapshot interpolation for remote entities",
    language: "TypeScript",
    area: "Netcode",
    description:
      "Officia anim laborum dolor consectetur sed tempor labore magna. Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate.",
    source: `const RENDER_DELAY_MS = 100

export function interpolate(buffer: Snapshot[], now: number): State | null {
  const target = now - RENDER_DELAY_MS
  const after = buffer.findIndex((snapshot) => snapshot.time >= target)
  if (after <= 0) return buffer.at(after === 0 ? 0 : -1)?.state ?? null
  const a = buffer[after - 1]
  const b = buffer[after]
  const t = (target - a.time) / (b.time - a.time)
  return lerpState(a.state, b.state, t)
}`,
  },
  {
    id: "sn-11",
    title: "Debounced filesystem watcher",
    language: "TypeScript",
    area: "Tooling",
    description:
      "Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris. Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat.",
    source: `const pending = new Map<string, ReturnType<typeof setTimeout>>()

watcher.on("change", (path: string) => {
  clearTimeout(pending.get(path))
  pending.set(path, setTimeout(() => {
    pending.delete(path)
    rebuild(path)
  }, 40))
})`,
  },
  {
    id: "sn-12",
    title: "Deferred GPU resource destruction",
    language: "C++",
    area: "Tooling",
    description:
      "Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in. Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim.",
    source: `struct PendingDelete { GpuHandle handle; uint64_t retire_frame; };
std::vector<PendingDelete> pending;

void DestroyAfterFramesInFlight(GpuHandle handle) {
  pending.push_back({handle, current_frame + kFramesInFlight});
}

void CollectRetired() {
  std::erase_if(pending, [&](const PendingDelete& p) {
    if (p.retire_frame > current_frame) return false;
    gpu.Destroy(p.handle);
    return true;
  });
}`,
  },
  {
    id: "sn-13",
    title: "Compute shader workgroup dispatch sizing",
    language: "WGSL",
    area: "Rendering",
    description:
      "Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur. Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit adipiscing.",
    source: `@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  // Dispatch rounds up, so the tail workgroup overruns. Always guard.
  if (id.x >= uniforms.width || id.y >= uniforms.height) { return; }
  let index = id.y * uniforms.width + id.x;
  output[index] = shade(id.xy);
}`,
  },
  {
    id: "sn-14",
    title: "Frame-scoped profiling span",
    language: "C#",
    area: "Tooling",
    description:
      "Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt. Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore.",
    source: `public readonly struct ProfileScope : IDisposable {
    private readonly string _label;
    private readonly long _start;

    public ProfileScope(string label) {
        _label = label;
        _start = Stopwatch.GetTimestamp();
    }

    public void Dispose() =>
        Profiler.Record(_label, Stopwatch.GetTimestamp() - _start);
}`,
  },
]

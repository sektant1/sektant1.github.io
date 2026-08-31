import * as THREE from "three"

import { resolveThemeColor } from "./theme-color"
import { latLonToVector3 } from "./geo"

export interface EarthLocation {
  id: string
  name: string
  country: string
  lat: number
  lon: number
  variant: "military" | "user"
  eyebrow?: string
  showLabel?: boolean
}

export const EARTH_LOCATIONS: EarthLocation[] = [
  {
    id: "pripyat",
    name: "PRYPIAT",
    country: "UKRAINE",
    lat: 51.406681,
    lon: 30.046425,
    variant: "military",
    eyebrow: "HIDEOUT'S LOCATION",
  },
]

interface EarthLocationMarker {
  anchor: THREE.Object3D
  label?: HTMLDivElement
  target: HTMLDivElement
  connector?: SVGLineElement
  endpoint?: SVGCircleElement
  location: EarthLocation
}

export interface EarthLocationMarkersHandle {
  group: THREE.Group
  addLocation: (location: EarthLocation) => void
  update: () => void
  /** Markers freeze where they were when the scene stops, so a paused scene
   *  hides them rather than leaving pins over whatever scrolled into place. */
  setVisible: (visible: boolean) => void
  dispose: () => void
}

const EARTH_RADIUS = 1.4

export function createEarthLocationMarkers({
  host,
  planetMesh,
  camera,
  locations = EARTH_LOCATIONS,
}: {
  host: HTMLElement
  planetMesh: THREE.Object3D
  camera: THREE.Camera
  locations?: EarthLocation[]
}): EarthLocationMarkersHandle {
  const group = new THREE.Group()
  group.name = "earth-location-markers"
  const theme = resolveMarkerTheme()
  const overlay = createConnectorOverlay()
  const markers: EarthLocationMarker[] = []

  document.body.appendChild(overlay.svg)

  const addLocation = (location: EarthLocation) => {
    if (markers.some((marker) => marker.location.id === location.id)) return

    const normal = latLonToVector3(location.lat, location.lon, 1)
    const marker = createMilitaryMarker(normal, location.variant, theme)
    const label =
      location.showLabel === false ? undefined : createLocationLabel(location)
    const target = createLocationTarget(location)
    const anchor = new THREE.Object3D()
    const connector = label ? createSvgLine(location.variant) : undefined
    const endpoint = label ? createSvgCircle(location.variant) : undefined

    anchor.name = `${location.id}-label-anchor`
    anchor.position.copy(normal).multiplyScalar(EARTH_RADIUS + 0.012)
    marker.add(anchor)
    group.add(marker)
    if (connector && endpoint) overlay.svg.append(connector, endpoint)
    if (label) document.body.appendChild(label)
    document.body.appendChild(target)
    markers.push({ anchor, label, target, connector, endpoint, location })
  }

  for (const location of locations) {
    addLocation(location)
  }

  planetMesh.add(group)

  const hostRect = new THREE.Vector2()
  const worldPosition = new THREE.Vector3()
  const planetWorldPosition = new THREE.Vector3()
  const cameraWorldPosition = new THREE.Vector3()
  const surfaceNormal = new THREE.Vector3()
  const cameraVector = new THREE.Vector3()

  const update = () => {
    const width = host.clientWidth || 1
    const height = host.clientHeight || 1
    hostRect.set(width, height)
    planetMesh.getWorldPosition(planetWorldPosition)
    camera.getWorldPosition(cameraWorldPosition)

    for (const marker of markers) {
      marker.anchor.getWorldPosition(worldPosition)
      surfaceNormal.subVectors(worldPosition, planetWorldPosition).normalize()
      cameraVector
        .subVectors(cameraWorldPosition, planetWorldPosition)
        .normalize()
      const visibility = THREE.MathUtils.smoothstep(
        surfaceNormal.dot(cameraVector),
        -0.03,
        0.16
      )

      const projected = worldPosition.clone().project(camera)
      const hostBox = host.getBoundingClientRect()
      const x = hostBox.left + (projected.x * 0.5 + 0.5) * hostRect.x
      const y = hostBox.top + (-projected.y * 0.5 + 0.5) * hostRect.y

      // Labels and pins are fixed to the viewport rather than to the panel, so
      // that a label can hang outside the frame without being clipped by it.
      // The cost is that nothing stops one drifting over the header as the
      // page scrolls, so the panel's own box is the clip: a marker outside it
      // is not drawn.
      const inPanel =
        x >= hostBox.left - 2 &&
        x <= hostBox.right + 2 &&
        y >= hostBox.top - 2 &&
        y <= hostBox.bottom + 2
      const shown = inPanel ? visibility : 0

      if (marker.label && marker.connector && marker.endpoint) {
        const labelBox = marker.label.getBoundingClientRect()
        const labelX = x - labelBox.width * 0.5
        const labelY = y - labelBox.height - 34
        const labelAnchorX = x
        const labelAnchorY = labelY + labelBox.height

        marker.label.style.transform = `translate3d(${labelX}px, ${labelY}px, 0)`
        // The label hangs above the pin, so it has to clear the panel's top
        // edge on its own account, not the pin's.
        const labelInPanel = inPanel && labelY >= hostBox.top - 2
        marker.label.dataset.visible =
          labelInPanel && shown > 0.08 ? "true" : "false"
        marker.label.style.setProperty(
          "--marker-visibility",
          String(labelInPanel ? shown : 0)
        )
        marker.connector.setAttribute("x1", String(labelAnchorX))
        marker.connector.setAttribute("y1", String(labelAnchorY))
        marker.connector.setAttribute("x2", String(x))
        marker.connector.setAttribute("y2", String(y))
        marker.endpoint.setAttribute("cx", String(x))
        marker.endpoint.setAttribute("cy", String(y))
        marker.connector.style.opacity = String(labelInPanel ? shown : 0)
        marker.endpoint.style.opacity = String(shown)
      }

      marker.target.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      marker.target.style.opacity = String(shown)
    }
  }

  return {
    group,
    addLocation,
    update,
    setVisible(visible) {
      const display = visible ? "" : "none"
      overlay.svg.style.display = display
      markers.forEach((marker) => {
        if (marker.label) marker.label.style.display = display
        marker.target.style.display = display
      })
    },
    dispose() {
      planetMesh.remove(group)
      group.traverse((object) => {
        const mesh = object as THREE.Mesh
        mesh.geometry?.dispose()
        const material = mesh.material as
          THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(material)) material.forEach((item) => item.dispose())
        else material?.dispose?.()
      })
      markers.forEach((marker) => {
        marker.label?.remove()
        marker.target.remove()
      })
      overlay.svg.remove()
    },
  }
}

function createMilitaryMarker(
  normal: THREE.Vector3,
  variant: EarthLocation["variant"],
  theme: MarkerTheme
): THREE.Group {
  const marker = new THREE.Group()
  marker.name = "military-location-marker"
  const scale = variant === "user" ? 0.56 : 1
  const markerColor = variant === "user" ? theme.user : theme.hideout
  const markerGlow = variant === "user" ? theme.userGlow : theme.hideoutGlow

  const surface = normal.clone().multiplyScalar(EARTH_RADIUS + 0.012)
  const pinTop = normal.clone().multiplyScalar(EARTH_RADIUS + 0.2 * scale)
  const orientation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    normal
  )

  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.026 * scale, 10, 8),
    new THREE.MeshBasicMaterial({
      color: markerColor,
      transparent: true,
      opacity: 0.95,
    })
  )
  dot.position.copy(surface)
  marker.add(dot)

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.072 * scale, 0.004, 6, 24),
    new THREE.MeshBasicMaterial({
      color: markerGlow,
      transparent: true,
      opacity: 0.72,
    })
  )
  halo.position.copy(surface.clone().add(normal.clone().multiplyScalar(0.006)))
  halo.quaternion.copy(orientation)
  marker.add(halo)

  const crosshairMaterial = new THREE.LineBasicMaterial({
    color: markerColor,
    transparent: true,
    opacity: 0.82,
  })
  const crosshairSize = 0.085 * scale
  marker.add(
    createLine(
      surface
        .clone()
        .add(
          new THREE.Vector3(-crosshairSize, 0, 0).applyQuaternion(orientation)
        ),
      surface
        .clone()
        .add(
          new THREE.Vector3(crosshairSize, 0, 0).applyQuaternion(orientation)
        ),
      crosshairMaterial
    )
  )
  marker.add(
    createLine(
      surface
        .clone()
        .add(
          new THREE.Vector3(0, -crosshairSize, 0).applyQuaternion(orientation)
        ),
      surface
        .clone()
        .add(
          new THREE.Vector3(0, crosshairSize, 0).applyQuaternion(orientation)
        ),
      crosshairMaterial
    )
  )

  marker.add(
    createLine(
      surface,
      pinTop,
      new THREE.LineBasicMaterial({
        color: markerColor,
        transparent: true,
        opacity: 0.64,
      })
    )
  )

  return marker
}

function createLine(
  start: THREE.Vector3,
  end: THREE.Vector3,
  material: THREE.LineBasicMaterial
): THREE.Line {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([start, end]),
    material
  )
}

function createLocationLabel(location: EarthLocation): HTMLDivElement {
  const label = document.createElement("div")
  label.className = "ascii-planet-location-label"
  label.classList.add(`ascii-planet-location-label--${location.variant}`)
  label.dataset.location = location.id
  label.innerHTML = `
    ${location.eyebrow ? `<span class="ascii-planet-location-label__eyebrow">${location.eyebrow}</span>` : ""}
    <span class="ascii-planet-location-label__name">${location.name}</span>
    <span class="ascii-planet-location-label__country">${location.country}</span>
    <span class="ascii-planet-location-label__coords">${location.lat.toFixed(4)}°N / ${location.lon.toFixed(4)}°E</span>
  `
  return label
}

function createLocationTarget(location: EarthLocation): HTMLDivElement {
  const target = document.createElement("div")
  target.className = "ascii-planet-location-target"
  target.classList.add(`ascii-planet-location-target--${location.variant}`)
  target.dataset.location = location.id
  target.setAttribute("aria-hidden", "true")
  return target
}

function createConnectorOverlay(): { svg: SVGSVGElement } {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.classList.add("ascii-planet-location-connectors")
  svg.setAttribute("aria-hidden", "true")
  return { svg }
}

function createSvgLine(variant: EarthLocation["variant"]): SVGLineElement {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
  line.classList.add("ascii-planet-location-connectors__line")
  line.classList.add(`ascii-planet-location-connectors__line--${variant}`)
  return line
}

function createSvgCircle(variant: EarthLocation["variant"]): SVGCircleElement {
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  )
  circle.classList.add("ascii-planet-location-connectors__endpoint")
  circle.classList.add(`ascii-planet-location-connectors__endpoint--${variant}`)
  circle.setAttribute("r", "3")
  return circle
}

interface MarkerTheme {
  hideout: THREE.Color
  hideoutGlow: THREE.Color
  user: THREE.Color
  userGlow: THREE.Color
}

function resolveMarkerTheme(): MarkerTheme {
  const primary = resolveThemeColor("--primary", "#32f078")
  const primaryStrong = resolveThemeColor("--primary", "#a9ffc9")
  return {
    hideout: primaryStrong,
    hideoutGlow: primary,
    user: primaryStrong,
    userGlow: primary,
  }
}

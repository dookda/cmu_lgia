import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import type { Map as MapLibreMap } from 'maplibre-gl'

const MAPTILER_KEY = 'QcH5sAeCUv5rMXKrnJms'

const BASE_MAPS: Record<string, string | object> = {
  maptiler: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
  osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  grod: 'https://mt0.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
  gsat: 'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  ghyb: 'https://mt0.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}',
}

function buildStyle(key: string): object {
  if (key === 'maptiler') return { style: BASE_MAPS.maptiler as string }
  const tileUrl = BASE_MAPS[key] as string
  return {
    style: {
      version: 8,
      sources: { 'raster-tiles': { type: 'raster', tiles: [tileUrl], tileSize: 256 } },
      layers: [{ id: 'raster-layer', type: 'raster', source: 'raster-tiles', minzoom: 0, maxzoom: 22 }],
    },
  }
}

interface MapViewProps {
  baseMap?: string
  center?: [number, number]
  zoom?: number
  onMapReady?: (map: MapLibreMap) => void
  style?: React.CSSProperties
}

export function MapView({
  baseMap = 'osm',
  center = [99.0173, 18.5762],
  zoom = 7,
  onMapReady,
  style,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return

    const { style: mapStyle } = buildStyle(baseMap) as { style: string | object }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle as maplibregl.StyleSpecification,
      center,
      zoom,
      antialias: true,
    })

    map.addControl(new maplibregl.NavigationControl())
    mapRef.current = map

    map.on('load', () => {
      onMapReady?.(map)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update base map style when prop changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const { style: mapStyle } = buildStyle(baseMap) as { style: string | object }
    map.setStyle(mapStyle as maplibregl.StyleSpecification)
  }, [baseMap])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: 400, borderRadius: 'var(--radius-md)', ...style }}
    />
  )
}

export type { MapLibreMap }

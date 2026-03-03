import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import maplibregl from 'maplibre-gl'
import { AppLayout } from '../../templates/AppLayout/AppLayout'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Select } from '../../atoms/Select/Select'
import { Alert } from '../../atoms/Alert/Alert'
import { layersApi, geoApi } from '../../../services/api'

const MAPTILER_KEY = 'QcH5sAeCUv5rMXKrnJms'

const BASE_MAPS: Record<string, string | object> = {
  osm: {
    version: 8,
    sources: { raster: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 } },
    layers: [{ id: 'raster-layer', type: 'raster', source: 'raster' }],
  },
  maptiler: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
  grod: {
    version: 8,
    sources: { raster: { type: 'raster', tiles: ['https://mt0.google.com/vt/lyrs=r&x={x}&y={y}&z={z}'], tileSize: 256 } },
    layers: [{ id: 'raster-layer', type: 'raster', source: 'raster' }],
  },
  gsat: {
    version: 8,
    sources: { raster: { type: 'raster', tiles: ['https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'], tileSize: 256 } },
    layers: [{ id: 'raster-layer', type: 'raster', source: 'raster' }],
  },
  ghyb: {
    version: 8,
    sources: { raster: { type: 'raster', tiles: ['https://mt0.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}'], tileSize: 256 } },
    layers: [{ id: 'raster-layer', type: 'raster', source: 'raster' }],
  },
}

const BASE_MAP_OPTIONS = [
  { value: 'osm', label: 'OpenStreetMap' },
  { value: 'maptiler', label: 'Maptiler 3D' },
  { value: 'grod', label: 'Google Road' },
  { value: 'gsat', label: 'Google Satellite' },
  { value: 'ghyb', label: 'Google Hybrid' },
]

const COLUMN_TYPES = [
  { value: 'text', label: 'ตัวอักษร' },
  { value: 'numeric', label: 'ตัวเลข' },
  { value: 'integer', label: 'จำนวนเต็ม' },
  { value: 'date', label: 'วันที่' },
  { value: 'file', label: 'รูปภาพ' },
]

type ColMeta = { col_id: string; col_name: string; col_type: string; col_desc: string }

interface StyleState {
  circleColor: string
  circleRadius: number
  strokeColor: string
  strokeWidth: number
  lineColor: string
  lineWidth: number
  polygonColor: string
  polygonOpacity: number
}

const DEFAULT_STYLE: StyleState = {
  circleColor: '#FF0000',
  circleRadius: 8,
  strokeColor: '#FFFFFF',
  strokeWidth: 2,
  lineColor: '#00FF00',
  lineWidth: 3,
  polygonColor: '#0000FF',
  polygonOpacity: 0.4,
}

function styleToJson(s: StyleState) {
  return JSON.stringify([
    {
      id: 'gl-draw-point', type: 'circle',
      filter: ['all', ['==', '$type', 'Point']],
      paint: {
        'circle-radius': s.circleRadius,
        'circle-color': s.circleColor,
        'circle-stroke-width': s.strokeWidth,
        'circle-stroke-color': s.strokeColor,
      },
      metadata: { 'marker-icon': 'none' },
    },
    {
      id: 'gl-draw-line', type: 'line',
      filter: ['all', ['==', '$type', 'LineString']],
      paint: { 'line-color': s.lineColor, 'line-width': s.lineWidth },
    },
    {
      id: 'gl-draw-polygon', type: 'fill',
      filter: ['all', ['==', '$type', 'Polygon']],
      paint: { 'fill-color': s.polygonColor, 'fill-opacity': s.polygonOpacity },
    },
    {
      id: 'gl-draw-polygon-outline', type: 'line',
      filter: ['all', ['==', '$type', 'Polygon']],
      paint: { 'line-color': s.lineColor, 'line-width': s.lineWidth },
    },
  ])
}

function parseStyleJson(jsonStr: string): Partial<StyleState> {
  try {
    const arr = JSON.parse(jsonStr) as Array<{ paint?: Record<string, unknown> }>
    const point = arr[0]?.paint ?? {}
    const line = arr[1]?.paint ?? {}
    const poly = arr[2]?.paint ?? {}
    return {
      circleColor: (point['circle-color'] as string) ?? DEFAULT_STYLE.circleColor,
      circleRadius: (point['circle-radius'] as number) ?? DEFAULT_STYLE.circleRadius,
      strokeColor: (point['circle-stroke-color'] as string) ?? DEFAULT_STYLE.strokeColor,
      strokeWidth: (point['circle-stroke-width'] as number) ?? DEFAULT_STYLE.strokeWidth,
      lineColor: (line['line-color'] as string) ?? DEFAULT_STYLE.lineColor,
      lineWidth: (line['line-width'] as number) ?? DEFAULT_STYLE.lineWidth,
      polygonColor: (poly['fill-color'] as string) ?? DEFAULT_STYLE.polygonColor,
      polygonOpacity: (poly['fill-opacity'] as number) ?? DEFAULT_STYLE.polygonOpacity,
    }
  } catch {
    return {}
  }
}

const GEOJSON_SOURCE = 'detail-feature-source'

export function DetailPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const formid = params.get('formid') ?? ''
  const refid = params.get('refid') ?? ''
  const layertype = (params.get('type') ?? 'point').toLowerCase()

  const mapInstance = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const mapReady = useRef(false)

  const [baseMap, setBaseMap] = useState('osm')
  const [activeTab, setActiveTab] = useState<'basemap' | 'search' | 'style'>('basemap')
  const [activeColTab, setActiveColTab] = useState<'add' | 'delete' | 'rename'>('add')
  const [style, setStyle] = useState<StyleState>(DEFAULT_STYLE)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [searchLat, setSearchLat] = useState('')
  const [searchLng, setSearchLng] = useState('')
  const [searchCoordType, setSearchCoordType] = useState<'latLng' | 'utm'>('latLng')
  const [utmEasting, setUtmEasting] = useState('')
  const [utmNorthing, setUtmNorthing] = useState('')
  const [utmZone, setUtmZone] = useState('47')
  const [utmSearching, setUtmSearching] = useState(false)
  const [pendingLngLat, setPendingLngLat] = useState<[number, number] | null>(null)
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'danger' } | null>(null)
  const [newCol, setNewCol] = useState({ name: '', type: 'text', desc: '' })
  const [renameValues, setRenameValues] = useState<Record<string, string>>({})

  // Queries
  const { data: columns = [] } = useQuery<ColMeta[]>({
    queryKey: ['layerDesc', formid],
    queryFn: () => layersApi.loadDescription(formid),
    enabled: !!formid,
  })

  const { data: featureRows = [] } = useQuery<Record<string, unknown>[]>({
    queryKey: ['featureById', formid, refid],
    queryFn: () => layersApi.loadFeatureById(formid, refid),
    enabled: !!formid && !!refid,
  })

  const { data: styleData } = useQuery<{ style?: string }>({
    queryKey: ['featureStyle', formid, refid],
    queryFn: () => layersApi.loadFeatureStyle(formid, refid),
    enabled: !!formid && !!refid,
  })

  // Init form data when feature loaded
  useEffect(() => {
    if (!featureRows.length || !columns.length) return
    const row = featureRows[0] as Record<string, unknown>
    const init: Record<string, string> = {}
    columns.forEach((col) => {
      const val = row[col.col_id]
      init[col.col_id] = val != null ? String(val) : ''
    })
    setFormData(init)
  }, [featureRows, columns])

  // Init rename values when columns loaded
  useEffect(() => {
    if (!columns.length) return
    const init: Record<string, string> = {}
    columns.forEach((col) => { init[col.col_id] = col.col_name })
    setRenameValues(init)
  }, [columns])

  // Init style from server
  useEffect(() => {
    if (!styleData?.style) return
    const parsed = parseStyleJson(styleData.style)
    setStyle((prev) => ({ ...prev, ...parsed }))
  }, [styleData])

  // Callback ref: initialises map as soon as the container div is in the DOM
  const mapCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || mapInstance.current) return
    const mapStyle = BASE_MAPS[baseMap]
    const map = new maplibregl.Map({
      container: node,
      style: (typeof mapStyle === 'string' ? mapStyle : mapStyle) as maplibregl.StyleSpecification,
      center: [99.0173, 18.5762],
      zoom: 8,
      antialias: true,
    })
    map.addControl(new maplibregl.NavigationControl())

    map.on('load', () => {
      mapReady.current = true
      map.resize()
    })

    // For point: click to move
    if (layertype === 'point') {
      map.on('click', (e) => {
        const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat]
        setPendingLngLat(lngLat)
        if (markerRef.current) {
          markerRef.current.setLngLat(lngLat)
        }
      })
    }

    mapInstance.current = map

    // ResizeObserver keeps the map canvas in sync with container size
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(node)

    // Cleanup when component unmounts
    const cleanup = () => { ro.disconnect(); map.remove(); mapInstance.current = null; mapReady.current = false }
      ; (node as HTMLDivElement & { _mapCleanup?: () => void })._mapCleanup = cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layertype])

  // Change base map
  useEffect(() => {
    if (!mapInstance.current) return
    const mapStyle = BASE_MAPS[baseMap]
    mapInstance.current.setStyle((typeof mapStyle === 'string' ? mapStyle : mapStyle) as maplibregl.StyleSpecification)
    // Re-add layers after style load
    mapInstance.current.once('styledata', () => { renderFeature() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseMap])

  const renderFeature = useCallback(() => {
    const map = mapInstance.current
    if (!map || !featureRows.length) return
    const row = featureRows[0] as Record<string, unknown>
    const geojsonStr = row.geojson as string | undefined
    if (!geojsonStr) return

    let geom: GeoJSON.Geometry | null = null
    try { geom = JSON.parse(geojsonStr) } catch { return }

    if (layertype === 'point' && geom?.type === 'Point') {
      const coords = (geom as GeoJSON.Point).coordinates as [number, number]
      if (markerRef.current) markerRef.current.remove()
      const el = createPointEl(style)
      const mk = new maplibregl.Marker({ element: el }).setLngLat(coords).addTo(map)
      markerRef.current = mk
      map.flyTo({ center: coords, zoom: 14 })
    } else if ((layertype === 'linestring' || layertype === 'polygon') && geom) {
      const fc: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: geom, properties: {} }],
      }
      if (map.getSource(GEOJSON_SOURCE)) {
        (map.getSource(GEOJSON_SOURCE) as maplibregl.GeoJSONSource).setData(fc)
      } else {
        map.addSource(GEOJSON_SOURCE, { type: 'geojson', data: fc })
        if (layertype === 'linestring') {
          map.addLayer({
            id: 'detail-line',
            type: 'line',
            source: GEOJSON_SOURCE,
            paint: { 'line-color': style.lineColor, 'line-width': style.lineWidth },
          })
        } else {
          map.addLayer({
            id: 'detail-fill',
            type: 'fill',
            source: GEOJSON_SOURCE,
            paint: { 'fill-color': style.polygonColor, 'fill-opacity': style.polygonOpacity },
          })
          map.addLayer({
            id: 'detail-outline',
            type: 'line',
            source: GEOJSON_SOURCE,
            paint: { 'line-color': style.lineColor, 'line-width': style.lineWidth },
          })
        }
      }

      // Fit bounds
      const bounds = new maplibregl.LngLatBounds()
      const extend = (c: number[]) => bounds.extend(c as [number, number])
      if (geom.type === 'LineString') (geom as GeoJSON.LineString).coordinates.forEach(extend)
      else if (geom.type === 'Polygon') (geom as GeoJSON.Polygon).coordinates[0].forEach(extend)
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60 })
    }
  }, [featureRows, layertype, style])

  // Render feature on map when data arrives
  useEffect(() => {
    if (!mapInstance.current || !featureRows.length) return
    // Wait for map to be ready
    if (mapReady.current) {
      renderFeature()
    } else {
      mapInstance.current.once('load', () => renderFeature())
    }
  }, [featureRows, renderFeature])

  // Update line/polygon paint when style changes
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return
    if (layertype === 'linestring') {
      if (map.getLayer('detail-line')) {
        map.setPaintProperty('detail-line', 'line-color', style.lineColor)
        map.setPaintProperty('detail-line', 'line-width', style.lineWidth)
      }
    } else if (layertype === 'polygon') {
      if (map.getLayer('detail-fill')) {
        map.setPaintProperty('detail-fill', 'fill-color', style.polygonColor)
        map.setPaintProperty('detail-fill', 'fill-opacity', style.polygonOpacity)
      }
      if (map.getLayer('detail-outline')) {
        map.setPaintProperty('detail-outline', 'line-color', style.lineColor)
        map.setPaintProperty('detail-outline', 'line-width', style.lineWidth)
      }
    }
  }, [style, layertype])

  // Update point marker when style changes
  useEffect(() => {
    if (layertype !== 'point' || !markerRef.current) return
    const el = createPointEl(style)
    const lngLat = markerRef.current.getLngLat()
    markerRef.current.remove()
    const map = mapInstance.current
    if (!map) return
    markerRef.current = new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(map)
  }, [style, layertype])

  // Mutations
  const saveAttrMutation = useMutation({
    mutationFn: () => layersApi.updateRow(formid, refid, formData),
    onSuccess: () => setMessage({ text: 'บันทึกข้อมูลสำเร็จ', variant: 'success' }),
    onError: () => setMessage({ text: 'เกิดข้อผิดพลาดในการบันทึก', variant: 'danger' }),
  })

  const saveStyleMutation = useMutation({
    mutationFn: () => layersApi.updateFeatureStyle({ formid, refid, style: styleToJson(style) }),
    onSuccess: () => setMessage({ text: 'บันทึกรูปแบบสำเร็จ', variant: 'success' }),
    onError: () => setMessage({ text: 'เกิดข้อผิดพลาดในการบันทึกรูปแบบ', variant: 'danger' }),
  })

  const saveGeomMutation = useMutation({
    mutationFn: (lngLat: [number, number]) =>
      layersApi.updateFeature({
        formid, refid,
        geojson: JSON.stringify({ type: 'Point', coordinates: lngLat }),
        style: styleToJson(style),
      }),
    onSuccess: () => {
      setPendingLngLat(null)
      setMessage({ text: 'บันทึกตำแหน่งสำเร็จ', variant: 'success' })
      qc.invalidateQueries({ queryKey: ['featureById', formid, refid] })
    },
    onError: () => setMessage({ text: 'เกิดข้อผิดพลาดในการบันทึกตำแหน่ง', variant: 'danger' }),
  })

  const createColMutation = useMutation({
    mutationFn: () => layersApi.createColumn(formid, {
      col_id: `${formid}_${Date.now()}`,
      col_name: newCol.name,
      col_type: newCol.type,
      col_desc: newCol.desc,
    }),
    onSuccess: () => {
      setNewCol({ name: '', type: 'text', desc: '' })
      setMessage({ text: 'สร้างคอลัมน์สำเร็จ', variant: 'success' })
      qc.invalidateQueries({ queryKey: ['layerDesc', formid] })
    },
    onError: () => setMessage({ text: 'เกิดข้อผิดพลาดในการสร้างคอลัมน์', variant: 'danger' }),
  })

  const deleteColMutation = useMutation({
    mutationFn: (colId: string) => layersApi.deleteColumn(formid, colId),
    onSuccess: () => {
      setMessage({ text: 'ลบคอลัมน์สำเร็จ', variant: 'success' })
      qc.invalidateQueries({ queryKey: ['layerDesc', formid] })
    },
    onError: () => setMessage({ text: 'เกิดข้อผิดพลาดในการลบคอลัมน์', variant: 'danger' }),
  })

  const renameColMutation = useMutation({
    mutationFn: ({ colId, name }: { colId: string; name: string }) =>
      layersApi.updateColumn(formid, colId, { col_name: name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['layerDesc', formid] }),
    onError: () => setMessage({ text: 'เกิดข้อผิดพลาดในการเปลี่ยนชื่อ', variant: 'danger' }),
  })

  const handleSearchLatLng = (e: React.FormEvent) => {
    e.preventDefault()
    const lat = parseFloat(searchLat), lng = parseFloat(searchLng)
    if (isNaN(lat) || isNaN(lng)) return
    mapInstance.current?.flyTo({ center: [lng, lat], zoom: 15 })
  }

  const handleSearchUtm = async (e: React.FormEvent) => {
    e.preventDefault()
    const e_ = parseFloat(utmEasting), n = parseFloat(utmNorthing), z = parseInt(utmZone)
    if (isNaN(e_) || isNaN(n) || isNaN(z)) return
    setUtmSearching(true)
    try {
      const res = await geoApi.utmToLatLng(e_, n, z)
      mapInstance.current?.flyTo({ center: [res.longitude, res.latitude], zoom: 15 })
    } catch {
      setMessage({ text: 'เกิดข้อผิดพลาดในการแปลงพิกัด UTM', variant: 'danger' })
    } finally {
      setUtmSearching(false)
    }
  }

  return (
    <AppLayout>
      <div className="nk-block">
        {message && (
          <div className="mb-3">
            <Alert message={message.text} variant={message.variant} onDismiss={() => setMessage(null)} />
          </div>
        )}

        <div className="row g-gs">
          {/* ── Map (col-7) ─────────────────────────────────────────── */}
          <div className="col-xxl-7 col-lg-7">
            <div className="card card-full overflow-hidden" style={{ width: '100%', height: 480, position: 'relative' }}>
              <div ref={mapCallbackRef} style={{ width: '100%', height: '100%' }} />
            </div>
            {pendingLngLat && layertype === 'point' && (
              <div className="mt-2 d-flex gap-2 align-items-center">
                <span className="text-muted" style={{ fontSize: 13 }}>
                  ตำแหน่งใหม่: {pendingLngLat[1].toFixed(6)}, {pendingLngLat[0].toFixed(6)}
                </span>
                <Button

                  variant="success"
                  loading={saveGeomMutation.isPending}
                  onClick={() => saveGeomMutation.mutate(pendingLngLat)}
                >
                  <em className="icon ni ni-save" />&nbsp;บันทึกตำแหน่ง
                </Button>
                <Button variant="light" onClick={() => { setPendingLngLat(null); renderFeature() }}>ยกเลิก</Button>
              </div>
            )}
          </div>

          {/* ── Right panel (col-5) ─────────────────────────────────── */}
          <div className="col-xxl-5 col-lg-5">
            <div className="card card-full">
              <div className="card-inner p-3">
                {/* Tabs */}
                <ul className="nav nav-tabs mb-3">
                  {(['basemap', 'search', 'style'] as const).map((tab) => (
                    <li key={tab} className="nav-item">
                      <button
                        className={`nav-link${activeTab === tab ? ' active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab === 'basemap' ? 'แผนที่ฐาน' : tab === 'search' ? 'ค้นหา' : 'รูปแบบ'}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Tab: Basemap */}
                {activeTab === 'basemap' && (
                  <div>
                    <label className="form-label">เลือกแผนที่ฐาน</label>
                    <Select
                      options={BASE_MAP_OPTIONS}
                      value={baseMap}
                      onChange={(e) => setBaseMap(e.target.value)}
                    />
                  </div>
                )}

                {/* Tab: Search */}
                {activeTab === 'search' && (
                  <div>
                    <div className="form-group mb-3">
                      <label className="form-label">รูปแบบการค้นหา</label>
                      <select
                        className="form-select form-select-sm"
                        value={searchCoordType}
                        onChange={(e) => setSearchCoordType(e.target.value as 'latLng' | 'utm')}
                      >
                        <option value="latLng">ค้นหาด้วย Latitude/Longitude</option>
                        <option value="utm">ค้นหาด้วย UTM</option>
                      </select>
                    </div>

                    {searchCoordType === 'latLng' && (
                      <form onSubmit={handleSearchLatLng}>
                        <div className="mb-2">
                          <label className="form-label">ละติจูด</label>
                          <Input value={searchLat} onChange={(e) => setSearchLat(e.target.value)} placeholder="18.7883" />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">ลองจิจูด</label>
                          <Input value={searchLng} onChange={(e) => setSearchLng(e.target.value)} placeholder="98.9853" />
                        </div>
                        <div className="d-flex gap-2">
                          <Button type="submit" variant="primary"><em className="icon ni ni-search" />&nbsp;ค้นหา</Button>
                          <Button type="button" variant="light" onClick={() => { setSearchLat(''); setSearchLng('') }}>ยกเลิก</Button>
                        </div>
                      </form>
                    )}

                    {searchCoordType === 'utm' && (
                      <form onSubmit={handleSearchUtm}>
                        <div className="mb-2">
                          <label className="form-label">ค่า E (Easting)</label>
                          <Input value={utmEasting} onChange={(e) => setUtmEasting(e.target.value)} placeholder="377977.37" />
                        </div>
                        <div className="mb-2">
                          <label className="form-label">ค่า N (Northing)</label>
                          <Input value={utmNorthing} onChange={(e) => setUtmNorthing(e.target.value)} placeholder="1521274.56" />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Zone</label>
                          <Input value={utmZone} onChange={(e) => setUtmZone(e.target.value)} placeholder="47" />
                        </div>
                        <div className="d-flex gap-2">
                          <Button type="submit" variant="primary" loading={utmSearching}><em className="icon ni ni-search" />&nbsp;ค้นหา</Button>
                          <Button type="button" variant="light" onClick={() => { setUtmEasting(''); setUtmNorthing('') }}>ยกเลิก</Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Tab: Style */}
                {activeTab === 'style' && (
                  <div>
                    {/* Point style */}
                    {layertype === 'point' && (
                      <>
                        {/* SVG preview */}
                        <div className="mb-3 text-center">
                          <svg width="60" height="60">
                            <circle
                              cx="30" cy="30"
                              r={Math.min(style.circleRadius, 24)}
                              fill={style.circleColor}
                              stroke={style.strokeColor}
                              strokeWidth={style.strokeWidth}
                            />
                          </svg>
                        </div>
                        <div className="row g-2 mb-2">
                          <div className="col-6">
                            <label className="form-label" style={{ fontSize: 12 }}>สีจุด</label>
                            <input type="color" className="form-control form-control-color w-100" value={style.circleColor}
                              onChange={(e) => setStyle((p) => ({ ...p, circleColor: e.target.value }))} />
                          </div>
                          <div className="col-6">
                            <label className="form-label" style={{ fontSize: 12 }}>ขนาด ({style.circleRadius}px)</label>
                            <input type="range" className="form-range" min={4} max={30} value={style.circleRadius}
                              onChange={(e) => setStyle((p) => ({ ...p, circleRadius: +e.target.value }))} />
                          </div>
                          <div className="col-6">
                            <label className="form-label" style={{ fontSize: 12 }}>สีเส้นขอบ</label>
                            <input type="color" className="form-control form-control-color w-100" value={style.strokeColor}
                              onChange={(e) => setStyle((p) => ({ ...p, strokeColor: e.target.value }))} />
                          </div>
                          <div className="col-6">
                            <label className="form-label" style={{ fontSize: 12 }}>ความหนาขอบ ({style.strokeWidth}px)</label>
                            <input type="range" className="form-range" min={0} max={10} value={style.strokeWidth}
                              onChange={(e) => setStyle((p) => ({ ...p, strokeWidth: +e.target.value }))} />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Line style */}
                    {(layertype === 'linestring' || layertype === 'polygon') && (
                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: 12 }}>สีเส้น</label>
                          <input type="color" className="form-control form-control-color w-100" value={style.lineColor}
                            onChange={(e) => setStyle((p) => ({ ...p, lineColor: e.target.value }))} />
                        </div>
                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: 12 }}>ความหนาเส้น ({style.lineWidth}px)</label>
                          <input type="range" className="form-range" min={1} max={20} value={style.lineWidth}
                            onChange={(e) => setStyle((p) => ({ ...p, lineWidth: +e.target.value }))} />
                        </div>
                      </div>
                    )}

                    {/* Polygon fill */}
                    {layertype === 'polygon' && (
                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: 12 }}>สีพื้น</label>
                          <input type="color" className="form-control form-control-color w-100" value={style.polygonColor}
                            onChange={(e) => setStyle((p) => ({ ...p, polygonColor: e.target.value }))} />
                        </div>
                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: 12 }}>ความโปร่งแสง ({Math.round(style.polygonOpacity * 100)}%)</label>
                          <input type="range" className="form-range" min={0} max={1} step={0.05} value={style.polygonOpacity}
                            onChange={(e) => setStyle((p) => ({ ...p, polygonOpacity: +e.target.value }))} />
                        </div>
                      </div>
                    )}

                    <Button
                      variant="primary"

                      loading={saveStyleMutation.isPending}
                      onClick={() => saveStyleMutation.mutate()}
                    >
                      <em className="icon ni ni-save" />&nbsp;บันทึกรูปแบบ
                    </Button>
                  </div>
                )}

                <hr />
                <div className="d-flex gap-2 flex-wrap">
                  <Button variant="light" onClick={() => navigate(-1)}>← กลับ</Button>
                  <Button
                    variant="info"
                    onClick={() => navigate(`/detail-qr?formid=${formid}&refid=${refid}&type=${layertype}`)}
                  >
                    <em className="icon ni ni-qr" />&nbsp;QR Code
                  </Button>
                  <small className="text-muted align-self-center" style={{ fontSize: 11 }}>
                    {formid} / {refid}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom row ────────────────────────────────────────────── */}
        <div className="row g-gs mt-0">
          {/* Attribute form (col-7) */}
          <div className="col-xxl-7 col-lg-7">
            <div className="card">
              <div className="card-inner">
                <h6 className="title mb-3">แก้ไขข้อมูล</h6>
                {columns.length === 0 && (
                  <p className="text-muted">ไม่มีคอลัมน์</p>
                )}
                {columns.map((col) => (
                  <div className="form-group mb-3" key={col.col_id}>
                    <label className="form-label">
                      {col.col_name}
                      {col.col_desc && <small className="text-muted ms-1">({col.col_desc})</small>}
                    </label>
                    {col.col_type === 'date' ? (
                      <input
                        type="date"
                        className="form-control"
                        value={formData[col.col_id] ?? ''}
                        onChange={(e) => setFormData((p) => ({ ...p, [col.col_id]: e.target.value }))}
                      />
                    ) : col.col_type === 'file' ? (
                      <div>
                        {formData[col.col_id] && formData[col.col_id].startsWith('data:') && (
                          <img
                            src={formData[col.col_id]}
                            alt="preview"
                            style={{ maxWidth: 200, maxHeight: 150, display: 'block', marginBottom: 8, borderRadius: 'var(--radius-sm)' }}
                          />
                        )}
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const reader = new FileReader()
                            reader.onload = (ev) => {
                              setFormData((p) => ({ ...p, [col.col_id]: ev.target?.result as string }))
                            }
                            reader.readAsDataURL(file)
                          }}
                        />
                      </div>
                    ) : (
                      <Input
                        type={col.col_type === 'numeric' || col.col_type === 'integer' ? 'number' : 'text'}
                        value={formData[col.col_id] ?? ''}
                        onChange={(e) => setFormData((p) => ({ ...p, [col.col_id]: e.target.value }))}
                        placeholder={col.col_desc || 'ระบุ..'}
                      />
                    )}
                  </div>
                ))}
                <Button

                  loading={saveAttrMutation.isPending}
                  onClick={() => saveAttrMutation.mutate()}
                >
                  <em className="icon ni ni-save" />&nbsp;บันทึกข้อมูล
                </Button>
              </div>
            </div>
          </div>

          {/* Column management (col-5) */}
          <div className="col-xxl-5 col-lg-5">
            <div className="card">
              <div className="card-inner">
                <h6 className="title mb-3">จัดการคอลัมน์</h6>
                <ul className="nav nav-tabs mb-3">
                  {(['add', 'delete', 'rename'] as const).map((tab) => (
                    <li key={tab} className="nav-item">
                      <button
                        className={`nav-link${activeColTab === tab ? ' active' : ''}`}
                        onClick={() => setActiveColTab(tab)}
                      >
                        {tab === 'add' ? 'เพิ่มคอลัมน์' : tab === 'delete' ? 'ลบคอลัมน์' : 'เปลี่ยนชื่อ'}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Add column */}
                {activeColTab === 'add' && (
                  <div>
                    <div className="form-group mb-2">
                      <label className="form-label">ชื่อคอลัมน์</label>
                      <Input
                        value={newCol.name}
                        onChange={(e) => setNewCol((p) => ({ ...p, name: e.target.value }))}
                        placeholder="column_name"
                      />
                    </div>
                    <div className="form-group mb-2">
                      <label className="form-label">ประเภท</label>
                      <Select
                        options={COLUMN_TYPES}
                        value={newCol.type}
                        onChange={(e) => setNewCol((p) => ({ ...p, type: e.target.value }))}
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label className="form-label">คำอธิบาย</label>
                      <Input
                        value={newCol.desc}
                        onChange={(e) => setNewCol((p) => ({ ...p, desc: e.target.value }))}
                        placeholder="คำอธิบาย (ไม่บังคับ)"
                      />
                    </div>
                    <Button

                      variant="success"
                      loading={createColMutation.isPending}
                      onClick={() => { if (newCol.name.trim()) createColMutation.mutate() }}
                    >
                      <em className="icon ni ni-plus" />&nbsp;สร้างคอลัมน์
                    </Button>
                  </div>
                )}

                {/* Delete column */}
                {activeColTab === 'delete' && (
                  <div>
                    {columns.length === 0 && <p className="text-muted">ไม่มีคอลัมน์</p>}
                    {columns.map((col) => (
                      <div key={col.col_id} className="d-flex gap-2 mb-2 align-items-center">
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={col.col_name}
                          title={col.col_desc}
                        />
                        <Button

                          variant="danger"
                          loading={deleteColMutation.isPending}
                          onClick={() => {
                            if (confirm(`ยืนยันการลบคอลัมน์ "${col.col_name}"?`)) {
                              deleteColMutation.mutate(col.col_id)
                            }
                          }}
                        >
                          <em className="icon ni ni-trash-alt" />&nbsp;ลบ
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rename column */}
                {activeColTab === 'rename' && (
                  <div>
                    <p className="text-muted mb-2" style={{ fontSize: 12 }}>
                      แก้ไขชื่อแล้วกดปุ่มบันทึก
                    </p>
                    {columns.length === 0 && <p className="text-muted">ไม่มีคอลัมน์</p>}
                    {columns.map((col) => (
                      <div key={col.col_id} className="d-flex gap-2 mb-2 align-items-center">
                        <input
                          type="text"
                          className="form-control"
                          value={renameValues[col.col_id] ?? col.col_name}
                          onChange={(e) => setRenameValues((p) => ({ ...p, [col.col_id]: e.target.value }))}
                        />
                        <Button

                          variant="primary"
                          loading={renameColMutation.isPending}
                          onClick={() => {
                            const name = renameValues[col.col_id]
                            if (name && name !== col.col_name) {
                              renameColMutation.mutate({ colId: col.col_id, name })
                            }
                          }}
                        >
                          <em className="icon ni ni-save" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

// Helper: create styled point marker element
function createPointEl(style: StyleState): HTMLElement {
  const el = document.createElement('div')
  const d = style.circleRadius * 2
  el.style.cssText = `width:${d}px;height:${d}px;background:${style.circleColor};border-radius:50%;border:${style.strokeWidth}px solid ${style.strokeColor};box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:pointer`
  return el
}

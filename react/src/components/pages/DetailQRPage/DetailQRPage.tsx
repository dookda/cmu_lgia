import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import maplibregl from 'maplibre-gl'
import { AppLayout } from '../../templates/AppLayout/AppLayout'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Alert } from '../../atoms/Alert/Alert'
import { layersApi, geoApi } from '../../../services/api'
import type { Layer } from '../../../types/layer'

interface StyleState {
  circleColor: string; circleRadius: number; strokeColor: string; strokeWidth: number
  lineColor: string; lineWidth: number; polygonColor: string; polygonOpacity: number
}
const DEFAULT_STYLE: StyleState = {
  circleColor: '#FF0000', circleRadius: 8, strokeColor: '#FFFFFF', strokeWidth: 2,
  lineColor: '#6576ff', lineWidth: 3, polygonColor: '#6576ff', polygonOpacity: 0.4,
}
function parseStyleJson(jsonStr: string): Partial<StyleState> {
  try {
    const arr = JSON.parse(jsonStr) as Array<{ paint?: Record<string, unknown> }>
    const pt = arr[0]?.paint ?? {}, ln = arr[1]?.paint ?? {}, py = arr[2]?.paint ?? {}
    return {
      circleColor: (pt['circle-color'] as string) ?? DEFAULT_STYLE.circleColor,
      circleRadius: (pt['circle-radius'] as number) ?? DEFAULT_STYLE.circleRadius,
      strokeColor: (pt['circle-stroke-color'] as string) ?? DEFAULT_STYLE.strokeColor,
      strokeWidth: (pt['circle-stroke-width'] as number) ?? DEFAULT_STYLE.strokeWidth,
      lineColor: (ln['line-color'] as string) ?? DEFAULT_STYLE.lineColor,
      lineWidth: (ln['line-width'] as number) ?? DEFAULT_STYLE.lineWidth,
      polygonColor: (py['fill-color'] as string) ?? DEFAULT_STYLE.polygonColor,
      polygonOpacity: (py['fill-opacity'] as number) ?? DEFAULT_STYLE.polygonOpacity,
    }
  } catch { return {} }
}
function createPointEl(s: StyleState): HTMLElement {
  const el = document.createElement('div')
  const d = s.circleRadius * 2
  el.style.cssText = `width:${d}px;height:${d}px;background:${s.circleColor};border-radius:50%;border:${s.strokeWidth}px solid ${s.strokeColor};box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:pointer`
  return el
}

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

const GEOJSON_SOURCE = 'qr-feature-source'

type ColMeta = { col_id: string; col_name: string; col_type: string; col_desc: string }

export function DetailQRPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const formid = params.get('formid') ?? ''
  const refid = params.get('refid') ?? ''
  const layertype = (params.get('type') ?? 'point').toLowerCase()

  const mapInstance = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const searchMarkerRef = useRef<maplibregl.Marker | null>(null)
  const mapReady = useRef(false)

  const [baseMap, setBaseMap] = useState('osm')
  const [activeTab, setActiveTab] = useState<'basemap' | 'search'>('basemap')
  const [searchCoordType, setSearchCoordType] = useState<'latLng' | 'utm'>('latLng')
  const [searchLat, setSearchLat] = useState('')
  const [searchLng, setSearchLng] = useState('')
  const [utmEasting, setUtmEasting] = useState('')
  const [utmNorthing, setUtmNorthing] = useState('')
  const [utmZone, setUtmZone] = useState('47')
  const [utmSearching, setUtmSearching] = useState(false)
  const [featureStyle, setFeatureStyle] = useState<StyleState>(DEFAULT_STYLE)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(true)
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'danger' } | null>(null)

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

  const { data: layerInfoList = [] } = useQuery<Layer[]>({
    queryKey: ['layerInfo', formid],
    queryFn: () => layersApi.getLayerInfo(formid),
    enabled: !!formid,
  })
  const layerInfo = layerInfoList[0]

  const { data: styleData } = useQuery<{ style?: string }>({
    queryKey: ['featureStyle', formid, refid],
    queryFn: () => layersApi.loadFeatureStyle(formid, refid),
    enabled: !!formid && !!refid,
  })
  useEffect(() => {
    if (!styleData?.style) return
    setFeatureStyle((prev) => ({ ...prev, ...parseStyleJson(styleData.style!) }))
  }, [styleData])

  // Load QR code from API
  useEffect(() => {
    if (!formid || !refid) return
    const currentUrl = window.location.href
    setQrLoading(true)
    fetch(`/api/qrcode?url=${encodeURIComponent(currentUrl)}`)
      .then((r) => r.json())
      .then((data: { qrCode: string }) => setQrDataUrl(data.qrCode))
      .catch(() => setMessage({ text: 'ไม่สามารถโหลด QR Code ได้', variant: 'danger' }))
      .finally(() => setQrLoading(false))
  }, [formid, refid])

  // Map init
  const mapCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || mapInstance.current) return
    const mapStyle = BASE_MAPS[baseMap]
    const map = new maplibregl.Map({
      container: node,
      style: (typeof mapStyle === 'string' ? mapStyle : mapStyle) as maplibregl.StyleSpecification,
      center: [99.0173, 18.5762],
      zoom: 8,
    })
    map.addControl(new maplibregl.NavigationControl())
    map.on('load', () => { mapReady.current = true; map.resize() })
    mapInstance.current = map
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(node)
    const cleanup = () => { ro.disconnect(); map.remove(); mapInstance.current = null; mapReady.current = false }
    ;(node as HTMLDivElement & { _mapCleanup?: () => void })._mapCleanup = cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Change base map
  useEffect(() => {
    if (!mapInstance.current) return
    const mapStyle = BASE_MAPS[baseMap]
    mapInstance.current.setStyle((typeof mapStyle === 'string' ? mapStyle : mapStyle) as maplibregl.StyleSpecification)
    mapInstance.current.once('styledata', () => renderFeature())
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
      const el = createPointEl(featureStyle)
      markerRef.current = new maplibregl.Marker({ element: el }).setLngLat(coords).addTo(map)
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
          map.addLayer({ id: 'qr-line', type: 'line', source: GEOJSON_SOURCE, paint: { 'line-color': '#6576ff', 'line-width': 3 } })
        } else {
          map.addLayer({ id: 'qr-fill', type: 'fill', source: GEOJSON_SOURCE, paint: { 'fill-color': '#6576ff', 'fill-opacity': 0.4 } })
          map.addLayer({ id: 'qr-outline', type: 'line', source: GEOJSON_SOURCE, paint: { 'line-color': '#6576ff', 'line-width': 2 } })
        }
      }
      const bounds = new maplibregl.LngLatBounds()
      const extend = (c: number[]) => bounds.extend(c as [number, number])
      if (geom.type === 'LineString') (geom as GeoJSON.LineString).coordinates.forEach(extend)
      else if (geom.type === 'Polygon') (geom as GeoJSON.Polygon).coordinates[0].forEach(extend)
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60 })
    }
  }, [featureRows, layertype, featureStyle])

  useEffect(() => {
    if (!mapInstance.current || !featureRows.length) return
    if (mapReady.current) renderFeature()
    else mapInstance.current.once('load', () => renderFeature())
  }, [featureRows, featureStyle, renderFeature])

  // Search handlers
  const handleSearchLatLng = (e: React.FormEvent) => {
    e.preventDefault()
    const lat = parseFloat(searchLat), lng = parseFloat(searchLng)
    if (isNaN(lat) || isNaN(lng)) return
    if (searchMarkerRef.current) searchMarkerRef.current.remove()
    searchMarkerRef.current = new maplibregl.Marker({ color: '#e85347' }).setLngLat([lng, lat]).addTo(mapInstance.current!)
    mapInstance.current?.flyTo({ center: [lng, lat], zoom: 15 })
  }

  const handleSearchUtm = async (e: React.FormEvent) => {
    e.preventDefault()
    const e_ = parseFloat(utmEasting), n = parseFloat(utmNorthing), z = parseInt(utmZone)
    if (isNaN(e_) || isNaN(n) || isNaN(z)) return
    setUtmSearching(true)
    try {
      const res = await geoApi.utmToLatLng(e_, n, z)
      if (searchMarkerRef.current) searchMarkerRef.current.remove()
      searchMarkerRef.current = new maplibregl.Marker({ color: '#e85347' })
        .setLngLat([res.longitude, res.latitude]).addTo(mapInstance.current!)
      mapInstance.current?.flyTo({ center: [res.longitude, res.latitude], zoom: 15 })
    } catch {
      setMessage({ text: 'เกิดข้อผิดพลาดในการแปลงพิกัด UTM', variant: 'danger' })
    } finally {
      setUtmSearching(false)
    }
  }

  const handleDownloadQR = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = `qrcode_${refid}.png`
    link.href = qrDataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const currentUrl = window.location.href
  const createDate = layerInfo?.ts
    ? new Date(layerInfo.ts as string).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    : '-'

  return (
    <AppLayout requireRole="user">
      <div className="nk-block">
        {message && (
          <div className="mb-3">
            <Alert message={message.text} variant={message.variant} onDismiss={() => setMessage(null)} />
          </div>
        )}

        <div className="row g-gs">
          {/* Map */}
          <div className="col-xxl-7 col-lg-7">
            <div style={{ width: '100%', height: 480, position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
              <div ref={mapCallbackRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>

          {/* Right panel */}
          <div className="col-xxl-5 col-lg-5">
            <div className="card card-full">
              <div className="card-inner p-3">
                <ul className="nav nav-tabs mb-3">
                  {(['basemap', 'search'] as const).map((tab) => (
                    <li key={tab} className="nav-item">
                      <button
                        className={`nav-link${activeTab === tab ? ' active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab === 'basemap' ? 'แผนที่ฐาน' : 'ค้นหา'}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Tab: Basemap */}
                {activeTab === 'basemap' && (
                  <div>
                    <label className="form-label">เลือกแผนที่ฐาน</label>
                    <select
                      className="form-select"
                      value={baseMap}
                      onChange={(e) => setBaseMap(e.target.value)}
                    >
                      {BASE_MAP_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
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
                          <Input value={searchLat} onChange={(e) => setSearchLat(e.target.value)} placeholder="13.7563" />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">ลองจิจูด</label>
                          <Input value={searchLng} onChange={(e) => setSearchLng(e.target.value)} placeholder="100.5018" />
                        </div>
                        <div className="d-flex gap-2">
                          <Button type="submit" variant="primary"><em className="icon ni ni-search" />&nbsp;ค้นหา</Button>
                          <Button type="button" variant="light" onClick={() => {
                            setSearchLat(''); setSearchLng('')
                            if (searchMarkerRef.current) { searchMarkerRef.current.remove(); searchMarkerRef.current = null }
                          }}>ยกเลิก</Button>
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
                          <Button type="button" variant="light" onClick={() => {
                            setUtmEasting(''); setUtmNorthing('')
                            if (searchMarkerRef.current) { searchMarkerRef.current.remove(); searchMarkerRef.current = null }
                          }}>ยกเลิก</Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                <hr />
                <Button variant="light" onClick={() => navigate(-1)}>← กลับ</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="row g-gs mt-0">
          {/* Attribute display */}
          <div className="col-xxl-7 col-lg-7">
            <div className="card">
              <div className="card-inner">
                <h6 className="title mb-3">ข้อมูลแอตทริบิวต์</h6>
                {featureRows.length > 0 && columns.length > 0 ? (
                  <table className="table table-sm table-bordered">
                    <thead>
                      <tr><th style={{ width: '40%' }}>ฟิลด์</th><th>ค่า</th></tr>
                    </thead>
                    <tbody>
                      {columns.map((col) => {
                        const row = featureRows[0] as Record<string, unknown>
                        const val = row[col.col_id]
                        return (
                          <tr key={col.col_id}>
                            <td style={{ fontWeight: 600 }}>
                              {col.col_name}
                              {col.col_desc && <small className="text-muted ms-1">({col.col_desc})</small>}
                            </td>
                            <td>
                              {col.col_type === 'file' && val && String(val).startsWith('data:') ? (
                                <img src={String(val)} alt="preview" style={{ maxWidth: 150, maxHeight: 100, borderRadius: 4 }} />
                              ) : (
                                String(val ?? '-')
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-muted">ไม่มีข้อมูล</p>
                )}
              </div>
            </div>
          </div>

          {/* QR Code + layer info */}
          <div className="col-xxl-5 col-lg-5">
            <div className="card">
              <div className="card-inner text-center">
                <h6 className="title mb-3">QR Code ของหน้านี้</h6>
                <div className="d-flex justify-content-center mb-3">
                  {qrLoading ? (
                    <div className="text-muted" style={{ width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span>กำลังโหลด...</span>
                    </div>
                  ) : qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" style={{ width: 160, height: 160, borderRadius: 4 }} />
                  ) : (
                    <div className="text-muted">ไม่สามารถโหลด QR Code ได้</div>
                  )}
                </div>

                <div className="text-start mb-3" style={{ fontSize: 13 }}>
                  <div><strong>ชั้นข้อมูล:</strong> {layerInfo?.layername ?? '-'}</div>
                  <div><strong>ประเภทข้อมูล:</strong> {layerInfo?.layertype ?? '-'}</div>
                  <div><strong>หน่วยงานที่สร้าง:</strong> {layerInfo?.division ?? '-'}</div>
                  <div><strong>วันที่สร้าง:</strong> {createDate}</div>
                  <div className="mt-1">
                    <strong>URL:</strong>{' '}
                    <span style={{ wordBreak: 'break-all', fontSize: 11 }}>{currentUrl}</span>
                  </div>
                </div>

                <div className="d-flex justify-content-center gap-2 no-print">
                  <Button variant="primary" onClick={handleDownloadQR} disabled={!qrDataUrl}>
                    <em className="icon ni ni-download" />&nbsp;ดาวน์โหลด
                  </Button>
                  <Button variant="success" onClick={() => window.print()}>
                    <em className="icon ni ni-printer" />&nbsp;พิมพ์
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

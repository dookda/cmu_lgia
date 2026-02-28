import { useState, useCallback, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { MapLibreMap } from '../../organisms/MapView/MapView'
import { MapView } from '../../organisms/MapView/MapView'
import { AppDataTable } from '../../organisms/DataTable/DataTable'
import type { DTColumn } from '../../organisms/DataTable/DataTable'
import { AppLayout } from '../../templates/AppLayout/AppLayout'
import { StatCard } from '../../molecules/StatCard/StatCard'
import { Select } from '../../atoms/Select/Select'
import { Button } from '../../atoms/Button/Button'
import { useAuthStore } from '../../../store/authStore'
import { layersApi, divisionsApi } from '../../../services/api'
import type { GeoFeature, Layer } from '../../../types/layer'
import maplibregl from 'maplibre-gl'
import * as turf from '@turf/turf'

const GEOAPIFY_KEY = '5c607231c8c24f9b89ff3af7a110185b'
const BASE_MAP_OPTIONS = [
  { value: 'osm', label: 'OpenStreetMap' },
  { value: 'maptiler', label: 'Maptiler 3D' },
  { value: 'grod', label: 'Google Road' },
  { value: 'gsat', label: 'Google Satellite' },
  { value: 'ghyb', label: 'Google Hybrid' },
]
const CHART_COLORS = ['#6576ff', '#1ee0ac', '#f4bd0e', '#e85347', '#09c2de', '#364a63', '#816bff', '#ff63a5']

const featureColumns: DTColumn[] = [
  { title: '#', data: null, render: (_d, _t, _r, meta) => String((meta as { row: number }).row + 1), orderable: false },
]

// ─── Simple bar/pie chart using SVG ──────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, minWidth: data.length * 50, height: 200, padding: '0 8px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <span style={{ fontSize: 11, marginBottom: 2, fontWeight: 600 }}>{d.value}</span>
            <div
              style={{
                width: '100%', background: CHART_COLORS[i % CHART_COLORS.length],
                height: `${(d.value / max) * 160}px`, borderRadius: '4px 4px 0 0', minHeight: 4,
              }}
              title={`${d.label}: ${d.value}`}
            />
            <span style={{ fontSize: 10, textAlign: 'center', marginTop: 4, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.label}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PieChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  let cumAngle = 0
  const cx = 120, cy = 120, r = 100
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI
    const x1 = cx + r * Math.sin(cumAngle), y1 = cy - r * Math.cos(cumAngle)
    cumAngle += angle
    const x2 = cx + r * Math.sin(cumAngle), y2 = cy - r * Math.cos(cumAngle)
    const largeArc = angle > Math.PI ? 1 : 0
    const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`
    return { path, color: CHART_COLORS[i % CHART_COLORS.length], label: d.label, value: d.value, pct: Math.round(d.value / total * 100) }
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg width={240} height={240} viewBox="0 0 240 240">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth={2}><title>{s.label}: {s.value} ({s.pct}%)</title></path>)}
      </svg>
      <div>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13 }}>{s.label}: <strong>{s.value}</strong> ({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardPage() {
  const tasaban = useAuthStore((s) => s.tasaban)
  const [baseMap, setBaseMap] = useState('osm')
  const [selectedFormid, setSelectedFormid] = useState<string>('')
  const [queryFormid, setQueryFormid] = useState<string>('')
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null)
  const [features, setFeatures] = useState<Record<string, unknown>[]>([])
  // Keep a ref so the window handler always sees the latest features without re-registering
  const featuresRef = useRef<Record<string, unknown>[]>([])
  useEffect(() => { featuresRef.current = features }, [features])
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    w._featureDetail = (idx: number) => {
      const row = featuresRef.current[idx]
      if (row) { setModalData(row); setModalOpen(true) }
    }
    return () => { delete w._featureDetail }
  }, []) // intentionally empty — uses ref to stay current
  const [dynamicColumns, setDynamicColumns] = useState<DTColumn[]>(featureColumns)
  const [queryLoading, setQueryLoading] = useState(false)

  // Chart state
  const [chartType, setChartType] = useState<'column' | 'pie'>('column')
  const [xAxis, setXAxis] = useState('')
  const [yAxis, setYAxis] = useState('')
  const [pieCategory, setPieCategory] = useState('')
  const [pieOp, setPieOp] = useState<'count' | 'sum'>('count')
  const [pieValue, setPieValue] = useState('')
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([])
  const [showChart, setShowChart] = useState(false)

  // Popup modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalData, setModalData] = useState<Record<string, unknown>>({})

  const { data: layers = [] } = useQuery({
    queryKey: ['layers'],
    queryFn: layersApi.list,
  })
  const { data: divisions = [] } = useQuery({
    queryKey: ['divisions'],
    queryFn: divisionsApi.list,
  })

  const layerOptions = layers.map((l: Layer) => ({ value: l.formid, label: l.layername }))
  const colKeys = features.length > 0 ? Object.keys(features[0]).filter((k) => !['id', 'ts', 'style', 'geojson'].includes(k)) : []

  const handleMapReady = useCallback((map: MapLibreMap) => {
    setMapInstance(map)
  }, [])

  const loadLayerOnMap = async (formid: string, layer: Layer) => {
    if (!mapInstance) return
    try {
      const rawFeatures = await layersApi.loadFeatures(formid)
      const rows = rawFeatures.map((f) => f as Record<string, unknown>)
      setFeatures(rows)

      // Build GeoJSON FeatureCollection from flat rows (geojson field = ST_AsGeoJSON string)
      const featuresList: GeoJSON.Feature[] = rawFeatures.flatMap((f) => {
        if (!f.geojson) return []
        try {
          const geom = JSON.parse(f.geojson as string)
          return [{ type: 'Feature' as const, geometry: geom, properties: f as unknown as Record<string, unknown> }]
        } catch { return [] }
      })

      if (rawFeatures.length > 0) {
        const keys = Object.keys(rawFeatures[0]).filter((k) => !['id', 'ts', 'style', 'geojson'].includes(k))
        setDynamicColumns([
          { title: '#', data: null, render: (_d, _t, _r, meta) => String((meta as { row: number }).row + 1), orderable: false },
          ...keys.map((k): DTColumn => ({
            title: k,
            data: k,
            render: (val) => {
              const s = String(val ?? '')
              return `<span style="max-width:180px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${s}">${s}</span>`
            },
          })),
          {
            title: 'รายละเอียด',
            data: null,
            orderable: false,
            searchable: false,
            render: (_d: unknown, _t: string, _r: unknown, meta: unknown) => {
              const idx = (meta as { row: number }).row
              return `<button class="btn btn-primary" onclick="window._featureDetail(${idx})">
                <em class="icon ni ni-eye"></em>&nbsp;ดู
              </button>`
            },
          },
        ])
      }

      const geojson: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: featuresList }
      const sourceId = `layer-${formid}`

      // Remove old layers
      if (mapInstance.getSource(sourceId)) {
        try { mapInstance.removeLayer(`${sourceId}-fill`) } catch (_) { /* */ }
        try { mapInstance.removeLayer(`${sourceId}-line`) } catch (_) { /* */ }
        try { mapInstance.removeLayer(`${sourceId}-circle`) } catch (_) { /* */ }
        mapInstance.removeSource(sourceId)
      }

      mapInstance.addSource(sourceId, { type: 'geojson', data: geojson })
      const lt = (layer.layertype ?? '').toLowerCase()
      if (lt === 'polygon') {
        mapInstance.addLayer({ id: `${sourceId}-fill`, type: 'fill', source: sourceId, paint: { 'fill-color': '#6576ff', 'fill-opacity': 0.4 } })
        mapInstance.addLayer({ id: `${sourceId}-line`, type: 'line', source: sourceId, paint: { 'line-color': '#6576ff', 'line-width': 2 } })
      } else if (lt === 'linestring') {
        mapInstance.addLayer({ id: `${sourceId}-line`, type: 'line', source: sourceId, paint: { 'line-color': '#1ee0ac', 'line-width': 3 } })
      } else {
        const iconUrl = `https://api.geoapify.com/v1/icon/?type=material&color=%236576ff&icon=location&apiKey=${GEOAPIFY_KEY}`
        if (!mapInstance.hasImage('custom-marker')) {
          const img = await loadImage(iconUrl)
          mapInstance.addImage('custom-marker', img)
        }
        mapInstance.addLayer({ id: `${sourceId}-circle`, type: 'symbol', source: sourceId, layout: { 'icon-image': 'custom-marker', 'icon-size': 1 } })

        // Click popup on features
        mapInstance.on('click', `${sourceId}-circle`, (e) => {
          const feat = e.features?.[0]
          if (!feat) return
          const props = feat.properties as Record<string, unknown>
          setModalData(props)
          setModalOpen(true)
        })
        mapInstance.on('mouseenter', `${sourceId}-circle`, () => { mapInstance.getCanvas().style.cursor = 'pointer' })
        mapInstance.on('mouseleave', `${sourceId}-circle`, () => { mapInstance.getCanvas().style.cursor = '' })
      }

      if (featuresList.length > 0) {
        const bbox = turf.bbox({ type: 'FeatureCollection', features: featuresList })
        mapInstance.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 40 })
      }
    } catch (err) { console.error('Failed to load layer', err) }
  }

  const handleLayerSelect = (formid: string) => {
    setSelectedFormid(formid)
    const layer = layers.find((l: Layer) => l.formid === formid)
    if (layer) loadLayerOnMap(formid, layer)
  }

  // Query section
  const handleQueryLayer = async () => {
    if (!queryFormid) return
    setQueryLoading(true)
    try {
      const layer = layers.find((l: Layer) => l.formid === queryFormid)
      if (layer) await loadLayerOnMap(queryFormid, layer)
    } finally {
      setQueryLoading(false)
    }
  }

  // Chart generation
  const handleGenerateChart = () => {
    if (features.length === 0) return
    if (chartType === 'column' && xAxis && yAxis) {
      const data = features.map((f) => ({
        label: String(f[xAxis] ?? ''),
        value: parseFloat(String(f[yAxis] ?? '0')) || 0,
      }))
      setChartData(data)
      setShowChart(true)
    } else if (chartType === 'pie' && pieCategory) {
      const grouped: Record<string, number> = {}
      features.forEach((f) => {
        const cat = String(f[pieCategory] ?? 'ไม่ระบุ')
        if (pieOp === 'count') {
          grouped[cat] = (grouped[cat] ?? 0) + 1
        } else {
          const val = parseFloat(String(f[pieValue] ?? '0')) || 0
          grouped[cat] = (grouped[cat] ?? 0) + val
        }
      })
      setChartData(Object.entries(grouped).map(([label, value]) => ({ label, value })))
      setShowChart(true)
    }
  }

  return (
    <AppLayout>
      <div className="nk-block">
        {/* Stats row */}
        <div className="row g-gs mb-4">
          <div className="col-xxl-6 col-lg-6">
            <div className="card card-full">
              <div className="card-inner">
                <label className="f">Local Geo-Info Application: LGIA</label>
                <h5 className="title f">
                  ระบบภูมิสารสนเทศชุมชน — {tasaban?.name ? `(${tasaban.name})` : '(ใส่ชื่อเทศบาล)'}
                </h5>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-lg-3">
            <StatCard label="จำนวนชั้นข้อมูล" value={`${layers.length} ชั้น`} icon="ni-layers" />
          </div>
          <div className="col-xxl-3 col-lg-3">
            <StatCard label="จำนวนหน่วยงาน" value={`${divisions.length} หน่วยงาน`} icon="ni-tree-structure" />
          </div>
        </div>

        {/* Map + Layer control */}
        <div className="row g-gs mb-4">
          <div className="col-xxl-8 col-lg-8">
            <div className="card card-full" style={{ minHeight: 500, padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
              <MapView baseMap={baseMap} onMapReady={handleMapReady} style={{ height: 500, borderRadius: 0 }} />
            </div>
          </div>
          <div className="col-xxl-4 col-lg-4">
            <div className="card card-full h-100">
              <div className="card-inner">
                <div className="form-group mb-3">
                  <label className="form-label">เลือกแผนที่ฐาน</label>
                  <Select
                    options={BASE_MAP_OPTIONS}
                    value={baseMap}
                    onChange={(e) => setBaseMap(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ชั้นข้อมูล</label>
                  <Select
                    options={layerOptions}
                    placeholder="เลือกชั้นข้อมูล"
                    value={selectedFormid}
                    onChange={(e) => handleLayerSelect(e.target.value)}
                  />
                </div>
                {/* Layer list (checkbox style like v2) */}
                {layers.length > 0 && (
                  <div className="side-panel mt-3" style={{ maxHeight: 200, overflowY: 'auto' }}>
                    <ul className="list-group" id="layerList">
                      {layers.map((l: Layer) => (
                        <li
                          key={l.formid}
                          className={`list-group-item list-group-item-action ${selectedFormid === l.formid ? 'active' : ''}`}
                          style={{ cursor: 'pointer', fontSize: 13, padding: '6px 12px' }}
                          onClick={() => handleLayerSelect(l.formid)}
                        >
                          <em className="icon ni ni-layers me-2" />
                          {l.layername}
                          <small className="ms-1 text-muted">({l.division})</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Query panel */}
        <div className="row g-gs mb-4">
          <div className="col-12">
            <div className="card card-full">
              <div className="card-inner">
                <div className="data-query row align-items-center">
                  <div className="col-md-3 d-flex align-items-center justify-content-center">
                    <label className="mt-1 text-center" htmlFor="layerSelect">ชั้นข้อมูลที่ต้องสอบถาม</label>
                  </div>
                  <div className="col-md-9">
                    <div className="row g-2 align-items-end">
                      <div className="col-md-5">
                        <Select
                          id="layerSelect"
                          options={layerOptions}
                          placeholder="เลือกชั้นข้อมูล"
                          value={queryFormid}
                          onChange={(e) => setQueryFormid(e.target.value)}
                        />
                      </div>
                      <div className="col-md-3">
                        <Button onClick={handleQueryLayer} loading={queryLoading} variant="primary">
                          <em className="icon ni ni-search" />&nbsp;สอบถามข้อมูล
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart section — shows when features are loaded */}
        {features.length > 0 && (
          <div className="row g-gs mb-4">
            <div className="col-12">
              <div className="card card-full">
                <div className="card-inner">
                  <h6 className="f mb-3">แสดงกราฟ</h6>
                  <div className="controls d-flex flex-wrap gap-3 align-items-end mb-3">
                    <div>
                      <label className="form-label">ประเภท:</label>
                      <select
                        id="chartType"
                        className="form-select form-select-sm"
                        style={{ width: 140 }}
                        value={chartType}
                        onChange={(e) => { setChartType(e.target.value as 'column' | 'pie'); setShowChart(false) }}
                      >
                        <option value="column">กราฟแท่ง</option>
                        <option value="pie">กราฟวงกลม</option>
                      </select>
                    </div>

                    {chartType === 'column' && (
                      <>
                        <div>
                          <label className="form-label">แกน X:</label>
                          <select className="form-select form-select-sm" style={{ width: 160 }} value={xAxis} onChange={(e) => setXAxis(e.target.value)}>
                            <option value="">เลือก...</option>
                            {colKeys.map((k) => <option key={k} value={k}>{k}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="form-label">แกน Y:</label>
                          <select className="form-select form-select-sm" style={{ width: 160 }} value={yAxis} onChange={(e) => setYAxis(e.target.value)}>
                            <option value="">เลือก...</option>
                            {colKeys.map((k) => <option key={k} value={k}>{k}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                    {chartType === 'pie' && (
                      <>
                        <div>
                          <label className="form-label">Category:</label>
                          <select className="form-select form-select-sm" style={{ width: 160 }} value={pieCategory} onChange={(e) => setPieCategory(e.target.value)}>
                            <option value="">เลือก...</option>
                            {colKeys.map((k) => <option key={k} value={k}>{k}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="form-label">Operation:</label>
                          <select className="form-select form-select-sm" style={{ width: 120 }} value={pieOp} onChange={(e) => { setPieOp(e.target.value as 'count' | 'sum'); setShowChart(false) }}>
                            <option value="count">Count</option>
                            <option value="sum">Sum</option>
                          </select>
                        </div>
                        {pieOp === 'sum' && (
                          <div>
                            <label className="form-label">Value:</label>
                            <select className="form-select form-select-sm" style={{ width: 160 }} value={pieValue} onChange={(e) => setPieValue(e.target.value)}>
                              <option value="">เลือก...</option>
                              {colKeys.map((k) => <option key={k} value={k}>{k}</option>)}
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    <Button variant="primary" onClick={handleGenerateChart}>
                      <em className="icon ni ni-bar-chart" />&nbsp;แสดงกราฟ
                    </Button>
                  </div>

                  {showChart && chartData.length > 0 && (
                    <div id="chartContainer" style={{ minHeight: 240, marginTop: 8 }}>
                      {chartType === 'column' ? <BarChart data={chartData} /> : <PieChart data={chartData} />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature table */}
        {features.length > 0 && (
          <div className="row g-gs">
            <div className="col-12">
              <div className="card card-full">
                <div className="card-inner">
                  <div className="card-title-group mb-3">
                    <h6 className="title">ข้อมูลในชั้น</h6>
                    <span className="badge bg-primary">{features.length} รายการ</span>
                  </div>
                  <AppDataTable data={features} columns={dynamicColumns} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature detail modal */}
      {modalOpen && (
        <>
          <div className="modal-backdrop show" style={{ opacity: 0.5, zIndex: 1040 }} onClick={() => setModalOpen(false)} />
          <div className="modal show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title f">รายละเอียดข้อมูล</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)} />
                </div>
                <div className="modal-body">
                  <div className="form-container">
                    <table className="table table-sm table-bordered">
                      <thead><tr><th>ฟิลด์</th><th>ค่า</th></tr></thead>
                      <tbody>
                        {Object.entries(modalData)
                          .filter(([k]) => !['id', 'style', 'geojson'].includes(k))
                          .map(([key, val]) => (
                            <tr key={key}>
                              <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{key}</td>
                              <td>{String(val ?? '')}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <Button variant="light" onClick={() => setModalOpen(false)}>ปิด</Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}

function loadImage(url: string): Promise<HTMLImageElement | ImageBitmap> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import maplibregl from 'maplibre-gl'
import { AppLayout } from '../../templates/AppLayout/AppLayout'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Select } from '../../atoms/Select/Select'
import { Alert } from '../../atoms/Alert/Alert'
import { layersApi } from '../../../services/api'
import type { RefCallback } from 'react'

const MAPTILER_KEY = 'QcH5sAeCUv5rMXKrnJms'

const BASE_MAPS: Record<string, string | object> = {
    osm: {
        version: 8,
        sources: { 'raster': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 } },
        layers: [{ id: 'raster-layer', type: 'raster', source: 'raster' }],
    },
    maptiler: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
    grod: {
        version: 8,
        sources: { 'raster': { type: 'raster', tiles: ['https://mt0.google.com/vt/lyrs=r&x={x}&y={y}&z={z}'], tileSize: 256 } },
        layers: [{ id: 'raster-layer', type: 'raster', source: 'raster' }],
    },
    gsat: {
        version: 8,
        sources: { 'raster': { type: 'raster', tiles: ['https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'], tileSize: 256 } },
        layers: [{ id: 'raster-layer', type: 'raster', source: 'raster' }],
    },
    ghyb: {
        version: 8,
        sources: { 'raster': { type: 'raster', tiles: ['https://mt0.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}'], tileSize: 256 } },
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

type ColMeta = { col_id: string; col_name: string; col_type: string; col_desc: string }
type FeatureRow = Record<string, unknown>

export function InputEditPage() {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const formid = params.get('formid') ?? ''
    const layertype = params.get('type') ?? 'point'

    const mapContainerEl = useRef<HTMLDivElement | null>(null)
    const mapInstance = useRef<maplibregl.Map | null>(null)
    const pendingMarker = useRef<maplibregl.Marker | null>(null)
    const markers = useRef<Map<string, maplibregl.Marker>>(new Map())
    const resizeObserver = useRef<ResizeObserver | null>(null)

    const [activeTab, setActiveTab] = useState('basemap')

    const [baseMap, setBaseMap] = useState('osm')
    const [searchLat, setSearchLat] = useState('')
    const [searchLng, setSearchLng] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [editRefid, setEditRefid] = useState<string | null>(null)
    const [selectedLng, setSelectedLng] = useState<number | null>(null)
    const [selectedLat, setSelectedLat] = useState<number | null>(null)
    const [formData, setFormData] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ text: string; variant: 'success' | 'danger' } | null>(null)
    const [features, setFeatures] = useState<FeatureRow[]>([])

    const { data: columns = [] } = useQuery<ColMeta[]>({
        queryKey: ['layerDesc', formid],
        queryFn: () => layersApi.loadDescription(formid),
        enabled: !!formid,
    })

    // Initialize map — uses a callback ref so it re-runs whenever the container
    // actually appears in the DOM (e.g. after AppLayout finishes its auth check
    // and renders children for the first time).
    const initMap = useCallback((container: HTMLDivElement) => {
        if (mapInstance.current) return
        const style = BASE_MAPS[baseMap]
        const map = new maplibregl.Map({
            container,
            style: (typeof style === 'string' ? style : style) as maplibregl.StyleSpecification,
            center: [99.0173, 18.5762],
            zoom: 8,
            antialias: true,
        })
        map.addControl(new maplibregl.NavigationControl())
        mapInstance.current = map

        // Resize once tiles are loaded so the map fills the container properly
        map.on('load', () => map.resize())

        // Use ResizeObserver to keep the map sized to its container
        resizeObserver.current = new ResizeObserver(() => map.resize())
        resizeObserver.current.observe(container)

        // Click to place a new point
        map.on('click', (e) => {
            setSelectedLng(e.lngLat.lng)
            setSelectedLat(e.lngLat.lat)

            // Move pending marker
            if (pendingMarker.current) pendingMarker.current.remove()
            const el = document.createElement('div')
            el.style.cssText = 'width:24px;height:24px;background:#6576ff;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)'
            const marker = new maplibregl.Marker({ element: el }).setLngLat([e.lngLat.lng, e.lngLat.lat]).addTo(map)
            pendingMarker.current = marker
        })

        loadFeatures(map)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Callback ref — called by React whenever the div is mounted or unmounted
    const mapCallbackRef: RefCallback<HTMLDivElement> = useCallback((el) => {
        if (el) {
            mapContainerEl.current = el
            initMap(el)
        } else {
            // Element unmounted — clean up
            resizeObserver.current?.disconnect()
            resizeObserver.current = null
            mapInstance.current?.remove()
            mapInstance.current = null
            mapContainerEl.current = null
        }
    }, [initMap])

    // Change base map — re-apply style and call resize after style loads
    useEffect(() => {
        const map = mapInstance.current
        if (!map) return
        const style = BASE_MAPS[baseMap]
        map.setStyle((typeof style === 'string' ? style : style) as maplibregl.StyleSpecification)
        map.once('styledata', () => map.resize())
    }, [baseMap])

    const loadFeatures = useCallback(async (map?: maplibregl.Map) => {
        if (!formid) return
        try {
            const raw = await layersApi.loadFeatures(formid)
            const m = map ?? mapInstance.current
            if (!m) return

            // Clear old markers
            markers.current.forEach((mk) => mk.remove())
            markers.current.clear()

            const rows: FeatureRow[] = []
            raw.forEach((feat) => {
                rows.push(feat as Record<string, unknown>)
                if (!feat.geojson) return
                let geom: { type: string; coordinates: number[] } | null = null
                try { geom = JSON.parse(feat.geojson as string) } catch { return }
                if (!geom || geom.type !== 'Point') return
                const [lng, lat] = geom.coordinates
                const el = document.createElement('div')
                el.style.cssText = 'width:20px;height:20px;background:#1ee0ac;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3);cursor:pointer'
                const refid = String(feat.refid ?? '')
                const mk = new maplibregl.Marker({ element: el })
                    .setLngLat([lng, lat])
                    .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(`
            <div style="font-size:13px;padding:4px">
              <strong>refid:</strong> ${refid}<br/>
              ${Object.entries(feat).filter(([k]) => !['refid', 'id', 'ts', 'style', 'geojson'].includes(k)).map(([k, v]) => `<strong>${k}:</strong> ${v}`).join('<br/>')}
              <br/><a href="#" onclick="window._editFeature('${refid}');return false;" style="color:#6576ff">✏️ แก้ไข</a>
              &nbsp;<a href="#" onclick="window._deleteFeature('${refid}');return false;" style="color:#e85347">🗑 ลบ</a>
            </div>
          `))
                    .addTo(m)
                markers.current.set(refid, mk)
            })
            setFeatures(rows)
        } catch (err) {
            console.error(err)
        }
    }, [formid])

    // Expose edit/delete handlers to popup HTML
    useEffect(() => {
        (window as Record<string, unknown>)['_editFeature'] = (refid: string) => {
            setEditRefid(refid)
            const feat = features.find((f) => String(f.refid) === refid)
            if (feat) {
                const init: Record<string, string> = {}
                columns.forEach((col) => { init[col.col_id] = String(feat[col.col_id] ?? '') })
                setFormData(init)
            }
            setSelectedLat(null); setSelectedLng(null)
            setModalOpen(true)
        };
        (window as Record<string, unknown>)['_deleteFeature'] = async (refid: string) => {
            if (!confirm('ยืนยันการลบข้อมูลนี้?')) return
            try {
                await layersApi.deleteRow({ formid, refid })
                setMessage({ text: 'ลบข้อมูลสำเร็จ', variant: 'success' })
                await loadFeatures()
            } catch {
                setMessage({ text: 'เกิดข้อผิดพลาดในการลบ', variant: 'danger' })
            }
        }
    }, [features, columns, formid, loadFeatures])

    const handleNewFeature = () => {
        if (layertype.toLowerCase() === 'point' && (!selectedLat || !selectedLng)) {
            setMessage({ text: 'กรุณาคลิกบนแผนที่เพื่อเลือกตำแหน่งก่อน', variant: 'danger' })
            return
        }
        setEditRefid(null)
        const init: Record<string, string> = {}
        columns.forEach((col) => { init[col.col_id] = '' })
        setFormData(init)
        setModalOpen(true)
    }

    const handleSearchLatLng = (e: FormEvent) => {
        e.preventDefault()
        const lat = parseFloat(searchLat), lng = parseFloat(searchLng)
        if (isNaN(lat) || isNaN(lng)) return
        setSelectedLat(lat); setSelectedLng(lng)
        mapInstance.current?.flyTo({ center: [lng, lat], zoom: 14 })
        if (pendingMarker.current) pendingMarker.current.remove()
        const el = document.createElement('div')
        el.style.cssText = 'width:24px;height:24px;background:#6576ff;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)'
        pendingMarker.current = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapInstance.current!)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            if (editRefid) {
                // update existing
                await layersApi.updateRow(formid, editRefid, formData)
                setMessage({ text: 'อัปเดตข้อมูลสำเร็จ', variant: 'success' })
            } else {
                // insert new
                const refid = `ref_${Date.now()}`
                let geojson = ''
                if (layertype.toLowerCase() === 'point' && selectedLat && selectedLng) {
                    geojson = JSON.stringify({ type: 'Point', coordinates: [selectedLng, selectedLat] })
                }
                await layersApi.insertRow({ formid, refid, geojson, properties: formData })
                if (pendingMarker.current) { pendingMarker.current.remove(); pendingMarker.current = null }
                setMessage({ text: 'บันทึกข้อมูลสำเร็จ', variant: 'success' })
            }
            setModalOpen(false)
            await loadFeatures()
        } catch (err: unknown) {
            setMessage({ text: (err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'), variant: 'danger' })
        } finally {
            setSaving(false)
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
                    {/* Map */}
                    <div className="col-xxl-7 col-lg-7">
                        <div style={{ width: '100%', height: 520, position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            <div ref={mapCallbackRef} style={{ width: '100%', height: '100%' }} />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="col-xxl-5 col-lg-5">
                        <div className="card card-full">
                            <div className="card-inner">
                                <ul className="nav nav-tabs">
                                    <li className="nav-item">
                                        <a href="#" className={`nav-link ${activeTab === 'basemap' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('basemap') }}>
                                            <em className="icon ni ni-map" /><span className="f">แผนที่ฐาน</span>
                                        </a>
                                    </li>
                                    <li className="nav-item">
                                        <a href="#" className={`nav-link ${activeTab === 'search' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('search') }}>
                                            <em className="icon ni ni-search" /><span className="f">ค้นหา</span>
                                        </a>
                                    </li>
                                </ul>

                                <div className="tab-content" style={{ marginTop: '1rem' }}>
                                    {activeTab === 'basemap' && (
                                        <div className="tab-pane active" id="tabBasemap">
                                            <div className="form-group mb-3">
                                                <label className="form-label">เลือกแผนที่ฐาน</label>
                                                <Select
                                                    options={BASE_MAP_OPTIONS}
                                                    value={baseMap}
                                                    onChange={(e) => setBaseMap(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'search' && (
                                        <div className="tab-pane active" id="tabSearchLatLng">
                                            <form onSubmit={handleSearchLatLng}>
                                                <div className="mb-3">
                                                    <label className="form-label">ละติจูด</label>
                                                    <Input value={searchLat} onChange={(e) => setSearchLat(e.target.value)} placeholder="18.7883" />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label">ลองจิจูด</label>
                                                    <Input value={searchLng} onChange={(e) => setSearchLng(e.target.value)} placeholder="98.9853" />
                                                </div>
                                                <div className="gap-2 d-flex">
                                                    <Button type="submit" variant="primary">ค้นหา</Button>
                                                    <Button type="button" variant="light" onClick={() => { setSearchLat(''); setSearchLng(''); }}>ยกเลิก</Button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Section */}
                    <div className="col-xxl-12 col-lg-12">
                        <div className="card card-full">
                            <div className="card-inner">
                                <div className="d-flex gap-2">
                                    <Button id="newFeature" variant="primary" onClick={handleNewFeature}>
                                        <em className="icon ni ni-property-add" />&nbsp;เพิ่มข้อมูลใหม่
                                    </Button>
                                    <Button variant="light" onClick={() => navigate('/layers')}>
                                        ← รายการข้อมูล
                                    </Button>
                                </div>

                                {layertype.toLowerCase() === 'point' && (
                                    <div className="alert alert-warning mt-3">
                                        <em className="icon ni ni-info" />&nbsp;คลิกบนแผนที่เพื่อเลือกตำแหน่งก่อนเพิ่มข้อมูล
                                    </div>
                                )}

                                {/* Feature list */}
                                {features.length > 0 && (
                                    <div className="mt-4">
                                        <h6 className="title mb-2">ข้อมูลในชั้น ({features.length} รายการ)</h6>
                                        <div className="table-responsive">
                                            <table className="table table-bordered mb-0" style={{ minWidth: 400 }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ whiteSpace: 'nowrap' }}>การจัดการ</th>
                                                        {columns.map((c) => <th key={c.col_id} style={{ whiteSpace: 'nowrap' }}>{c.col_name}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {features.map((feat, i) => (
                                                        <tr key={i}>
                                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                                <div className="d-flex gap-1">
                                                                    <Button variant="info" title="ซูม" onClick={() => {
                                                                        const mk = markers.current.get(String(feat.refid))
                                                                        if (mk) {
                                                                            const { lng, lat } = mk.getLngLat()
                                                                            mapInstance.current?.flyTo({ center: [lng, lat], zoom: 16 })
                                                                        }
                                                                    }}>
                                                                        <em className="icon ni ni-focus" />
                                                                    </Button>
                                                                    <Button variant="warning" title="แก้ไข" onClick={() =>
                                                                        navigate(`/detail?formid=${formid}&refid=${String(feat.refid)}&type=${layertype}`)
                                                                    }>
                                                                        <em className="icon ni ni-edit" />
                                                                    </Button>
                                                                    <Button variant="info" title="QR Code" onClick={() =>
                                                                        navigate(`/detail-qr?formid=${formid}&refid=${String(feat.refid)}&type=${layertype}`)
                                                                    }>
                                                                        <em className="icon ni ni-scan" />
                                                                    </Button>
                                                                    <Button variant="danger" title="ลบ" onClick={() => {
                                                                        if (confirm('ยืนยันการลบ?')) {
                                                                            layersApi.deleteRow({ formid, refid: String(feat.refid) })
                                                                                .then(() => { setMessage({ text: 'ลบสำเร็จ', variant: 'success' }); loadFeatures() })
                                                                                .catch(() => setMessage({ text: 'เกิดข้อผิดพลาด', variant: 'danger' }))
                                                                        }
                                                                    }}>
                                                                        <em className="icon ni ni-trash-alt" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                            {columns.map((c) => (
                                                                <td key={c.col_id} style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {String(feat[c.col_id] ?? '')}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature form modal */}
            {modalOpen && (
                <>
                    <div className="modal-backdrop show" style={{ opacity: 0.5, zIndex: 1040 }} onClick={() => setModalOpen(false)} />
                    <div className="modal show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title f">{editRefid ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}</h5>
                                    <button type="button" className="btn-close" onClick={() => setModalOpen(false)} />
                                </div>
                                <div className="modal-body">
                                    {!editRefid && selectedLat && selectedLng && (
                                        <div className="alert alert-info py-2 mb-3" style={{ fontSize: 'var(--text-sm)' }}>
                                            <em className="icon ni ni-map-pin" />&nbsp;
                                            ตำแหน่ง: {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
                                        </div>
                                    )}
                                    <div className="form-container">
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
                                                    <Input
                                                        value={formData[col.col_id] ?? ''}
                                                        onChange={(e) => setFormData((p) => ({ ...p, [col.col_id]: e.target.value }))}
                                                        placeholder="URL ของรูปภาพ"
                                                    />
                                                ) : (
                                                    <Input
                                                        type={col.col_type === 'numeric' || col.col_type === 'integer' ? 'number' : 'text'}
                                                        value={formData[col.col_id] ?? ''}
                                                        onChange={(e) => setFormData((p) => ({ ...p, [col.col_id]: e.target.value }))}
                                                        placeholder="ระบุ.."
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        {columns.length === 0 && (
                                            <p className="text-muted">ชั้นข้อมูลนี้ไม่มีคอลัมน์กำหนด</p>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <Button id="submitButton" onClick={handleSave} loading={saving}>
                                        <em className="icon ni ni-save" />&nbsp;บันทึก
                                    </Button>
                                    <Button variant="light" onClick={() => setModalOpen(false)}>ปิดหน้าต่าง</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    )
}

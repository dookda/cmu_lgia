import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../templates/AppLayout/AppLayout'
import { Button } from '../../atoms/Button/Button'
import { Select } from '../../atoms/Select/Select'
import { Input } from '../../atoms/Input/Input'
import { Alert } from '../../atoms/Alert/Alert'
import { divisionsApi, layersApi } from '../../../services/api'

const LAYER_TYPES = [
    { value: 'point', label: 'จุด (Point)' },
    { value: 'linestring', label: 'เส้น (LineString)' },
    { value: 'polygon', label: 'รูปปิด (Polygon)' },
]

export function InputCsvPage() {
    const navigate = useNavigate()
    const fileRef = useRef<HTMLInputElement>(null)

    const [division, setDivision] = useState('')
    const [layername, setLayername] = useState('')
    const [layertype, setLayertype] = useState('point')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string; variant: 'success' | 'danger' } | null>(null)
    const [result, setResult] = useState<{ formid: string; rows: number; columns: string[] } | null>(null)

    const { data: divisions = [] } = useQuery({
        queryKey: ['divisions'],
        queryFn: divisionsApi.list,
    })
    const divisionOptions = divisions.map((d) => ({ value: d.division_name, label: d.division_name }))

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const file = fileRef.current?.files?.[0]
        if (!file) { setMessage({ text: 'กรุณาเลือกไฟล์', variant: 'danger' }); return }
        if (!division) { setMessage({ text: 'กรุณาเลือกหน่วยงาน', variant: 'danger' }); return }
        if (!layername.trim()) { setMessage({ text: 'กรุณาระบุชื่อชั้นข้อมูล', variant: 'danger' }); return }

        setLoading(true)
        setMessage(null)
        try {
            const fd = new FormData()
            fd.append('division', division)
            fd.append('layername', layername)
            fd.append('layertype', layertype)
            fd.append('file', file)
            const res = await layersApi.uploadCsv(fd)
            setResult(res)
            setMessage({ text: `สร้างชั้นข้อมูลสำเร็จ นำเข้า ${res.rows} แถว`, variant: 'success' })
        } catch (err: unknown) {
            setMessage({ text: (err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'), variant: 'danger' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <AppLayout>
            <div className="nk-block">
                {/* Page title card */}
                <div className="row g-gs mb-3">
                    <div className="col-12">
                        <div className="card card-full">
                            <div className="card-inner">
                                <label className="f">Local Geo-Info Application: LGIA</label>
                                <h5 className="title f">ระบบภูมิสารสนเทศชุมชน — นำเข้าข้อมูล CSV / Excel</h5>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-gs">
                    <div className="col-12">
                        <div className="card card-full">
                            <div className="card-inner">
                                {message && <Alert message={message.text} variant={message.variant} onDismiss={() => setMessage(null)} />}

                                <form id="uploadForm" onSubmit={handleSubmit}>
                                    <div className="row mt-2">
                                        <h5><i className="bi bi-1-circle-fill" />&nbsp;กำหนดชื่อชั้นข้อมูล</h5>

                                        <div className="col-md-4 mt-2">
                                            <label className="form-label">ชื่อหน่วยงาน</label>
                                            <Select
                                                options={divisionOptions}
                                                placeholder="เลือกหน่วยงาน"
                                                value={division}
                                                onChange={(e) => setDivision(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-4 mt-2">
                                            <label className="form-label">ชื่อชั้นข้อมูล</label>
                                            <Input
                                                value={layername}
                                                onChange={(e) => setLayername(e.target.value)}
                                                placeholder="ระบุ.."
                                                required
                                            />
                                        </div>

                                        <div className="col-md-4 mt-2">
                                            <label className="form-label">ประเภทของชั้นข้อมูล</label>
                                            <Select
                                                options={LAYER_TYPES}
                                                value={layertype}
                                                onChange={(e) => setLayertype(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="row mt-4">
                                        <h5><i className="bi bi-2-circle-fill" />&nbsp;เลือกไฟล์ CSV หรือ Excel</h5>
                                        <div className="col-md-8 mt-2">
                                            <label className="form-label">
                                                ไฟล์ CSV หรือ Excel&nbsp;
                                                <small className="text-muted">(หากมีคอลัมน์ <code>latitude</code>/<code>longitude</code> จะสร้างจุดบนแผนที่อัตโนมัติ)</small>
                                            </label>
                                            <input
                                                ref={fileRef}
                                                type="file"
                                                id="file"
                                                name="file"
                                                className="form-control"
                                                accept=".csv,.xlsx,.xls"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <hr className="mt-4" />
                                    <div className="mt-3">
                                        <Button type="submit" loading={loading} variant="primary">
                                            <em className="icon ni ni-layers" />&nbsp;สร้างชั้นข้อมูล
                                        </Button>
                                    </div>
                                </form>

                                {/* Success: offer to open the edit page */}
                                {result && (
                                    <div className="alert alert-success mt-4">
                                        <p className="mb-1"><strong>นำเข้าสำเร็จ!</strong> {result.rows} แถว</p>
                                        <p className="mb-2 text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                                            คอลัมน์: {result.columns.join(', ')}
                                        </p>
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant="primary"
                                                onClick={() => navigate(`/input-edit?formid=${result.formid}&type=${layertype}`)}
                                            >
                                                <em className="icon ni ni-map-pin" />&nbsp;เปิดหน้าแก้ไขข้อมูล
                                            </Button>
                                            <Button variant="light" onClick={() => navigate('/layers')}>
                                                ดูรายการข้อมูล
                                            </Button>
                                        </div>
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

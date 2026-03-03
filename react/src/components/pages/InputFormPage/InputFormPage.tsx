import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../templates/AppLayout/AppLayout'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Select } from '../../atoms/Select/Select'
import { Alert } from '../../atoms/Alert/Alert'
import { layersApi, divisionsApi } from '../../../services/api'
import type { LayerColumn, LayerType } from '../../../types/layer'

const LAYER_TYPES: { value: LayerType; label: string }[] = [
  { value: 'Point', label: 'จุด (Point)' },
  { value: 'LineString', label: 'เส้น (Polyline)' },
  { value: 'Polygon', label: 'รูปปิด (Polygon)' },
]

const COLUMN_TYPES = [
  { value: 'text', label: 'ตัวอักษร' },
  { value: 'numeric', label: 'ตัวเลข' },
  { value: 'date', label: 'วันที่' },
  { value: 'file', label: 'รูปภาพ' },
]


export function InputFormPage() {
  const navigate = useNavigate()

  const [division, setDivision] = useState('')
  const [layername, setLayername] = useState('')
  const [layertype, setLayertype] = useState<LayerType>('Point')
  const [columns, setColumns] = useState<LayerColumn[]>([])
  const [colName, setColName] = useState('')
  const [colType, setColType] = useState('text')
  const [colDesc, setColDesc] = useState('')
  const [createdFormid, setCreatedFormid] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'danger' } | null>(null)

  const { data: divisions = [] } = useQuery({
    queryKey: ['divisions'],
    queryFn: divisionsApi.list,
  })

  const createMutation = useMutation({
    mutationFn: layersApi.create,
    onSuccess: (result) => {
      setCreatedFormid(result.formid)
      setMessage({ text: 'สร้างชั้นข้อมูลสำเร็จ', variant: 'success' })
    },
    onError: (err: unknown) => setMessage({
      text: `เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : 'ไม่สามารถสร้างชั้นข้อมูลได้'}`,
      variant: 'danger',
    }),
  })

  const divisionOptions = divisions.map((d) => ({ value: d.division_name, label: d.division_name }))

  const handleAddColumn = () => {
    if (!colName.trim()) return
    setColumns((prev) => [...prev, { column_name: colName, column_type: colType, column_desc: colDesc }])
    setColName(''); setColType('text'); setColDesc('')
  }

  const handleRemoveColumn = (index: number) => {
    setColumns((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreate = () => {
    if (columns.length === 0) {
      setMessage({ text: 'กรุณาเพิ่มคอลัมน์อย่างน้อย 1 คอลัมน์', variant: 'danger' })
      return
    }
    createMutation.mutate({ division, layername, layertype, columns })
  }

  return (
    <AppLayout>
      <div className="nk-block">
        <div className="card card-full">
          <div className="card-inner">
            <h6 className="title mb-4">สร้างชั้นข้อมูลใหม่</h6>

            {message && (
              <Alert message={message.text} variant={message.variant} onDismiss={() => setMessage(null)} />
            )}

            {/* Step 1 — Layer info */}
            <div className="row mt-2 mb-4">
              <div className="col-md-4">
                <label className="form-label">หน่วยงาน</label>
                <Select
                  options={divisionOptions}
                  placeholder="เลือกหน่วยงาน"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">ชื่อชั้นข้อมูล</label>
                <Input
                  value={layername}
                  onChange={(e) => setLayername(e.target.value)}
                  placeholder="ชื่อชั้นข้อมูล"
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">ประเภทข้อมูล</label>
                <Select
                  options={LAYER_TYPES}
                  value={layertype}
                  onChange={(e) => setLayertype(e.target.value as LayerType)}
                />
              </div>
            </div>

            {/* Step 2 — Define columns */}
            <div className="mt-4">
              <h6 className="title mb-3">
                ชั้นข้อมูล: {layername || 'ยังไม่ได้ระบุ'} &nbsp;|&nbsp; {layertype} &nbsp;|&nbsp; {division || 'ยังไม่ได้ระบุ'}
              </h6>

              {/* Add column row */}
              <div className="row mt-2 mb-3 align-items-end">
                <div className="col-md-3">
                  <label className="form-label">ชื่อคอลัมน์</label>
                  <Input value={colName} onChange={(e) => setColName(e.target.value)} placeholder="column_name" />
                </div>
                <div className="col-md-3">
                  <label className="form-label">ประเภท</label>
                  <Select options={COLUMN_TYPES} value={colType} onChange={(e) => setColType(e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">คำอธิบาย</label>
                  <Input value={colDesc} onChange={(e) => setColDesc(e.target.value)} placeholder="คำอธิบาย" />
                </div>
                <div className="col-md-2">
                  <Button onClick={handleAddColumn} variant="success" className="w-100">เพิ่ม</Button>
                </div>
              </div>

              {/* Column preview table */}
              {columns.length > 0 && (
                <div className="table-responsive mb-4">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>#</th><th>ชื่อคอลัมน์</th><th>ประเภท</th><th>คำอธิบาย</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{col.column_name}</td>
                          <td>{col.column_type}</td>
                          <td>{col.column_desc}</td>
                          <td>
                            <Button variant="danger" onClick={() => handleRemoveColumn(i)}>ลบ</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

            {/* Step 3 — Create */}
            <div className="d-flex mt-3">
              <Button
                type="button"
                variant="primary"
                onClick={handleCreate}
                loading={createMutation.isPending}
                disabled={!division || !layername}
                className="me-2"
              >
                สร้างชั้นข้อมูล
              </Button>
              {createdFormid && (
                <Button
                  type="button"
                  variant="success"
                  onClick={() => navigate(`/input-edit?formid=${createdFormid}&type=${layertype}`)}
                >
                  เพิ่มข้อมูล
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

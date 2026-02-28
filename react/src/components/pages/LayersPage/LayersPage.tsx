import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../templates/AppLayout/AppLayout'
import { AppDataTable } from '../../organisms/DataTable/DataTable'
import type { DTColumn } from '../../organisms/DataTable/DataTable'
import { Alert } from '../../atoms/Alert/Alert'
import { layersApi } from '../../../services/api'
import type { Layer } from '../../../types/layer'

export function LayersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'danger' } | null>(null)

  const { data: layers = [], isLoading } = useQuery({
    queryKey: ['layers'],
    queryFn: layersApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: layersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layers'] })
      setMessage({ text: 'ลบข้อมูลสำเร็จ', variant: 'success' })
    },
    onError: () => setMessage({ text: 'เกิดข้อผิดพลาดในการลบ', variant: 'danger' }),
  })

  // Register global handlers for DataTables HTML-string buttons
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    w._layerOpen = (formid: string, type: string) =>
      navigate(`/input-edit?formid=${formid}&type=${type}`)
    w._layerDelete = (gid: number) => {
      if (confirm('ยืนยันการลบรายการนี้?')) deleteMutation.mutate(gid)
    }
    return () => {
      delete w._layerOpen
      delete w._layerDelete
    }
  }, [navigate, deleteMutation])

  const columns: DTColumn[] = [
    { title: 'ID', data: 'gid' },
    { title: 'หน่วยงาน', data: 'division' },
    { title: 'ชื่อชั้นข้อมูล', data: 'layername' },
    { title: 'ประเภท', data: 'layertype' },
    {
      title: 'วันที่สร้าง',
      data: 'ts',
      render: (val) =>
        val ? new Date(val as string).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-',
    },
    {
      title: '',
      data: null,
      orderable: false,
      searchable: false,
      className: 'text-end',
      render: (_: unknown, __: string, row: unknown) => {
        const layer = row as Layer
        return `<div class="d-flex gap-1 justify-content-end">
          <button class="btn btn-primary" onclick="window._layerOpen('${layer.formid}','${layer.layertype}')">
            <em class="icon ni ni-text-rich"></em>&nbsp;เปิดชั้นข้อมูล
          </button>
          <button class="btn btn-danger" onclick="window._layerDelete(${layer.gid})">
            <em class="icon ni ni-trash-alt"></em>&nbsp;ลบ
          </button>
        </div>`
      },
    },
  ]

  return (
    <AppLayout>
      <div className="nk-block">
        <div className="card card-full">
          <div className="card-inner">
            <div className="card-title-group mb-3">
              <h6 className="title">รายการชั้นข้อมูล</h6>
              <div className="card-tools">
                <span className="badge bg-primary">{layers.length} ชั้นข้อมูล</span>
              </div>
            </div>

            {message && (
              <Alert message={message.text} variant={message.variant} onDismiss={() => setMessage(null)} />
            )}

            <AppDataTable data={layers} columns={columns} loading={isLoading} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

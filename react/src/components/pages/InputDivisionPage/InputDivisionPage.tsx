import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '../../templates/AppLayout/AppLayout'
import { AppDataTable } from '../../organisms/DataTable/DataTable'
import type { DTColumn } from '../../organisms/DataTable/DataTable'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Alert } from '../../atoms/Alert/Alert'
import { divisionsApi } from '../../../services/api'
import type { Division } from '../../../types/division'

export function InputDivisionPage() {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editTarget, setEditTarget] = useState<Division | null>(null)
  const [editName, setEditName] = useState('')
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'danger' } | null>(null)

  const { data: divisions = [], isLoading } = useQuery({
    queryKey: ['divisions'],
    queryFn: divisionsApi.list,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['divisions'] })

  const createMutation = useMutation({
    mutationFn: divisionsApi.create,
    onSuccess: () => { invalidate(); setNewName(''); setMessage({ text: 'เพิ่มหน่วยงานสำเร็จ', variant: 'success' }) },
    onError: (err: Error) => setMessage({ text: err.message, variant: 'danger' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      divisionsApi.update(id, { division_name: name }),
    onSuccess: () => { invalidate(); setEditTarget(null); setMessage({ text: 'อัปเดตสำเร็จ', variant: 'success' }) },
    onError: (err: Error) => setMessage({ text: err.message, variant: 'danger' }),
  })

  const deleteMutation = useMutation({
    mutationFn: divisionsApi.delete,
    onSuccess: () => { invalidate(); setMessage({ text: 'ลบข้อมูลสำเร็จ', variant: 'success' }) },
    onError: () => setMessage({ text: 'เกิดข้อผิดพลาดในการลบ', variant: 'danger' }),
  })

  // Register global handlers for DataTables HTML-string buttons
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    w._divEdit = (id: number, name: string) => {
      setEditTarget({ id, division_name: name, created_at: '' })
      setEditName(name)
    }
    w._divDelete = (id: number) => {
      if (confirm('ยืนยันการลบ?')) deleteMutation.mutate(id)
    }
    return () => {
      delete w._divEdit
      delete w._divDelete
    }
  }, [deleteMutation])

  const columns: DTColumn[] = [
    { title: 'ID', data: 'id' },
    { title: 'ชื่อหน่วยงาน', data: 'division_name' },
    {
      title: 'วันที่สร้าง',
      data: 'created_at',
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
        const div = row as Division
        return `<div class="d-flex gap-1 justify-content-end">
          <button class="btn btn-primary" onclick="window._divEdit(${div.id},'${div.division_name.replace(/'/g, "\\'")}')">
            <em class="icon ni ni-edit"></em>&nbsp;แก้ไข
          </button>
          <button class="btn btn-danger" onclick="window._divDelete(${div.id})">
            <em class="icon ni ni-trash-alt"></em>&nbsp;ลบ
          </button>
        </div>`
      },
    },
  ]

  return (
    <AppLayout requireRole="admin">
      <div className="nk-block">
        <div className="card card-full mb-4">
          <div className="card-inner pb-3">
            <h6 className="title mb-3">เพิ่มหน่วยงาน</h6>
            {message && <Alert message={message.text} variant={message.variant} onDismiss={() => setMessage(null)} />}
            <form
              className="d-flex gap-2"
              onSubmit={(e) => { e.preventDefault(); if (newName.trim()) createMutation.mutate({ division_name: newName.trim() }) }}
            >
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ชื่อหน่วยงาน"
                required
                style={{ maxWidth: 320 }}
              />
              <Button type="submit" loading={createMutation.isPending}>เพิ่ม</Button>
            </form>
          </div>
        </div>

        <div className="card card-full">
          <div className="card-inner">
            <div className="card-title-group mb-3">
              <h6 className="title">รายการหน่วยงาน</h6>
              <span className="badge bg-primary">{divisions.length} หน่วยงาน</span>
            </div>
            <AppDataTable data={divisions} columns={columns} loading={isLoading} />
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editTarget && (
        <div className="modal show d-block" style={{ zIndex: 'var(--z-modal)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">แก้ไขหน่วยงาน</h5>
                <button className="btn-close" onClick={() => setEditTarget(null)} />
              </div>
              <div className="modal-body">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="ชื่อหน่วยงาน"
                />
              </div>
              <div className="modal-footer">
                <Button variant="light" onClick={() => setEditTarget(null)}>ยกเลิก</Button>
                <Button
                  loading={updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ id: editTarget.id, name: editName })}
                >
                  บันทึก
                </Button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" style={{ opacity: 0.5 }} onClick={() => setEditTarget(null)} />
        </div>
      )}
    </AppLayout>
  )
}

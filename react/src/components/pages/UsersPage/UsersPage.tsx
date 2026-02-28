import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '../../templates/AppLayout/AppLayout'
import { AppDataTable } from '../../organisms/DataTable/DataTable'
import type { DTColumn } from '../../organisms/DataTable/DataTable'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Select } from '../../atoms/Select/Select'
import { Alert } from '../../atoms/Alert/Alert'
import { usersApi, divisionsApi } from '../../../services/api'
import type { User, UpdateUserPayload, AuthRole } from '../../../types/user'

const AUTH_OPTIONS: { value: AuthRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'pending', label: 'Pending' },
]

export function UsersPage() {
  const queryClient = useQueryClient()
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [editData, setEditData] = useState<Partial<UpdateUserPayload>>({})
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'danger' } | null>(null)

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.list })
  const { data: divisions = [] } = useQuery({ queryKey: ['divisions'], queryFn: divisionsApi.list })

  const divisionOptions = divisions.map((d) => ({ value: d.division_name, label: d.division_name }))
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserPayload }) => usersApi.update(id, data),
    onSuccess: () => { invalidate(); setEditTarget(null); setMessage({ text: 'อัปเดตสำเร็จ', variant: 'success' }) },
    onError: (err: Error) => setMessage({ text: err.message, variant: 'danger' }),
  })

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => { invalidate(); setMessage({ text: 'ลบข้อมูลสำเร็จ', variant: 'success' }) },
    onError: () => setMessage({ text: 'เกิดข้อผิดพลาดในการลบ', variant: 'danger' }),
  })

  const openEdit = (user: User) => {
    setEditTarget(user)
    setEditData({ username: user.username, email: user.email, auth: user.auth, division: user.division })
  }

  // Register global handlers — look up the full user from the current list
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    w._userEdit = (id: number) => {
      const user = users.find((u) => u.id === id)
      if (user) openEdit(user)
    }
    w._userDelete = (id: number) => {
      if (confirm('ยืนยันการลบ?')) deleteMutation.mutate(id)
    }
    return () => {
      delete w._userEdit
      delete w._userDelete
    }
  }, [users, deleteMutation]) // eslint-disable-line react-hooks/exhaustive-deps

  const columns: DTColumn[] = [
    { title: 'ID', data: 'id' },
    { title: 'Username', data: 'username' },
    { title: 'ชื่อ', data: 'displayname' },
    { title: 'Email', data: 'email' },
    { title: 'สิทธิ์', data: 'auth' },
    { title: 'หน่วยงาน', data: 'division' },
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
        const user = row as User
        return `<div class="d-flex gap-1 justify-content-end">
          <button class="btn btn-primary" onclick="window._userEdit(${user.id})">
            <em class="icon ni ni-edit"></em>&nbsp;แก้ไข
          </button>
          <button class="btn btn-danger" onclick="window._userDelete(${user.id})">
            <em class="icon ni ni-trash-alt"></em>&nbsp;ลบ
          </button>
        </div>`
      },
    },
  ]

  return (
    <AppLayout requireRole="admin">
      <div className="nk-block">
        <div className="card card-full">
          <div className="card-inner">
            <div className="card-title-group mb-3">
              <h6 className="title">จัดการผู้ใช้งาน</h6>
              <span className="badge bg-primary">{users.length} คน</span>
            </div>

            {message && <Alert message={message.text} variant={message.variant} onDismiss={() => setMessage(null)} />}

            <AppDataTable data={users} columns={columns} loading={isLoading} />
          </div>
        </div>
      </div>

      {editTarget && (
        <div className="modal show d-block" style={{ zIndex: 'var(--z-modal)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">แก้ไขผู้ใช้</h5>
                <button className="btn-close" onClick={() => setEditTarget(null)} />
              </div>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label className="form-label">Username</label>
                  <Input
                    value={editData.username ?? ''}
                    onChange={(e) => setEditData((p) => ({ ...p, username: e.target.value }))}
                  />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Email</label>
                  <Input
                    type="email"
                    value={editData.email ?? ''}
                    onChange={(e) => setEditData((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">สิทธิ์</label>
                  <Select
                    options={AUTH_OPTIONS}
                    value={editData.auth ?? 'viewer'}
                    onChange={(e) => setEditData((p) => ({ ...p, auth: e.target.value as AuthRole }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">หน่วยงาน</label>
                  <Select
                    options={divisionOptions}
                    placeholder="เลือกหน่วยงาน"
                    value={editData.division ?? ''}
                    onChange={(e) => setEditData((p) => ({ ...p, division: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="light" onClick={() => setEditTarget(null)}>ยกเลิก</Button>
                <Button
                  loading={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({ id: editTarget.id, data: editData as UpdateUserPayload })
                  }
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

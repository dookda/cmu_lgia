import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '../../templates/AppLayout/AppLayout'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Alert } from '../../atoms/Alert/Alert'
import { infoApi, adminApi } from '../../../services/api'

export function AdminPage() {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'danger' } | null>(null)

  const { data: info } = useQuery({ queryKey: ['info'], queryFn: infoApi.get })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await adminApi.updateInfo(formData)
      queryClient.invalidateQueries({ queryKey: ['info'] })
      setMessage({ text: 'อัปเดตข้อมูลสำเร็จ', variant: 'success' })
    } catch {
      setMessage({ text: 'เกิดข้อผิดพลาด', variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout requireRole="admin">
      <div className="nk-block">
        <div className="card card-full" style={{ maxWidth: 560 }}>
          <div className="card-inner">
            <h6 className="title mb-4">ตั้งค่าระบบ</h6>

            {message && <Alert message={message.text} variant={message.variant} onDismiss={() => setMessage(null)} />}

            <form onSubmit={handleSubmit}>
              <div className="form-group mb-3">
                <label className="form-label">ชื่อเทศบาล / อบต.</label>
                <Input name="name" defaultValue={info?.name ?? ''} placeholder="ชื่อหน่วยงาน" />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">โลโก้ (รูปภาพ)</label>
                {info?.img && (
                  <div className="mb-2">
                    <img src={info.img} alt="current logo" style={{ height: 64, objectFit: 'contain' }} />
                  </div>
                )}
                <input name="img" type="file" className="form-control" accept="image/*" />
              </div>

              <Button type="submit" loading={loading}>บันทึก</Button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

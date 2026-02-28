import { useState, useEffect } from 'react'
import { AppLayout } from '../../templates/AppLayout/AppLayout'
import { Avatar } from '../../atoms/Avatar/Avatar'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Alert } from '../../atoms/Alert/Alert'
import { useAuthStore } from '../../../store/authStore'
import { authApi } from '../../../services/api'

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [division, setDivision] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; variant: 'success' | 'danger' } | null>(null)

  // Load detailed profile on mount
  useEffect(() => {
    authApi.profileDetail().then((res) => {
      if (res.success && res.user) {
        setUsername(res.user.username ?? '')
        setEmail(res.user.email ?? '')
        setDivision(res.user.division ?? '')
      }
    }).catch(() => { })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.updateProfile({ username, email, division })
      setMessage({ text: 'บันทึกข้อมูลสำเร็จ', variant: 'success' })
    } catch {
      setMessage({ text: 'เกิดข้อผิดพลาดในการบันทึก', variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="nk-block">
        <div className="card card-full" style={{ maxWidth: 560 }}>
          <div className="card-inner card-inner-lg">

            {/* Avatar */}
            <div className="brand-logo pb-4 text-center">
              <Avatar src={user?.pictureUrl} size="lg" />
            </div>

            {message && <Alert message={message.text} variant={message.variant} onDismiss={() => setMessage(null)} />}

            <form id="profileForm" onSubmit={handleSave}>

              {/* LINE Display Name — read only */}
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="displayName">ชื่อ Line</label>
                <div className="form-control-wrap">
                  <Input
                    id="displayName"
                    value={user?.displayName ?? ''}
                    readOnly
                    disabled
                  />
                </div>
              </div>

              {/* Username — editable */}
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="userName">ชื่อผู้ใช้</label>
                <div className="form-control-wrap">
                  <Input
                    id="userName"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ชื่อผู้ใช้"
                    required
                  />
                </div>
              </div>

              {/* Email — editable */}
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="userEmail">Email</label>
                <div className="form-control-wrap">
                  <Input
                    id="userEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {/* Division — editable */}
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="userDivision">หน่วยงาน</label>
                <div className="form-control-wrap">
                  <Input
                    id="userDivision"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    placeholder="ชื่อหน่วยงาน"
                  />
                </div>
              </div>

              {/* Role — read only */}
              <div className="form-group mb-4">
                <label className="form-label" htmlFor="userRole">สิทธิ์การใช้งาน</label>
                <div className="form-control-wrap">
                  <Input
                    id="userRole"
                    value={user?.auth ?? ''}
                    readOnly
                    disabled
                  />
                </div>
              </div>

              <div className="form-group d-flex gap-2">
                <Button type="submit" loading={loading}>
                  <em className="icon ni ni-save" />&nbsp;บันทึก
                </Button>
                <Button variant="light" onClick={() => window.history.back()}>หน้าหลัก</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

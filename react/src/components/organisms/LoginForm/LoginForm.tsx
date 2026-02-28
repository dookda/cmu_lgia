import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../../services/api'
import { FormField } from '../../molecules/FormField/FormField'
import { Button } from '../../atoms/Button/Button'
import { Alert } from '../../atoms/Alert/Alert'

export function LoginForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const payload = {
      username: form.get('username') as string,
      password: form.get('password') as string,
    }

    try {
      const result = await authApi.login(payload)
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError('username หรือ password ผิด')
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert message={error} variant="danger" onDismiss={() => setError(null)} />}

      <FormField
        label="Username"
        name="username"
        type="text"
        required
        autoComplete="username"
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
      />

      <Button type="submit" loading={loading} className="w-100">
        เข้าสู่ระบบ
      </Button>

      <div className="mt-3" style={{ fontSize: 'var(--text-sm)' }}>
        <p>
          หากยังไม่ลงทะเบียนกรุณา{' '}
          <a href="/register">ลงทะเบียน ที่นี่</a>
        </p>
        <p>
          หรือ login ด้วย <a href="/auth/login">LINE</a>
        </p>
      </div>
    </form>
  )
}

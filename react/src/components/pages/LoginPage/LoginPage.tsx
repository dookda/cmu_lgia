import { AuthLayout } from '../../templates/AuthLayout/AuthLayout'
import { LoginForm } from '../../organisms/LoginForm/LoginForm'

export function LoginPage() {
  return (
    <AuthLayout title="เข้าสู่ LGIA">
      <LoginForm />
    </AuthLayout>
  )
}

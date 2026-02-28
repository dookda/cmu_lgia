import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../../organisms/Sidebar/Sidebar'
import { Header } from '../../organisms/Header/Header'
import { useAuthStore } from '../../../store/authStore'
import { authApi, infoApi } from '../../../services/api'
import { Spinner } from '../../atoms/Spinner/Spinner'

interface AppLayoutProps {
  children: ReactNode
  requireRole?: 'admin' | 'editor'
}

export function AppLayout({ children, requireRole = 'editor' }: AppLayoutProps) {
  const navigate = useNavigate()
  const { setUser, setTasaban, isLoggedIn } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)
  const closeSidebar = () => setSidebarOpen(false)

  useEffect(() => {
    const init = async () => {
      try {
        const [profile, info] = await Promise.all([
          authApi.profile(requireRole),
          infoApi.get(),
        ])

        if (!profile.success || !profile.auth) {
          navigate('/login')
          return
        }

        setUser(profile.user)
        setTasaban(info)
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    if (!isLoggedIn) {
      init()
    } else {
      setLoading(false)
    }
  }, [isLoggedIn, navigate, requireRole, setTasaban, setUser])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner />
      </div>
    )
  }

  return (
    <div className="nk-app-root">
      <div className="nk-main has-sidebar">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        {/* Mobile backdrop — clicking it closes the sidebar */}
        {sidebarOpen && (
          <div
            className="nk-sidebar-overlay"
            onClick={closeSidebar}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 'calc(var(--z-sidebar) - 1)' as unknown as number,
              background: 'rgba(0,0,0,0.35)',
            }}
          />
        )}

        <div className="nk-wrap">
          <Header onToggleSidebar={toggleSidebar} />
          <div
            className="nk-content nk-content-fluid"
            style={{ paddingTop: 'var(--header-height)' }}
          >
            <div className="container-xl wide-xl">
              <div className="nk-content-body">
                {children}
              </div>
            </div>
          </div>

          <div className="nk-footer">
            <div className="container-xl wide-xl">
              <div className="nk-footer-wrap">
                <div className="nk-footer-copyright" style={{ fontSize: 'var(--text-sm)' }}>
                  © 2025 LGIA
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

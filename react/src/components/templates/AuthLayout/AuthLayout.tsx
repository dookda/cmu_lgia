import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface AuthLayoutProps {
  title: string
  children: ReactNode
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  // Dashlite requires body to have 'pg-auth' for the centered auth card layout
  useEffect(() => {
    document.body.classList.add('pg-auth', 'npc-general')
    return () => {
      document.body.classList.remove('pg-auth', 'npc-general')
    }
  }, [])

  return (
    <div className="nk-app-root">
      <div className="nk-main">
        <div className="nk-wrap nk-wrap-nosidebar">
          <div className="nk-content">
            <div className="nk-block nk-block-middle nk-auth-body wide-xs">
              <div className="card">
                <div className="card-inner card-inner-lg">
                  <h4 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>
                    {title}
                  </h4>
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
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import { authApi } from '../../../services/api'
import { UserBadge } from '../../molecules/UserBadge/UserBadge'
import { Avatar } from '../../atoms/Avatar/Avatar'

interface HeaderProps {
  onToggleSidebar?: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate()
  const { user, isLoggedIn, tasaban, logout } = useAuthStore()

  const handleLogout = async () => {
    await authApi.logout().catch(() => { })
    logout()
    navigate('/login')
  }

  return (
    <div
      className="nk-header is-light nk-header-fixed"
      style={{ zIndex: 'var(--z-header)', height: 'var(--header-height)' }}
    >
      <div className="container-xl wide-xl">
        <div className="nk-header-wrap">
          {/* Mobile sidebar toggle */}
          <div className="nk-menu-trigger d-xl-none ms-n1 me-3">
            <a
              href="#"
              className="nk-nav-toggle nk-quick-nav-icon"
              onClick={(e) => { e.preventDefault(); onToggleSidebar?.() }}
            >
              <em className="icon ni ni-menu" />
            </a>
          </div>

          {/* Mobile logo */}
          <div className="nk-header-brand d-xl-none">
            <a href="/v3/dashboard" className="logo-link">
              <img
                className="logo-dark logo-img"
                src={tasaban?.img ?? '/v3/v2/images/logo-dark2x.png'}
                alt="logo"
              />
            </a>
          </div>

          <div className="nk-header-menu is-light" />

          {/* Right tools */}
          <div className="nk-header-tools">
            <ul className="nk-quick-nav">
              <li className="dropdown user-dropdown">
                <a href="#" className="dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                  <UserBadge pictureUrl={user?.pictureUrl} />
                </a>

                <div className="dropdown-menu dropdown-menu-md dropdown-menu-end">
                  {/* User info */}
                  {isLoggedIn && (
                    <div className="dropdown-inner user-card-wrap bg-lighter">
                      <div className="user-card d-flex align-items-center gap-2 p-2">
                        <Avatar src={user?.pictureUrl} size="md" />
                        <div className="user-info">
                          <span className="lead-text">{user?.displayName}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile link */}
                  {isLoggedIn && (
                    <div className="dropdown-inner">
                      <ul className="link-list">
                        <li>
                          <a href="/v3/profile">ข้อมูลส่วนตัว</a>
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Login options */}
                  {!isLoggedIn && (
                    <>
                      <div className="dropdown-inner">
                        <ul className="link-list">
                          <li className="d-flex align-items-center gap-2">
                            <img src="/v3/v2/images/avatar/admin.png" width={32} alt="" />
                            <a href="/v3/login">Login ด้วย Admin</a>
                          </li>
                        </ul>
                      </div>
                      <div className="dropdown-inner">
                        <ul className="link-list">
                          <li className="d-flex align-items-center gap-2">
                            <img src="/v3/v2/images/icons8-line.svg" width={32} alt="" />
                            <a href="/auth/login">Login ด้วย LINE</a>
                          </li>
                        </ul>
                      </div>
                    </>
                  )}

                  {/* Logout */}
                  {isLoggedIn && (
                    <div className="dropdown-inner">
                      <ul className="link-list">
                        <li>
                          <button className="btn btn-link p-0" onClick={handleLogout}>
                            <em className="icon ni ni-signout" />
                            <span>ออกจากระบบ</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

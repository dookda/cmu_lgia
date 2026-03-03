import { NavItem } from '../../molecules/NavItem/NavItem'
import { useAuthStore } from '../../../store/authStore'

const NAV_ITEMS = [
  { to: '/dashboard', icon: 'ni-presentation', label: 'รายงาน' },
  { to: '/input-form', icon: 'ni-create-icon', label: 'สร้างชั้นข้อมูล' },
  { to: '/input-csv', icon: 'ni-file-xls', label: 'นำเข้าข้อมูล CSV' },
  { to: '/layers', icon: 'ni-layers', label: 'รายการข้อมูล' },
  { to: '/divisions', icon: 'ni-tree-structure', label: 'หน่วยงาน' },
  { to: '/users', icon: 'ni-users', label: 'ผู้ใช้งาน' },
  { to: '/admin', icon: 'ni-web-development', label: 'Admin' },
  { to: '/manual', icon: 'ni-book-read', label: 'คู่มือการใช้งาน' },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const tasaban = useAuthStore((s) => s.tasaban)

  return (
    <div
      className={`nk-sidebar is-light nk-sidebar-fixed${isOpen ? ' nk-sidebar-active' : ''}`}
      data-content="sidebarMenu"
    >
      {/* Logo + mobile close button */}
      <div className="nk-sidebar-element nk-sidebar-head">
        <div className="nk-sidebar-brand">
          <a href="/v3/dashboard" className="logo-link nk-sidebar-logo">
            {tasaban?.img ? (
              <img
                className="logo-dark logo-img"
                src={tasaban.img}
                alt="logo"
                onError={(e) => {
                  ; (e.target as HTMLImageElement).src = '/v3/v2/images/logo-dark2x.png'
                }}
              />
            ) : (
              <img className="logo-dark logo-img" src="/v3/v2/images/logo-dark2x.png" alt="logo" />
            )}
          </a>
        </div>
        {/* Close button — visible only on mobile (d-xl-none) */}
        <div className="nk-menu-trigger me-n2">
          <a
            href="#"
            className="nk-nav-toggle nk-quick-nav-icon d-xl-none"
            onClick={(e) => { e.preventDefault(); onClose?.() }}
          >
            <em className="icon ni ni-arrow-left" />
          </a>
        </div>
      </div>

      {/* Navigation */}
      <div className="nk-sidebar-element">
        <div className="nk-sidebar-content">
          <div className="nk-sidebar-menu">
            <ul className="nk-menu">
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.to} {...item} onNavigate={onClose} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

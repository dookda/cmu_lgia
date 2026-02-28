import { NavLink } from 'react-router-dom'

interface NavItemProps {
  to: string
  icon: string
  label: string
  onNavigate?: () => void
}

export function NavItem({ to, icon, label, onNavigate }: NavItemProps) {
  return (
    <li className="nk-menu-item">
      <NavLink
        to={to}
        className={({ isActive }) => `nk-menu-link${isActive ? ' active' : ''}`}
        onClick={() => onNavigate?.()}
      >
        <span className="nk-menu-icon">
          <em className={`icon ni ${icon}`} />
        </span>
        <span className="nk-menu-text">{label}</span>
      </NavLink>
    </li>
  )
}

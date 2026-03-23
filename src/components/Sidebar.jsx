import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⚡' },
  { path: '/new/page', label: 'Nova Página', icon: '📄' },
  { path: '/projects', label: 'Projetos', icon: '📁' },
  { path: '/new/vsl', label: 'VSL Creator', icon: '🎬' },
  { path: '/new/creative', label: 'Criativos', icon: '🎨' },
  { path: '/settings', label: 'Configurações', icon: '⚙️' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)

  const apiKey = localStorage.getItem('geminiKey') || ''
  const maskedKey = apiKey ? '••••' + apiKey.slice(-4) : '—'

  const handleLogout = () => {
    localStorage.removeItem('geminiKey')
    navigate('/')
  }

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minHeight: '100vh',
        background: '#0d1117',
        borderRight: '1px solid #1f2937',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '24px 16px',
        borderBottom: '1px solid #1f2937',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 12
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1 }}>
              <span style={{ color: '#e5e7eb' }}>PAGE</span>
              <span style={{ color: '#06b6d4' }}>CRAFT</span>
            </span>
            <span style={{ fontSize: 10, color: '#4b5563', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', marginTop: 2 }}>
              GODTIME.AI
            </span>
          </div>
        )}
        {collapsed && (
          <span style={{ fontSize: 22 }}>⚡</span>
        )}
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            color: '#4b5563',
            cursor: 'pointer',
            fontSize: 18,
            padding: 4,
            lineHeight: 1,
            display: 'flex'
          }}
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {!collapsed && (
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: '#374151',
            padding: '8px 8px 4px',
            marginBottom: 4
          }}>
            Menu
          </div>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 8,
              marginBottom: 2,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#06b6d4' : '#6b7280',
              background: isActive ? 'rgba(6,182,212,0.1)' : 'transparent',
              border: isActive ? '1px solid rgba(6,182,212,0.2)' : '1px solid transparent',
              transition: 'all 0.15s'
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.style.background.includes('0.1')) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = '#e5e7eb'
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.style.background.includes('0.1')) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#6b7280'
              }
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User / API Key section */}
      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid #1f2937'
      }}>
        {!collapsed && (
          <div
            style={{
              padding: '10px 12px',
              background: '#030712',
              borderRadius: 8,
              border: '1px solid #1f2937',
              marginBottom: 8,
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={() => setShowLogout(!showLogout)}
          >
            <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>API Key</div>
            <div style={{ fontSize: 13, color: '#9ca3af', fontFamily: 'JetBrains Mono, monospace' }}>{maskedKey}</div>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#22c55e',
              position: 'absolute', top: 10, right: 10,
              boxShadow: '0 0 6px #22c55e'
            }} />
          </div>
        )}
        <button
          onClick={handleLogout}
          title="Sair"
          style={{
            width: '100%',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
        >
          <span>🚪</span>
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}

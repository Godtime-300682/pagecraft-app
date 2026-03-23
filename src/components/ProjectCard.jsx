import useStore from '../store/useStore'

const typeConfig = {
  page: { label: 'Página', color: '#06b6d4', icon: '📄' },
  vsl: { label: 'VSL', color: '#a855f7', icon: '🎬' },
  creative: { label: 'Criativo', color: '#22c55e', icon: '🎨' },
}

export default function ProjectCard({ project, onOpen }) {
  const { deleteProject } = useStore()
  const type = typeConfig[project.type] || typeConfig.page

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div
      className="animate-fade-in"
      style={{
        background: '#0d1117',
        border: '1px solid #1f2937',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#374151'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#1f2937'
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            background: `${type.color}20`,
            border: `1px solid ${type.color}40`,
            color: type.color,
            padding: '3px 10px',
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
        >
          {type.icon} {type.label}
        </div>
        <span style={{ fontSize: 12, color: '#4b5563' }}>{formatDate(project.createdAt)}</span>
      </div>

      {/* Title */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>
          {project.name}
        </h3>
        {project.description && (
          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
            {project.description.slice(0, 80)}{project.description.length > 80 ? '...' : ''}
          </p>
        )}
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: project.status === 'completed' ? '#22c55e' : '#eab308'
        }} />
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          {project.status === 'completed' ? 'Concluído' : 'Em andamento'}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        <button
          onClick={() => onOpen && onOpen(project)}
          style={{
            flex: 1,
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.3)',
            color: '#06b6d4',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(6,182,212,0.1)'}
        >
          Abrir
        </button>
        <button
          onClick={() => {
            if (window.confirm('Excluir este projeto?')) deleteProject(project.id)
          }}
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
        >
          🗑
        </button>
      </div>
    </div>
  )
}

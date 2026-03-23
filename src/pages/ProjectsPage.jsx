import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import ProjectCard from '../components/ProjectCard'

const TYPE_FILTERS = ['Todos', 'Página', 'VSL', 'Criativo']
const TYPE_MAP = { 'Página': 'page', 'VSL': 'vsl', 'Criativo': 'creative' }

export default function ProjectsPage() {
  const { projects } = useStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('Todos')
  const [search, setSearch] = useState('')

  const filtered = projects.filter(p => {
    const matchType = filter === 'Todos' || p.type === TYPE_MAP[filter]
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const stats = [
    { label: 'Total', value: projects.length, color: '#06b6d4' },
    { label: 'Páginas', value: projects.filter(p => p.type === 'page').length, color: '#a855f7' },
    { label: 'VSLs', value: projects.filter(p => p.type === 'vsl').length, color: '#22c55e' },
    { label: 'Criativos', value: projects.filter(p => p.type === 'creative').length, color: '#eab308' },
  ]

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f9fafb', marginBottom: 8 }}>
          Meus Projetos
        </h1>
        <p style={{ color: '#6b7280', fontSize: 15 }}>
          Todos os seus projetos salvos em um só lugar
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: '#0d1117', border: '1px solid #1f2937',
            borderRadius: 10, padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar projetos..."
          style={{ maxWidth: 260 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {TYPE_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'rgba(6,182,212,0.15)' : 'transparent',
                border: `1px solid ${filter === f ? 'rgba(6,182,212,0.4)' : '#1f2937'}`,
                color: filter === f ? '#06b6d4' : '#6b7280',
                padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: filter === f ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Project grid */}
      {filtered.length === 0 ? (
        <div style={{
          background: '#0d1117', border: '1px dashed #1f2937',
          borderRadius: 12, padding: 64, textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            {projects.length === 0 ? '🚀' : '🔍'}
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#9ca3af', marginBottom: 12 }}>
            {projects.length === 0 ? 'Nenhum projeto ainda' : 'Nenhum projeto encontrado'}
          </h3>
          <p style={{ color: '#4b5563', fontSize: 14, marginBottom: 24 }}>
            {projects.length === 0
              ? 'Crie seu primeiro projeto para começar!'
              : 'Tente ajustar os filtros ou a busca.'}
          </p>
          {projects.length === 0 && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/new/page')} style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                📄 Nova Página
              </button>
              <button onClick={() => navigate('/new/vsl')} style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                🎬 Criar VSL
              </button>
              <button onClick={() => navigate('/new/creative')} style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                🎨 Gerar Criativos
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16
        }}>
          {filtered.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  )
}

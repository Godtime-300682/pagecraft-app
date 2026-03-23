import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import ProjectCard from '../components/ProjectCard'

const quickActions = [
  {
    path: '/new/page',
    icon: '📄',
    title: 'Nova Página de Vendas',
    desc: 'Crie uma página completa com copy, design e exportação HTML',
    color: '#06b6d4',
    badge: '14 seções'
  },
  {
    path: '/new/vsl',
    icon: '🎬',
    title: 'Criar VSL',
    desc: 'Roteiro completo de Video Sales Letter pronto para gravar',
    color: '#a855f7',
    badge: '9 etapas'
  },
  {
    path: '/new/creative',
    icon: '🎨',
    title: 'Gerar Criativos',
    desc: 'Anúncios prontos para Meta Ads, Google Ads e TikTok',
    color: '#22c55e',
    badge: 'até 20 criativos'
  }
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { projects } = useStore()

  const stats = [
    { label: 'Total de Projetos', value: projects.length, icon: '📁', color: '#06b6d4' },
    { label: 'Páginas Geradas', value: projects.filter(p => p.type === 'page').length, icon: '📄', color: '#a855f7' },
    { label: 'VSLs Criadas', value: projects.filter(p => p.type === 'vsl').length, icon: '🎬', color: '#22c55e' },
    { label: 'Criativos', value: projects.filter(p => p.type === 'creative').length, icon: '🎨', color: '#eab308' },
  ]

  const recent = projects.slice(0, 3)

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: 40 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(6,182,212,0.1)',
          border: '1px solid rgba(6,182,212,0.2)',
          borderRadius: 100,
          padding: '4px 14px',
          fontSize: 12,
          color: '#06b6d4',
          fontWeight: 600,
          marginBottom: 12,
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
          Sistema online
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 8, color: '#f9fafb' }}>
          Olá, bem-vindo ao PageCraft ⚡
        </h1>
        <p style={{ fontSize: 16, color: '#6b7280' }}>
          Sua fábrica de conversão alimentada por Gemini AI. O que vamos criar hoje?
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 40
      }}>
        {stats.map((stat, i) => (
          <div
            key={i}
            className="animate-fade-in"
            style={{
              background: '#0d1117',
              border: '1px solid #1f2937',
              borderRadius: 12,
              padding: '20px 24px',
              animationDelay: `${i * 0.05}s`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>{stat.icon}</span>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: stat.color,
                boxShadow: `0 0 8px ${stat.color}`
              }} />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: stat.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '1.5px', color: '#4b5563', marginBottom: 16
        }}>
          Criar agora
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16
        }}>
          {quickActions.map((action, i) => (
            <button
              key={i}
              className="animate-fade-in"
              onClick={() => navigate(action.path)}
              style={{
                background: '#0d1117',
                border: `1px solid #1f2937`,
                borderRadius: 12,
                padding: 24,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                animationDelay: `${(i + 4) * 0.05}s`
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = action.color + '60'
                e.currentTarget.style.background = action.color + '08'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = `0 8px 24px ${action.color}20`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#1f2937'
                e.currentTarget.style.background = '#0d1117'
                e.currentTarget.style.transform = ''
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48,
                  background: action.color + '20',
                  border: `1px solid ${action.color}40`,
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22
                }}>
                  {action.icon}
                </div>
                <div style={{
                  background: action.color + '20',
                  border: `1px solid ${action.color}40`,
                  color: action.color,
                  padding: '3px 10px',
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  {action.badge}
                </div>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f9fafb', marginBottom: 6 }}>
                {action.title}
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                {action.desc}
              </p>
              <div style={{ marginTop: 16, fontSize: 13, color: action.color, fontWeight: 600 }}>
                Criar agora →
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '1.5px', color: '#4b5563'
          }}>
            Projetos recentes
          </div>
          {projects.length > 0 && (
            <button
              onClick={() => navigate('/projects')}
              style={{
                background: 'none', border: 'none', color: '#06b6d4',
                fontSize: 13, cursor: 'pointer', fontWeight: 600
              }}
            >
              Ver todos →
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <div style={{
            background: '#0d1117',
            border: '1px dashed #1f2937',
            borderRadius: 12,
            padding: 48,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
            <p style={{ color: '#6b7280', fontSize: 15 }}>
              Nenhum projeto ainda. Crie seu primeiro projeto acima!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16
          }}>
            {recent.map(p => (
              <ProjectCard key={p.id} project={p} onOpen={() => navigate('/projects')} />
            ))}
          </div>
        )}
      </div>

      {/* Footer tip */}
      <div style={{
        marginTop: 48,
        padding: '16px 20px',
        background: 'rgba(6,182,212,0.05)',
        border: '1px solid rgba(6,182,212,0.1)',
        borderRadius: 10,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#06b6d4' }}>Dica Pro: </span>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            Quanto mais detalhado for seu briefing, melhor a IA vai gerar o copy. Inclua dores específicas, resultados reais e o perfil exato do seu cliente ideal.
          </span>
        </div>
      </div>
    </div>
  )
}

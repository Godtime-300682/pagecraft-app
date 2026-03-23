import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const navigate = useNavigate()

  const [apiKey, setApiKey] = useState(localStorage.getItem('geminiKey') || '')
  const [whatsapp, setWhatsapp] = useState(localStorage.getItem('defaultWhatsapp') || '')
  const [checkoutUrl, setCheckoutUrl] = useState(localStorage.getItem('defaultCheckout') || '')
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const handleSave = () => {
    if (apiKey.trim()) localStorage.setItem('geminiKey', apiKey.trim())
    if (whatsapp.trim()) localStorage.setItem('defaultWhatsapp', whatsapp.trim())
    if (checkoutUrl.trim()) localStorage.setItem('defaultCheckout', checkoutUrl.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleClearData = () => {
    if (window.confirm('Isso irá apagar todos os seus projetos salvos. Continuar?')) {
      localStorage.removeItem('pagecraft-storage')
      window.location.reload()
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('geminiKey')
    navigate('/')
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f9fafb', marginBottom: 8 }}>
          Configurações
        </h1>
        <p style={{ color: '#6b7280', fontSize: 15 }}>
          Gerencie suas preferências e integrações
        </p>
      </div>

      {saved && (
        <div className="animate-fade-in" style={{
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 24,
          color: '#22c55e',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          ✓ Configurações salvas com sucesso!
        </div>
      )}

      {/* API Key Section */}
      <div style={{
        background: '#0d1117', border: '1px solid #1f2937',
        borderRadius: 12, padding: 28, marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>🔑</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f9fafb' }}>Google Gemini API Key</h2>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>
            API Key
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIza..."
              style={{ fontFamily: 'JetBrains Mono, monospace', paddingRight: 48 }}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 16
              }}
            >
              {showKey ? '🙈' : '👁'}
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#4b5563', marginTop: 8 }}>
            Sua API Key é armazenada apenas localmente no seu navegador.
          </p>
        </div>

        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 13, color: '#06b6d4', textDecoration: 'none' }}
        >
          Obter API Key gratuita → aistudio.google.com ↗
        </a>
      </div>

      {/* Defaults Section */}
      <div style={{
        background: '#0d1117', border: '1px solid #1f2937',
        borderRadius: 12, padding: 28, marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>⚙️</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f9fafb' }}>Padrões Globais</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>
              WhatsApp padrão (com DDI+DDD)
            </label>
            <input
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="5511999990000"
            />
            <p style={{ fontSize: 12, color: '#4b5563', marginTop: 6 }}>
              Será pré-preenchido nos novos projetos.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>
              URL de Checkout padrão
            </label>
            <input
              value={checkoutUrl}
              onChange={e => setCheckoutUrl(e.target.value)}
              placeholder="https://pay.hotmart.com/..."
            />
            <p style={{ fontSize: 12, color: '#4b5563', marginTop: 6 }}>
              URL padrão para o botão de compra nas páginas geradas.
            </p>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div style={{
        background: '#0d1117', border: '1px solid #1f2937',
        borderRadius: 12, padding: 28, marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>ℹ️</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f9fafb' }}>Sobre o PageCraft</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Versão', value: '1.0.0' },
            { label: 'Modelo IA', value: 'Google Gemini 1.5 Flash' },
            { label: 'Framework', value: 'React 18 + Vite' },
            { label: 'Desenvolvido por', value: 'GODTIME.AI' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0',
              borderBottom: i < 3 ? '1px solid #1f2937' : 'none'
            }}>
              <span style={{ fontSize: 14, color: '#6b7280' }}>{item.label}</span>
              <span style={{ fontSize: 14, color: '#9ca3af', fontFamily: item.label === 'Versão' ? 'JetBrains Mono, monospace' : 'inherit' }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{
        background: 'rgba(239,68,68,0.05)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 12, padding: 28, marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>Zona de Perigo</h2>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleClearData}
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
              padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🗑 Limpar todos os projetos
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
              padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🚪 Fazer logout
          </button>
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          style={{
            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
            color: 'white', border: 'none',
            padding: '13px 32px', borderRadius: 8, fontWeight: 700, fontSize: 15,
            cursor: 'pointer'
          }}
        >
          Salvar Configurações
        </button>
      </div>
    </div>
  )
}

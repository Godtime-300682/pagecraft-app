import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!apiKey.trim()) {
      setError('Por favor, insira sua API Key.')
      return
    }
    setLoading(true)
    setError('')
    // Save and go — validation happens on first use
    localStorage.setItem('geminiKey', apiKey.trim())
    setTimeout(() => navigate('/dashboard'), 400)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#030712',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        pointerEvents: 'none'
      }} />

      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: '10%', left: '15%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '10%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
            borderRadius: 16,
            marginBottom: 20,
            boxShadow: '0 0 30px rgba(6,182,212,0.3)'
          }}>
            <span style={{ fontSize: 32 }}>⚡</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#4b5563', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600 }}>
              GODTIME.AI
            </span>
          </div>
          <h1 style={{
            fontSize: 40,
            fontWeight: 900,
            letterSpacing: '-1.5px',
            lineHeight: 1,
            marginBottom: 12
          }}>
            <span style={{ color: '#f9fafb' }}>PAGE</span>
            <span style={{ color: '#06b6d4', textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>CRAFT</span>
          </h1>
          <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.6 }}>
            Sua fábrica de páginas de vendas com IA
          </p>
        </div>

        {/* Feature bullets */}
        <div style={{
          background: 'rgba(6,182,212,0.05)',
          border: '1px solid rgba(6,182,212,0.15)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 28
        }}>
          {[
            '📄 Páginas de vendas completas com copy + HTML',
            '🎬 Scripts VSL prontos para gravar',
            '🎨 Criativos para Meta Ads e Google Ads'
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 0',
              fontSize: 14,
              color: '#9ca3af',
              borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none'
            }}>
              {item}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: '#0d1117',
          border: '1px solid #1f2937',
          borderRadius: 16,
          padding: 32
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#f9fafb' }}>
            Bem-vindo de volta
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
            Insira sua API Key do Google Gemini para começar
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#9ca3af',
                marginBottom: 8
              }}>
                Google Gemini API Key
              </label>
              <input
                type="password"
                placeholder="AIza..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                style={{
                  background: '#030712',
                  border: '1px solid #1f2937',
                  color: '#e5e7eb',
                  borderRadius: 8,
                  padding: '12px 14px',
                  width: '100%',
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#06b6d4'}
                onBlur={e => e.target.style.borderColor = '#1f2937'}
              />
              {error && (
                <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#1f2937' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                color: loading ? '#6b7280' : 'white',
                border: 'none',
                padding: '13px 24px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                    <circle cx="12" cy="12" r="10" stroke="#6b7280" strokeWidth="3" fill="none" strokeDasharray="50" strokeDashoffset="15" strokeLinecap="round"/>
                  </svg>
                  Conectando...
                </>
              ) : 'Entrar no PageCraft →'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 13,
                color: '#06b6d4',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              Obter API Key gratuita → aistudio.google.com
            </a>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#374151', marginTop: 24 }}>
          Sua API Key é armazenada localmente no navegador. Nunca enviamos para servidores externos.
        </p>
      </div>
    </div>
  )
}

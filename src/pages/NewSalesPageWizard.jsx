import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepWizard from '../components/StepWizard'
import LoadingSpinner from '../components/LoadingSpinner'
import { generateWithGemini } from '../lib/gemini'
import { strategyPrompt, heroPrompt, sectionPrompt } from '../lib/prompts'
import { generateHtml } from '../lib/htmlExporter'
import useStore from '../store/useStore'

const STEPS = ['Briefing', 'Estratégia', 'Copy', 'Design', 'Exportar']

const COLOR_PRESETS = [
  { name: 'Azul Profundo', bg: '#1e40af', accent: '#3b82f6' },
  { name: 'Verde Esmeralda', bg: '#065f46', accent: '#10b981' },
  { name: 'Violeta', bg: '#6d28d9', accent: '#8b5cf6' },
  { name: 'Vermelho', bg: '#991b1b', accent: '#ef4444' },
  { name: 'Indigo', bg: '#312e81', accent: '#6366f1' },
  { name: 'Grafite', bg: '#111827', accent: '#374151' },
]

const COPY_SECTIONS = [
  { key: 'hero', label: 'Hero (3 variações)' },
  { key: 'problema', label: 'Problema' },
  { key: 'amplificacao', label: 'Amplificação da Dor' },
  { key: 'historia', label: 'História e Autoridade' },
  { key: 'mecanismo', label: 'Mecanismo Único' },
  { key: 'transformacao', label: 'Transformação' },
  { key: 'para-quem', label: 'Para Quem É' },
  { key: 'oferta', label: 'Oferta / Value Stack' },
  { key: 'depoimentos', label: 'Depoimentos' },
  { key: 'faq', label: 'FAQ (8 perguntas)' },
  { key: 'garantia', label: 'Garantia' },
  { key: 'cta-final', label: 'CTA Final' },
  { key: 'footer', label: 'Footer' },
]

const emptyBriefing = {
  produto: '', descricao: '', preco: '', publico: '',
  tom: 'Autoritário e Direto', whatsapp: '', checkoutUrl: '',
  provas: []
}

function parseJsonSafe(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch {}
  return null
}

export default function NewSalesPageWizard() {
  const [step, setStep] = useState(0)
  const [briefing, setBriefing] = useState(emptyBriefing)
  const [strategy, setStrategy] = useState(null)
  const [strategyLoading, setStrategyLoading] = useState(false)
  const [copy, setCopy] = useState({})
  const [copyProgress, setCopyProgress] = useState({})
  const [generatingCopy, setGeneratingCopy] = useState(false)
  const [colorPreset, setColorPreset] = useState('Azul Profundo')
  const [photos, setPhotos] = useState({})
  const [exportedHtml, setExportedHtml] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [expandedSection, setExpandedSection] = useState(null)
  const { addProject } = useStore()
  const navigate = useNavigate()

  const toggleProva = (prova) => {
    setBriefing(b => ({
      ...b,
      provas: b.provas.includes(prova)
        ? b.provas.filter(p => p !== prova)
        : [...b.provas, prova]
    }))
  }

  // Step 1 → 2: Generate strategy
  const handleBriefingNext = async () => {
    if (!briefing.produto || !briefing.descricao || !briefing.publico) {
      setError('Preencha ao menos: Nome do Produto, Descrição e Público-Alvo.')
      return
    }
    setError('')
    setStep(1)
    setStrategyLoading(true)
    try {
      const raw = await generateWithGemini(strategyPrompt(briefing))
      const parsed = parseJsonSafe(raw)
      setStrategy(parsed || { framework: 'PASTOR', big_idea: raw, promessa_principal: '', objecoes_principais: [], gatilhos_mentais: [] })
    } catch (e) {
      setError('Erro ao conectar ao Gemini: ' + e.message)
    } finally {
      setStrategyLoading(false)
    }
  }

  // Step 2 → 3: Generate all copy sections
  const handleApproveStrategy = async () => {
    setStep(2)
    setGeneratingCopy(true)
    const newCopy = {}
    for (const section of COPY_SECTIONS) {
      setCopyProgress(prev => ({ ...prev, [section.key]: 'loading' }))
      try {
        let prompt
        if (section.key === 'hero') {
          prompt = heroPrompt(briefing, strategy)
        } else {
          prompt = sectionPrompt(section.key, briefing, strategy)
        }
        const result = await generateWithGemini(prompt)
        if (section.key === 'hero' || section.key === 'faq') {
          newCopy[section.key] = parseJsonSafe(result) || result
        } else {
          newCopy[section.key] = result
        }
        setCopyProgress(prev => ({ ...prev, [section.key]: 'done' }))
        setCopy({ ...newCopy })
      } catch {
        newCopy[section.key] = '(erro ao gerar — tente regenerar)'
        setCopyProgress(prev => ({ ...prev, [section.key]: 'error' }))
        setCopy({ ...newCopy })
      }
    }
    setGeneratingCopy(false)
  }

  const regenerateSection = async (key) => {
    setCopyProgress(prev => ({ ...prev, [key]: 'loading' }))
    try {
      let prompt
      if (key === 'hero') {
        prompt = heroPrompt(briefing, strategy)
      } else {
        prompt = sectionPrompt(key, briefing, strategy)
      }
      const result = await generateWithGemini(prompt)
      setCopy(prev => ({
        ...prev,
        [key]: (key === 'hero' || key === 'faq') ? (parseJsonSafe(result) || result) : result
      }))
      setCopyProgress(prev => ({ ...prev, [key]: 'done' }))
    } catch {
      setCopyProgress(prev => ({ ...prev, [key]: 'error' }))
    }
  }

  // Step 4 → 5: Generate HTML
  const handleGenerateHtml = () => {
    const html = generateHtml(copy, {
      colorPreset,
      whatsapp: briefing.whatsapp,
      checkoutUrl: briefing.checkoutUrl,
      produto: briefing.produto
    }, photos)
    setExportedHtml(html)
    setStep(4)
  }

  const handleDownload = () => {
    const blob = new Blob([exportedHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${briefing.produto.replace(/\s+/g, '-').toLowerCase() || 'pagina'}-vendas.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePreview = () => {
    const blob = new Blob([exportedHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const handleSave = () => {
    const project = {
      id: Date.now().toString(),
      name: briefing.produto,
      description: briefing.descricao,
      type: 'page',
      status: 'completed',
      createdAt: new Date().toISOString(),
      briefing,
      strategy,
      copy,
      colorPreset
    }
    addProject(project)
    setSaved(true)
  }

  const handlePhotoUpload = (key, e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotos(prev => ({ ...prev, [key]: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f9fafb', marginBottom: 8 }}>
          Nova Página de Vendas
        </h1>
        <p style={{ color: '#6b7280', fontSize: 15 }}>
          Crie uma página completa em 5 passos com o poder do Gemini AI
        </p>
      </div>

      <StepWizard steps={STEPS} currentStep={step} />

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 24,
          color: '#ef4444',
          fontSize: 14
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* =========== STEP 0: BRIEFING =========== */}
      {step === 0 && (
        <div className="animate-fade-in">
          <div style={{
            background: '#0d1117',
            border: '1px solid #1f2937',
            borderRadius: 12,
            padding: 32
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: '#f9fafb' }}>
              📋 Briefing do Produto
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>
                  Nome do Produto / Serviço *
                </label>
                <input
                  value={briefing.produto}
                  onChange={e => setBriefing(b => ({ ...b, produto: e.target.value }))}
                  placeholder="Ex: Método Conversão Total, Curso Renda Digital..."
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>
                  Descrição completa *
                </label>
                <textarea
                  value={briefing.descricao}
                  onChange={e => setBriefing(b => ({ ...b, descricao: e.target.value }))}
                  placeholder="Descreva seu produto em detalhes: o que é, como funciona, diferenciais, resultados..."
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>
                  Preço / Ticket
                </label>
                <input
                  value={briefing.preco}
                  onChange={e => setBriefing(b => ({ ...b, preco: e.target.value }))}
                  placeholder="Ex: R$ 997 ou 12x de R$ 97"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>
                  Tom de Voz
                </label>
                <select
                  value={briefing.tom}
                  onChange={e => setBriefing(b => ({ ...b, tom: e.target.value }))}
                >
                  <option>Autoritário e Direto</option>
                  <option>Empático e Acolhedor</option>
                  <option>Técnico e Profissional</option>
                  <option>Energético e Motivacional</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>
                  Público-Alvo *
                </label>
                <textarea
                  value={briefing.publico}
                  onChange={e => setBriefing(b => ({ ...b, publico: e.target.value }))}
                  placeholder="Descreva seu cliente ideal: idade, profissão, dores, desejos, objeções..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>
                  WhatsApp (com DDD)
                </label>
                <input
                  value={briefing.whatsapp}
                  onChange={e => setBriefing(b => ({ ...b, whatsapp: e.target.value }))}
                  placeholder="5511999990000"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>
                  Link de Agendamento / Checkout
                </label>
                <input
                  value={briefing.checkoutUrl}
                  onChange={e => setBriefing(b => ({ ...b, checkoutUrl: e.target.value }))}
                  placeholder="https://pay.hotmart.com/..."
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 12 }}>
                  Provas Sociais disponíveis
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {['Depoimentos', 'Números', 'Mídia', 'Certificações', 'História pessoal'].map(prova => (
                    <label key={prova} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      cursor: 'pointer',
                      background: briefing.provas.includes(prova) ? 'rgba(6,182,212,0.1)' : '#030712',
                      border: `1px solid ${briefing.provas.includes(prova) ? 'rgba(6,182,212,0.4)' : '#1f2937'}`,
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontSize: 13,
                      color: briefing.provas.includes(prova) ? '#06b6d4' : '#6b7280',
                      transition: 'all 0.15s'
                    }}>
                      <input
                        type="checkbox"
                        checked={briefing.provas.includes(prova)}
                        onChange={() => toggleProva(prova)}
                        style={{ width: 'auto', accentColor: '#06b6d4' }}
                      />
                      {prova}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleBriefingNext}
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  color: 'white',
                  border: 'none',
                  padding: '13px 28px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                Analisar com IA →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========== STEP 1: STRATEGY =========== */}
      {step === 1 && (
        <div className="animate-fade-in">
          {strategyLoading ? (
            <div style={{
              background: '#0d1117',
              border: '1px solid #1f2937',
              borderRadius: 12,
              padding: 64,
              textAlign: 'center'
            }}>
              <LoadingSpinner size={48} text="Analisando seu briefing com IA..." />
              <p style={{ color: '#4b5563', marginTop: 16, fontSize: 14 }}>
                O Gemini está selecionando o melhor framework e criando sua estratégia...
              </p>
            </div>
          ) : strategy ? (
            <div style={{
              background: '#0d1117',
              border: '1px solid #1f2937',
              borderRadius: 12,
              padding: 32
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{
                  background: 'rgba(6,182,212,0.15)',
                  border: '1px solid rgba(6,182,212,0.3)',
                  borderRadius: 8,
                  padding: '4px 14px',
                  fontSize: 13,
                  color: '#06b6d4',
                  fontWeight: 700
                }}>
                  Framework: {strategy.framework}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {strategy.justificativa && (
                  <div style={{ gridColumn: '1 / -1', background: '#030712', border: '1px solid #1f2937', borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#4b5563', marginBottom: 10 }}>Por que este framework</div>
                    <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7 }}>{strategy.justificativa}</p>
                  </div>
                )}

                {strategy.big_idea && (
                  <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#06b6d4', marginBottom: 10 }}>Big Idea</div>
                    <p style={{ fontSize: 14, color: '#e5e7eb', lineHeight: 1.6 }}>{strategy.big_idea}</p>
                  </div>
                )}

                {strategy.promessa_principal && (
                  <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#22c55e', marginBottom: 10 }}>Promessa Principal</div>
                    <p style={{ fontSize: 14, color: '#e5e7eb', lineHeight: 1.6 }}>{strategy.promessa_principal}</p>
                  </div>
                )}

                {strategy.mapa_pagina && (
                  <div style={{ gridColumn: '1 / -1', background: '#030712', border: '1px solid #1f2937', borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#4b5563', marginBottom: 12 }}>Mapa da Página</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {strategy.mapa_pagina.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#9ca3af' }}>
                          <span style={{ color: '#06b6d4', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {strategy.angulos_copy && (
                  <div style={{ background: '#030712', border: '1px solid #1f2937', borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#4b5563', marginBottom: 12 }}>Ângulos de Copy</div>
                    {strategy.angulos_copy.map((a, i) => (
                      <div key={i} style={{ fontSize: 14, color: '#9ca3af', marginBottom: 8, paddingLeft: 12, borderLeft: '2px solid #a855f7' }}>{a}</div>
                    ))}
                  </div>
                )}

                {strategy.gatilhos_mentais && (
                  <div style={{ background: '#030712', border: '1px solid #1f2937', borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#4b5563', marginBottom: 12 }}>Gatilhos Mentais</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {strategy.gatilhos_mentais.map((g, i) => (
                        <span key={i} style={{
                          background: 'rgba(168,85,247,0.1)',
                          border: '1px solid rgba(168,85,247,0.2)',
                          color: '#a855f7',
                          padding: '4px 10px',
                          borderRadius: 100,
                          fontSize: 12,
                          fontWeight: 600
                        }}>{g}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep(0)} style={{ background: 'none', border: '1px solid #374151', color: '#6b7280', padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}>
                  ← Voltar
                </button>
                <button
                  onClick={handleApproveStrategy}
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                    color: 'white', border: 'none',
                    padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer'
                  }}
                >
                  Aprovar Estratégia →
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* =========== STEP 2: COPY =========== */}
      {step === 2 && (
        <div className="animate-fade-in">
          <div style={{
            background: '#0d1117',
            border: '1px solid #1f2937',
            borderRadius: 12,
            padding: 32
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f9fafb' }}>
                ✍️ Gerando Copy Completo
              </h2>
              {generatingCopy && <LoadingSpinner size={20} text="Gerando seções..." />}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {COPY_SECTIONS.map((section) => {
                const status = copyProgress[section.key]
                const content = copy[section.key]
                const isExpanded = expandedSection === section.key

                return (
                  <div key={section.key} style={{
                    border: '1px solid #1f2937',
                    borderRadius: 10,
                    overflow: 'hidden'
                  }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '14px 16px',
                        cursor: status === 'done' ? 'pointer' : 'default',
                        background: '#030712'
                      }}
                      onClick={() => status === 'done' && setExpandedSection(isExpanded ? null : section.key)}
                    >
                      <div style={{ flexShrink: 0 }}>
                        {status === 'done' && <span style={{ color: '#22c55e' }}>✓</span>}
                        {status === 'loading' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite' }}>
                            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                            <circle cx="12" cy="12" r="10" stroke="#06b6d4" strokeWidth="3" fill="none" strokeDasharray="50" strokeDashoffset="15" strokeLinecap="round"/>
                          </svg>
                        )}
                        {status === 'error' && <span style={{ color: '#ef4444' }}>✗</span>}
                        {!status && <span style={{ color: '#4b5563' }}>○</span>}
                      </div>
                      <span style={{
                        flex: 1, fontSize: 14, fontWeight: 500,
                        color: status === 'done' ? '#e5e7eb' : status === 'loading' ? '#06b6d4' : '#6b7280'
                      }}>
                        {section.label}
                      </span>
                      {status === 'done' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); regenerateSection(section.key) }}
                          style={{
                            background: 'rgba(6,182,212,0.1)',
                            border: '1px solid rgba(6,182,212,0.2)',
                            color: '#06b6d4',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            cursor: 'pointer'
                          }}
                        >
                          Regenerar
                        </button>
                      )}
                      {status === 'done' && (
                        <span style={{ color: '#4b5563', fontSize: 18 }}>{isExpanded ? '▲' : '▼'}</span>
                      )}
                    </div>

                    {isExpanded && content && (
                      <div style={{ padding: 16, borderTop: '1px solid #1f2937', background: '#0d1117' }}>
                        {typeof content === 'string' ? (
                          <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
                            {content}
                          </p>
                        ) : (
                          <pre style={{
                            fontSize: 13, color: '#9ca3af', lineHeight: 1.6,
                            whiteSpace: 'pre-wrap', margin: 0,
                            fontFamily: 'JetBrains Mono, monospace'
                          }}>
                            {JSON.stringify(content, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {!generatingCopy && Object.keys(copy).length > 0 && (
              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: '1px solid #374151', color: '#6b7280', padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}>
                  ← Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                    color: 'white', border: 'none',
                    padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer'
                  }}
                >
                  Aprovar Copy →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========== STEP 3: DESIGN =========== */}
      {step === 3 && (
        <div className="animate-fade-in">
          <div style={{
            background: '#0d1117',
            border: '1px solid #1f2937',
            borderRadius: 12,
            padding: 32
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 28, color: '#f9fafb' }}>
              🎨 Design e Identidade Visual
            </h2>

            {/* Color presets */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 16 }}>
                Paleta de Cores
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setColorPreset(preset.name)}
                    style={{
                      border: `2px solid ${colorPreset === preset.name ? preset.accent : '#1f2937'}`,
                      borderRadius: 10,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: 'transparent',
                      padding: 0
                    }}
                  >
                    <div style={{ height: 40, background: `linear-gradient(135deg, ${preset.bg}, ${preset.accent})` }} />
                    <div style={{ padding: '8px 12px', background: '#030712', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, color: colorPreset === preset.name ? '#e5e7eb' : '#6b7280', fontWeight: colorPreset === preset.name ? 600 : 400 }}>
                        {preset.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 16 }}>
                Fotos (opcional)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {[
                  { key: 'hero', label: 'Foto Hero' },
                  { key: 'casual', label: 'Foto Casual' },
                  { key: 'autoridade', label: 'Foto Autoridade' },
                  { key: 'cta', label: 'Foto CTA' }
                ].map(p => (
                  <label key={p.key} style={{ cursor: 'pointer' }}>
                    <div style={{
                      border: '2px dashed #1f2937',
                      borderRadius: 10,
                      height: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: photos[p.key] ? 'transparent' : '#030712',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#374151'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#1f2937'}
                    >
                      {photos[p.key] ? (
                        <img src={photos[p.key]} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <>
                          <span style={{ fontSize: 28 }}>📸</span>
                          <span style={{ fontSize: 12, color: '#4b5563', textAlign: 'center' }}>{p.label}</span>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={e => handlePhotoUpload(p.key, e)} style={{ display: 'none' }} />
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(2)} style={{ background: 'none', border: '1px solid #374151', color: '#6b7280', padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}>
                ← Voltar
              </button>
              <button
                onClick={handleGenerateHtml}
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  color: 'white', border: 'none',
                  padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer'
                }}
              >
                Gerar HTML →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========== STEP 4: EXPORT =========== */}
      {step === 4 && (
        <div className="animate-fade-in">
          <div style={{
            background: '#0d1117',
            border: '1px solid #1f2937',
            borderRadius: 12,
            padding: 32,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#f9fafb' }}>
              Sua página está pronta!
            </h2>
            <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 32 }}>
              Arquivo HTML completo com todos os elementos de conversão gerado com sucesso.
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
              {[
                { label: 'Seções de copy', value: COPY_SECTIONS.length, color: '#06b6d4' },
                { label: 'Elementos de conversão', value: 9, color: '#22c55e' },
                { label: 'Paleta selecionada', value: colorPreset, color: '#a855f7' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: '#030712',
                  border: '1px solid #1f2937',
                  borderRadius: 10,
                  padding: '16px 24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Included features */}
            <div style={{
              background: '#030712',
              border: '1px solid #1f2937',
              borderRadius: 10,
              padding: '20px 24px',
              marginBottom: 32,
              textAlign: 'left'
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#4b5563', marginBottom: 14 }}>
                Elementos incluídos na página
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  '⏰ Countdown timer', '💬 Botão WhatsApp',
                  '📌 Sticky CTA mobile', '🎉 Social proof toast',
                  '🚪 Exit intent popup', '🍪 Banner LGPD',
                  '❓ FAQ accordion', '🔗 UTM passthrough',
                  '📊 GTM placeholder', '📈 Meta Pixel placeholder'
                ].map((f, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#22c55e' }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleDownload}
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  color: 'white', border: 'none',
                  padding: '14px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                ⬇️ Baixar index.html
              </button>
              <button
                onClick={handlePreview}
                style={{
                  background: 'rgba(168,85,247,0.1)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  color: '#a855f7',
                  padding: '14px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                👁 Ver no Navegador
              </button>
              <button
                onClick={handleSave}
                disabled={saved}
                style={{
                  background: saved ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.1)',
                  border: `1px solid ${saved ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.3)'}`,
                  color: '#22c55e',
                  padding: '14px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15,
                  cursor: saved ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                {saved ? '✓ Projeto Salvo' : '💾 Salvar Projeto'}
              </button>
            </div>

            {saved && (
              <div style={{ marginTop: 20 }}>
                <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontSize: 14 }}>
                  Ver todos os projetos →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

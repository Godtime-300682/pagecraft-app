import { useState, useRef } from 'react'
import { generateWithGemini } from '../lib/gemini'
import { vslPrompt } from '../lib/prompts'
import useStore from '../store/useStore'
import LoadingSpinner from '../components/LoadingSpinner'

const SECTION_COLORS = {
  'Hook': '#ef4444',
  'Promessa': '#f97316',
  'Credenciais': '#eab308',
  'Problema': '#a855f7',
  'Agravamento': '#ec4899',
  'História': '#06b6d4',
  'Solução/Revelação': '#22c55e',
  'Prova': '#3b82f6',
  'Oferta + Value Stack': '#10b981',
  'Garantia': '#14b8a6',
  'CTA + Urgência': '#f43f5e',
  'Close': '#8b5cf6',
}

function sectionColor(nome) {
  return SECTION_COLORS[nome] || '#06b6d4'
}

function parseVslJson(raw) {
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch {}
  return null
}

/* ─── canvas / video utilities ──────────────────────── */
function easeOut(t) { return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3) }

function wrapLines(ctx, text, maxWidth) {
  if (!text) return []
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawVSLFrame(ctx, section, progress, W, H) {
  const color = sectionColor(section.nome)
  const PAD = 80

  /* background */
  ctx.fillStyle = '#030712'
  ctx.fillRect(0, 0, W, H)

  /* radial glow */
  const rg = ctx.createRadialGradient(W * 0.15, H * 0.15, 0, W * 0.5, H * 0.5, W * 0.7)
  rg.addColorStop(0, color + '18')
  rg.addColorStop(1, 'transparent')
  ctx.fillStyle = rg
  ctx.fillRect(0, 0, W, H)

  /* grid */
  ctx.strokeStyle = 'rgba(255,255,255,0.022)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = 0; y < H; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

  /* top accent bar — animates to full width */
  const barP = easeOut(Math.min(1, progress / 0.12))
  const barGrd = ctx.createLinearGradient(0, 0, W, 0)
  barGrd.addColorStop(0, color)
  barGrd.addColorStop(1, color + '44')
  ctx.fillStyle = barGrd
  ctx.fillRect(0, 0, W * barP, 7)

  /* left accent stripe */
  const lgrd = ctx.createLinearGradient(0, 0, 0, H)
  lgrd.addColorStop(0, color + '00')
  lgrd.addColorStop(0.5, color + '99')
  lgrd.addColorStop(1, color + '00')
  ctx.fillStyle = lgrd
  ctx.fillRect(0, 0, 5, H)

  /* section title — slides in from left */
  const titleP = easeOut(Math.min(1, Math.max(0, (progress - 0.08) / 0.22)))
  const titleX = PAD + (1 - titleP) * -220
  ctx.globalAlpha = titleP
  ctx.font = 'bold 58px Inter, Arial, sans-serif'
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.fillText(section.nome.toUpperCase(), titleX, 110)

  /* time badge */
  if (section.tempo_estimado) {
    ctx.font = '500 22px JetBrains Mono, monospace'
    ctx.fillStyle = color + 'aa'
    ctx.fillText(section.tempo_estimado, PAD + (1 - titleP) * -220, 148)
  }
  ctx.globalAlpha = 1

  /* divider line below title */
  const divP = easeOut(Math.min(1, Math.max(0, (progress - 0.28) / 0.15)))
  ctx.globalAlpha = divP
  const divGrd = ctx.createLinearGradient(PAD, 0, W - PAD, 0)
  divGrd.addColorStop(0, color)
  divGrd.addColorStop(1, color + '00')
  ctx.strokeStyle = divGrd
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(PAD, 170); ctx.lineTo(PAD + (W - PAD * 2) * divP, 170); ctx.stroke()
  ctx.globalAlpha = 1

  /* script text — word-by-word reveal */
  const textStartP = 0.35
  const textProgress = Math.max(0, (progress - textStartP) / (0.95 - textStartP))

  if (textProgress > 0 && section.roteiro) {
    const words = section.roteiro.split(' ')
    const visibleWords = Math.ceil(words.length * textProgress)
    const visibleText = words.slice(0, visibleWords).join(' ')

    ctx.font = '30px Inter, Arial, sans-serif'
    const lines = wrapLines(ctx, visibleText, W - PAD * 2)
    const maxLines = 9
    const lineH = 50
    let y = 215

    lines.slice(0, maxLines).forEach((line, li) => {
      const lineAlpha = li === lines.length - 1 ? Math.min(1, textProgress * words.length % 1 + 0.2) : 1
      ctx.globalAlpha = Math.min(1, lineAlpha)
      ctx.fillStyle = '#e5e7eb'
      ctx.fillText(line, PAD, y)
      ctx.globalAlpha = 1
      y += lineH
    })

    if (lines.length > maxLines) {
      ctx.font = '22px Inter, Arial, sans-serif'
      ctx.fillStyle = color + '88'
      ctx.fillText(`+ ${lines.length - maxLines} linhas...`, PAD, y + 10)
    }
  }

  /* production note */
  if (section.notas_producao && progress > 0.7) {
    const noteA = easeOut(Math.min(1, (progress - 0.7) / 0.15))
    ctx.globalAlpha = noteA * 0.75
    const noteY = H - 90
    ctx.font = 'italic 22px Inter, Arial, sans-serif'
    ctx.fillStyle = '#eab308'
    ctx.fillText('📹 ' + section.notas_producao.slice(0, 110) + (section.notas_producao.length > 110 ? '…' : ''), PAD, noteY)
    ctx.globalAlpha = 1
  }

  /* bottom progress bar */
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fillRect(0, H - 5, W, 5)
  ctx.fillStyle = color + 'cc'
  ctx.fillRect(0, H - 5, W * progress, 5)

  /* brand mark */
  ctx.font = 'bold 18px Inter, Arial, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.textAlign = 'right'
  ctx.fillText('PAGECRAFT.AI', W - PAD, H - 20)
  ctx.textAlign = 'left'

  /* fade out at end of section */
  if (progress > 0.88) {
    ctx.fillStyle = `rgba(3,7,18,${((progress - 0.88) / 0.12).toFixed(3)})`
    ctx.fillRect(0, 0, W, H)
  }
}

async function renderVSLVideo(secoes, secsPerSection, onProgress) {
  const W = 1280, H = 720
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm'

  const stream = canvas.captureStream(30)
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 })
  const chunks = []
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

  return new Promise((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime }))
    recorder.onerror = reject
    recorder.start()

    const totalMs = secoes.length * secsPerSection * 1000
    const startTime = performance.now()

    function tick(now) {
      const elapsed = now - startTime
      if (elapsed >= totalMs) {
        recorder.stop()
        return
      }
      const secIdx = Math.min(Math.floor(elapsed / (secsPerSection * 1000)), secoes.length - 1)
      const secElapsed = elapsed - secIdx * secsPerSection * 1000
      const progress = secElapsed / (secsPerSection * 1000)

      drawVSLFrame(ctx, secoes[secIdx], progress, W, H)
      onProgress(Math.min(1, elapsed / totalMs))
      requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  })
}

/* ─── component ──────────────────────────────────────── */
export default function VSLCreatorPage() {
  const [form, setForm] = useState({
    produto: '', publico: '', duracao: '10', tom: 'Autoritário e Direto', descricao: '', preco: ''
  })
  const [loading, setLoading] = useState(false)
  const [vsl, setVsl] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const { addProject } = useStore()

  /* video state */
  const [videoState, setVideoState] = useState('idle') // idle | rendering | done
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState(null)
  const [secsPerSection, setSecsPerSection] = useState(10)
  const videoBlobRef = useRef(null)

  const handleGenerate = async () => {
    if (!form.produto || !form.publico) { setError('Preencha o nome do produto e o público-alvo.'); return }
    setError(''); setLoading(true); setVsl(null); setVideoState('idle'); setVideoUrl(null)
    try {
      const raw = await generateWithGemini(vslPrompt(form))
      const parsed = parseVslJson(raw)
      setVsl(parsed || { titulo_vsl: form.produto, secoes: [{ nome: 'Script', roteiro: raw }], duracao_estimada: `${form.duracao} min` })
    } catch (e) {
      setError('Erro ao gerar VSL: ' + e.message)
    } finally { setLoading(false) }
  }

  const handleRenderVideo = async () => {
    if (!vsl?.secoes?.length) return
    setVideoState('rendering')
    setVideoProgress(0)
    try {
      await document.fonts.ready
      const blob = await renderVSLVideo(vsl.secoes, secsPerSection, p => setVideoProgress(p))
      videoBlobRef.current = blob
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)
      setVideoState('done')
    } catch (e) {
      setError('Erro ao gerar vídeo: ' + e.message)
      setVideoState('idle')
    }
  }

  const downloadVideo = () => {
    if (!videoBlobRef.current) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(videoBlobRef.current)
    a.download = `vsl-${(form.produto || 'video').replace(/\s+/g, '-').toLowerCase()}.webm`
    a.click()
  }

  const totalWords = vsl?.secoes?.reduce((acc, s) => acc + (s.roteiro?.split(' ').length || 0), 0) || 0
  const estimatedDuration = Math.round(vsl?.secoes?.length * secsPerSection || 0)

  const handleSave = () => {
    addProject({ id: Date.now().toString(), name: vsl?.titulo_vsl || form.produto, description: form.publico, type: 'vsl', status: 'completed', createdAt: new Date().toISOString(), data: vsl })
    setSaved(true)
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 100, padding: '4px 14px', fontSize: 12, color: '#a855f7', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>
          🎬 VSL Creator
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f9fafb', marginBottom: 8 }}>Gerador de Vídeo VSL</h1>
        <p style={{ color: '#6b7280', fontSize: 15 }}>Script + vídeo WebM gerado por IA — pronto para gravar ou usar como apresentação</p>
      </div>

      {/* Form */}
      {!vsl && (
        <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 12, padding: 32 }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#ef4444', fontSize: 14 }}>⚠️ {error}</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>Nome do Produto *</label>
              <input value={form.produto} onChange={e => setForm(f => ({ ...f, produto: e.target.value }))} placeholder="Ex: Método X, Curso Y..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>Público-Alvo *</label>
              <textarea value={form.publico} onChange={e => setForm(f => ({ ...f, publico: e.target.value }))} placeholder="Descreva quem vai assistir o VSL..." rows={3} style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>Descrição do Produto</label>
              <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="O que o produto entrega..." rows={2} style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>Preço</label>
              <input value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} placeholder="R$ 997" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>Duração alvo</label>
              <select value={form.duracao} onChange={e => setForm(f => ({ ...f, duracao: e.target.value }))}>
                <option value="5">5 minutos</option>
                <option value="10">10 minutos</option>
                <option value="15">15 minutos</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>Tom de Voz</label>
              <select value={form.tom} onChange={e => setForm(f => ({ ...f, tom: e.target.value }))}>
                <option>Autoritário e Direto</option>
                <option>Empático e Acolhedor</option>
                <option>Técnico e Profissional</option>
                <option>Energético e Motivacional</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleGenerate} disabled={loading} style={{ background: loading ? '#1f2937' : 'linear-gradient(135deg, #a855f7, #7c3aed)', color: loading ? '#6b7280' : 'white', border: 'none', padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              {loading ? <><LoadingSpinner size={18} color="#6b7280" /> Gerando script...</> : '🎬 Gerar Script VSL'}
            </button>
          </div>
        </div>
      )}

      {/* VSL Result */}
      {vsl && (
        <div>
          {/* Top bar */}
          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 12, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>{vsl.titulo_vsl}</h2>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>⏱ {vsl.duracao_estimada}</span>
                <span style={{ fontSize: 13, color: '#6b7280' }}>📝 ~{totalWords.toLocaleString()} palavras</span>
                <span style={{ fontSize: 13, color: '#6b7280' }}>📋 {vsl.secoes?.length} seções</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={handleSave} disabled={saved} style={{ background: 'rgba(34,197,94,0.1)', border: `1px solid ${saved ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.3)'}`, color: '#22c55e', padding: '8px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: saved ? 'default' : 'pointer' }}>
                {saved ? '✓ Salvo' : '💾 Salvar'}
              </button>
              <button onClick={() => { setVsl(null); setSaved(false); setVideoState('idle'); setVideoUrl(null) }} style={{ background: 'none', border: '1px solid #374151', color: '#6b7280', padding: '8px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                Novo VSL
              </button>
            </div>
          </div>

          {/* ═══ VIDEO GENERATOR ═══ */}
          <div style={{ background: '#0d1117', border: '1px solid #a855f744', borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>🎬 Gerar Vídeo WebM</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  Cada seção vira um slide animado · {vsl.secoes?.length} seções × {secsPerSection}s = ~{estimatedDuration}s de vídeo · 1280×720 · 5Mbps
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Seg. por seção</label>
                  <select value={secsPerSection} onChange={e => setSecsPerSection(+e.target.value)} style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6, color: '#f9fafb', padding: '6px 10px', fontSize: 13 }}>
                    <option value={6}>6s</option>
                    <option value={10}>10s</option>
                    <option value={15}>15s</option>
                    <option value={20}>20s</option>
                  </select>
                </div>
                {videoState === 'idle' && (
                  <button onClick={handleRenderVideo} style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    ▶ Gerar Vídeo
                  </button>
                )}
                {videoState === 'done' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={downloadVideo} style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000', border: 'none', padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      ⬇ Baixar .webm
                    </button>
                    <button onClick={() => { setVideoState('idle'); setVideoUrl(null); setVideoProgress(0) }} style={{ background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                      Regerar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Rendering progress */}
            {videoState === 'rendering' && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#a855f7' }}>⚡ Renderizando vídeo em tempo real...</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#6b7280' }}>{Math.round(videoProgress * 100)}%</span>
                </div>
                <div style={{ background: '#1f2937', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #a855f7, #06b6d4)', width: `${videoProgress * 100}%`, transition: 'width 0.3s', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: '#4b5563', marginTop: 8 }}>
                  O vídeo é renderizado em tempo real — tempo restante: ~{Math.round((1 - videoProgress) * estimatedDuration)}s
                </div>
              </div>
            )}

            {/* Video preview */}
            {videoState === 'done' && videoUrl && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: '#22c55e', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace' }}>✓ Vídeo gerado com sucesso!</div>
                <video
                  src={videoUrl}
                  controls
                  style={{ width: '100%', maxWidth: 640, borderRadius: 8, border: '1px solid #1f2937', display: 'block' }}
                />
              </div>
            )}
          </div>

          {/* Script sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {vsl.secoes?.map((secao, i) => {
              const color = sectionColor(secao.nome)
              return (
                <div key={i} style={{ background: '#0d1117', border: '1px solid #1f2937', borderLeft: `4px solid ${color}`, borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1f2937', background: `${color}08` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color, fontWeight: 700, fontSize: 15 }}>{secao.nome}</span>
                      {secao.tempo_estimado && (
                        <span style={{ fontSize: 12, color: '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}>{secao.tempo_estimado}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: '#4b5563' }}>~{secao.roteiro?.split(' ').length || 0} palavras</span>
                  </div>
                  <div style={{ padding: 20 }}>
                    <p style={{ fontSize: 15, color: '#e5e7eb', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{secao.roteiro}</p>
                    {secao.notas_producao && (
                      <div style={{ marginTop: 16, background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#eab308' }}>
                        📹 <strong>Produção:</strong> {secao.notas_producao}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {vsl.notas_gerais && (
            <div style={{ marginTop: 20, background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#06b6d4', marginBottom: 10 }}>Notas Gerais</div>
              <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.6 }}>{vsl.notas_gerais}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

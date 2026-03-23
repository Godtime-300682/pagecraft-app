import { useState, useRef, useEffect, useCallback, useReducer } from 'react'
import { generateWithGemini } from '../lib/gemini'
import useStore from '../store/useStore'

/* ─── helpers ─────────────────────────────────────── */
function parseCreatives(raw) {
  try {
    const match = raw.match(/```json\s*([\s\S]*?)```|(\{[\s\S]*\})/);
    const json = match ? (match[1] || match[2]) : raw;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function buildPrompt({ modo, estilo, estrategia, guia, plataforma, especialista }) {
  return `Você é um especialista em criação de anúncios de alta conversão para redes sociais.

BRIEFING DO ANÚNCIO:
- Estratégia / Roteiro: ${estrategia}
- Plataforma: ${plataforma}
- Modo: ${modo === 'carrossel' ? 'Carrossel (múltiplos cards)' : 'Imagem Única'}
- Estilo visual: ${estilo === 'foto' ? 'Foto + Texto sobreposto (imagem real + copy)' : 'Design Pro (layout gráfico premium)'}
${guia ? `- Guia de estilo visual: ${guia}` : ''}
${especialista ? '- Incluir imagem do especialista: SIM (foto será sobreposta)' : ''}

Crie ${modo === 'carrossel' ? '5 cards de carrossel' : '3 variações de anúncio'} para ${plataforma}.

Para cada ${modo === 'carrossel' ? 'card' : 'variação'} retorne:
- headline: título principal impactante (máx 8 palavras)
- subheadline: texto secundário complementar (máx 12 palavras)
- body: copy do anúncio (2-3 linhas curtas)
- cta: chamada para ação do botão (máx 5 palavras)
- angulo: ângulo emocional usado (Dor, Desejo, Curiosidade, Prova Social, Urgência ou Autoridade)
- hook: gancho dos primeiros 3 segundos (máx 15 palavras)

Responda APENAS em JSON válido:
{
  "plataforma": "${plataforma}",
  "modo": "${modo}",
  "criativos": [
    {
      "id": 1,
      "headline": "...",
      "subheadline": "...",
      "body": "...",
      "cta": "...",
      "angulo": "...",
      "hook": "..."
    }
  ]
}`;
}

const ANGLE_COLORS = {
  'Dor':          '#ef4444',
  'Desejo':       '#22c55e',
  'Curiosidade':  '#a855f7',
  'Prova Social': '#06b6d4',
  'Urgência':     '#eab308',
  'Autoridade':   '#3b82f6',
};
function angleColor(a = '') {
  const key = Object.keys(ANGLE_COLORS).find(k => a.toLowerCase().includes(k.toLowerCase()));
  return key ? ANGLE_COLORS[key] : '#06b6d4';
}

/* ─── canvas utilities ─────────────────────────────── */
function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 5) {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  let curY = y;
  let count = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[i] + ' ';
      curY += lineHeight;
      count++;
      if (count >= maxLines - 1) {
        // last allowed line — draw remaining with ellipsis if needed
        const remaining = words.slice(i + 1).join(' ');
        const last = words[i] + (remaining ? ' ' + remaining : '');
        let truncated = last;
        while (ctx.measureText(truncated + '…').width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        ctx.fillText((truncated + (remaining ? '…' : '')).trim(), x, curY);
        curY += lineHeight;
        return curY;
      }
    } else {
      line = test;
    }
  }
  if (line.trim()) { ctx.fillText(line.trim(), x, curY); curY += lineHeight; }
  return curY;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCreativeCanvas(canvas, creative, plataforma, specialistImg) {
  const W = 1080, H = 1080;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const ac = angleColor(creative.angulo);

  // 1. Background gradient
  const bg = ctx.createLinearGradient(0, H, W, 0);
  bg.addColorStop(0, '#030712');
  bg.addColorStop(0.6, '#0d1117');
  bg.addColorStop(1, '#111827');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 2. Color radial overlay (top-left glow)
  const radial = ctx.createRadialGradient(0, 0, 0, W * 0.4, H * 0.4, W * 0.75);
  radial.addColorStop(0, ac + '22');
  radial.addColorStop(1, 'transparent');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, W, H);

  // 3. Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= W; gx += 90) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
  }
  for (let gy = 0; gy <= H; gy += 90) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }

  // 4. Top accent bar
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, ac);
  topBar.addColorStop(1, ac + '44');
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, 7);

  // 5. Platform + Angle badge (top left)
  const badgeFont = 'bold 26px Inter, Arial, sans-serif';
  ctx.font = badgeFont;
  const badgeText = plataforma.toUpperCase() + ' · ' + (creative.angulo || '').toUpperCase();
  const badgeW = ctx.measureText(badgeText).width + 40;
  roundRectPath(ctx, 50, 36, badgeW, 44, 22);
  ctx.fillStyle = ac + '22';
  ctx.fill();
  roundRectPath(ctx, 50, 36, badgeW, 44, 22);
  ctx.strokeStyle = ac + '55';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = ac;
  ctx.textAlign = 'left';
  ctx.fillText(badgeText, 70, 67);

  // 6. Specialist photo — circle, top right
  if (specialistImg) {
    const sz = 270;
    const cx = W - sz / 2 - 55;
    const cy = sz / 2 + 55;
    // Glow ring
    ctx.save();
    ctx.shadowColor = ac;
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(cx, cy, sz / 2 + 4, 0, Math.PI * 2);
    ctx.strokeStyle = ac + '66';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
    // Clip circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, sz / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(specialistImg, cx - sz / 2, cy - sz / 2, sz, sz);
    ctx.restore();
  }

  // Content layout — with or without photo
  const PAD = 60;
  const contentW = specialistImg ? W - 380 : W - PAD * 2;
  let curY = 130;

  // 7. Hook — italic, faded
  if (creative.hook) {
    ctx.font = 'italic 34px Inter, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.textAlign = 'left';
    curY = wrapText(ctx, `"${creative.hook}"`, PAD, curY, contentW, 48, 2) + 16;
  }

  // 8. Headline — large bold white
  curY += 10;
  ctx.font = 'bold 80px Inter, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  curY = wrapText(ctx, creative.headline || '', PAD, curY, contentW, 96, 3) + 20;

  // Accent bar below headline
  const aBarGrd = ctx.createLinearGradient(PAD, 0, PAD + 120, 0);
  aBarGrd.addColorStop(0, ac);
  aBarGrd.addColorStop(1, 'transparent');
  ctx.fillStyle = aBarGrd;
  ctx.fillRect(PAD, curY, 120, 5);
  curY += 28;

  // 9. Subheadline
  ctx.font = 'bold 42px Inter, Arial, sans-serif';
  ctx.fillStyle = ac;
  curY = wrapText(ctx, creative.subheadline || '', PAD, curY, contentW, 58, 2) + 18;

  // 10. Body copy
  ctx.font = '32px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.52)';
  curY = wrapText(ctx, creative.body || '', PAD, curY, contentW, 46, 4) + 30;

  // 11. CTA pill
  const ctaLabel = '  ' + (creative.cta || 'Saiba mais') + '  →';
  ctx.font = 'bold 38px Inter, Arial, sans-serif';
  const ctaW = Math.min(ctx.measureText(ctaLabel).width + 40, W - PAD * 2);
  const ctaH = 80;
  const ctaY = Math.max(curY + 10, H - 200);

  roundRectPath(ctx, PAD, ctaY, ctaW, ctaH, 40);
  ctx.fillStyle = ac;
  ctx.fill();

  // CTA text shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.fillText(ctaLabel, PAD + 20, ctaY + 54);
  ctx.restore();

  // 12. Bottom brand mark
  ctx.font = '500 22px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.textAlign = 'right';
  ctx.fillText('PAGECRAFT.AI', W - PAD, H - 38);

  // Vertical accent line (left edge decoration)
  const vGrd = ctx.createLinearGradient(0, 0, 0, H);
  vGrd.addColorStop(0, ac + '00');
  vGrd.addColorStop(0.3, ac + '88');
  vGrd.addColorStop(0.7, ac + '88');
  vGrd.addColorStop(1, ac + '00');
  ctx.fillStyle = vGrd;
  ctx.fillRect(0, 0, 4, H);

  ctx.textAlign = 'left';
}

/* ─── creative video renderer ──────────────────────── */
function easeOut(t) { return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3); }

function drawCreativeVideoFrame(ctx, creative, plataforma, specialistImg, progress) {
  const W = 1080, H = 1080;
  const ac = angleColor(creative.angulo);
  const PAD = 70;

  // Background
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, W, H);

  // Radial glow — pulses slightly
  const pulse = 0.12 + 0.03 * Math.sin(progress * Math.PI * 8);
  const rg = ctx.createRadialGradient(W * 0.25, H * 0.25, 0, W * 0.5, H * 0.5, W * 0.75);
  rg.addColorStop(0, ac + Math.round(pulse * 255).toString(16).padStart(2, '0'));
  rg.addColorStop(1, 'transparent');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.022)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Top bar — fills in 0-8% of progress
  const barP = easeOut(Math.min(1, progress / 0.08));
  const barGrd = ctx.createLinearGradient(0, 0, W, 0);
  barGrd.addColorStop(0, ac); barGrd.addColorStop(1, ac + '44');
  ctx.fillStyle = barGrd;
  ctx.fillRect(0, 0, W * barP, 7);

  // Left stripe
  const lgrd = ctx.createLinearGradient(0, 0, 0, H);
  lgrd.addColorStop(0, ac + '00'); lgrd.addColorStop(0.5, ac + '88'); lgrd.addColorStop(1, ac + '00');
  ctx.fillStyle = lgrd;
  ctx.fillRect(0, 0, 5, H);

  // Badge (10-20%)
  const badgeA = easeOut(Math.min(1, Math.max(0, (progress - 0.10) / 0.10)));
  if (badgeA > 0) {
    ctx.globalAlpha = badgeA;
    ctx.font = 'bold 28px Inter, Arial, sans-serif';
    const badgeTxt = plataforma.toUpperCase() + ' · ' + (creative.angulo || '').toUpperCase();
    const bW = ctx.measureText(badgeTxt).width + 40;
    roundRectPath(ctx, PAD, 36, bW, 44, 22);
    ctx.fillStyle = ac + '22'; ctx.fill();
    roundRectPath(ctx, PAD, 36, bW, 44, 22);
    ctx.strokeStyle = ac + '55'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = ac; ctx.textAlign = 'left';
    ctx.fillText(badgeTxt, PAD + 20, 67);
    ctx.globalAlpha = 1;
  }

  // Specialist photo (fades in 15-25%)
  if (specialistImg) {
    const imgA = easeOut(Math.min(1, Math.max(0, (progress - 0.15) / 0.10)));
    if (imgA > 0) {
      const sz = 260; const cx = W - sz / 2 - 55; const cy = sz / 2 + 55;
      ctx.globalAlpha = imgA;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, sz / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(specialistImg, cx - sz / 2, cy - sz / 2, sz, sz);
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, sz / 2, 0, Math.PI * 2);
      ctx.strokeStyle = ac + '66'; ctx.lineWidth = 4; ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  const contentW = specialistImg ? W - 380 : W - PAD * 2;
  let curY = 130;

  // Hook (15-40%)
  if (creative.hook) {
    const hookA = easeOut(Math.min(1, Math.max(0, (progress - 0.15) / 0.12)));
    if (hookA > 0) {
      ctx.globalAlpha = hookA * 0.45;
      ctx.font = 'italic 34px Inter, Arial, sans-serif';
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left';
      const hookLines = wrapLines(ctx, `"${creative.hook}"`, contentW);
      hookLines.slice(0, 2).forEach(l => { ctx.fillText(l, PAD, curY); curY += 48; });
      ctx.globalAlpha = 1;
      curY += 16;
    }
  } else {
    curY += 60;
  }

  // Headline — types in (30-65%)
  const hlP = easeOut(Math.min(1, Math.max(0, (progress - 0.30) / 0.35)));
  if (hlP > 0) {
    ctx.font = 'bold 80px Inter, Arial, sans-serif';
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left';
    const allWords = (creative.headline || '').split(' ');
    const visWords = Math.max(1, Math.ceil(allWords.length * hlP));
    const visText = allWords.slice(0, visWords).join(' ');
    const hlLines = wrapLines(ctx, visText, contentW);
    hlLines.slice(0, 3).forEach(l => { ctx.fillText(l, PAD, curY); curY += 96; });
    curY += 20;
  }

  // Accent bar (65-70%)
  const barA = easeOut(Math.min(1, Math.max(0, (progress - 0.65) / 0.07)));
  if (barA > 0) {
    const abGrd = ctx.createLinearGradient(PAD, 0, PAD + 120, 0);
    abGrd.addColorStop(0, ac); abGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = abGrd; ctx.fillRect(PAD, curY, 120 * barA, 5);
    curY += 28;
  }

  // Subheadline (68-78%)
  const shA = easeOut(Math.min(1, Math.max(0, (progress - 0.68) / 0.10)));
  if (shA > 0) {
    ctx.globalAlpha = shA;
    ctx.font = 'bold 42px Inter, Arial, sans-serif';
    ctx.fillStyle = ac; ctx.textAlign = 'left';
    const shLines = wrapLines(ctx, creative.subheadline || '', contentW);
    shLines.slice(0, 2).forEach(l => { ctx.fillText(l, PAD, curY); curY += 58; });
    ctx.globalAlpha = 1; curY += 16;
  }

  // Body (75-85%)
  const bodyA = easeOut(Math.min(1, Math.max(0, (progress - 0.75) / 0.10)));
  if (bodyA > 0) {
    ctx.globalAlpha = bodyA * 0.55;
    ctx.font = '32px Inter, Arial, sans-serif';
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left';
    const bodyLines = wrapLines(ctx, creative.body || '', contentW);
    bodyLines.slice(0, 3).forEach(l => { ctx.fillText(l, PAD, curY); curY += 46; });
    ctx.globalAlpha = 1;
  }

  // CTA pill — pulses (83-100%)
  const ctaA = easeOut(Math.min(1, Math.max(0, (progress - 0.83) / 0.08)));
  if (ctaA > 0) {
    const pulseCta = 1 + 0.04 * Math.sin((progress - 0.83) * Math.PI * 12);
    const ctaLabel = '  ' + (creative.cta || 'Saiba mais') + '  →';
    ctx.font = 'bold 38px Inter, Arial, sans-serif';
    const ctaW = ctx.measureText(ctaLabel).width + 40;
    const ctaH = 80;
    const ctaY = Math.max(curY + 20, H - 200);
    ctx.globalAlpha = ctaA;
    ctx.save();
    ctx.translate(PAD + ctaW / 2, ctaY + ctaH / 2);
    ctx.scale(pulseCta, pulseCta);
    ctx.translate(-(PAD + ctaW / 2), -(ctaY + ctaH / 2));
    roundRectPath(ctx, PAD, ctaY, ctaW, ctaH, 40);
    ctx.fillStyle = ac; ctx.fill();
    ctx.fillStyle = '#000'; ctx.textAlign = 'left';
    ctx.fillText(ctaLabel, PAD + 20, ctaY + 54);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // Brand mark
  ctx.font = 'bold 20px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.textAlign = 'right';
  ctx.fillText('PAGECRAFT.AI', W - PAD, H - 38);
  ctx.textAlign = 'left';

  // Fade in / fade out
  if (progress < 0.05) {
    ctx.fillStyle = `rgba(3,7,18,${1 - progress / 0.05})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (progress > 0.92) {
    ctx.fillStyle = `rgba(3,7,18,${(progress - 0.92) / 0.08})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function wrapLines(ctx, text, maxWidth) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function renderCreativeVideo(creative, plataforma, specialistImg, durationSecs, onProgress) {
  const W = 1080, H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  return new Promise((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
    recorder.onerror = reject;
    recorder.start();
    const totalMs = durationSecs * 1000;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      if (elapsed >= totalMs) { recorder.stop(); return; }
      const progress = elapsed / totalMs;
      drawCreativeVideoFrame(ctx, creative, plataforma, specialistImg, progress);
      onProgress(progress);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

function downloadCanvas(canvasEl, filename) {
  canvasEl.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

/* ─── shared styles ─────────────────────────────── */
const labelStyle = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: '#9ca3af', marginBottom: '8px',
};
const toggleWrap = {
  display: 'flex', background: '#1f2937', borderRadius: '8px', padding: '3px', gap: '3px',
};
const toggleBtn = (active) => ({
  flex: 1, padding: '7px 0', fontSize: '0.78rem', fontWeight: 600,
  borderRadius: '6px', border: 'none', cursor: 'pointer',
  background: active ? '#06b6d4' : 'transparent',
  color: active ? '#000' : '#9ca3af',
  transition: 'all .2s',
});
const textareaStyle = {
  width: '100%', background: '#1f2937', border: '1px solid #374151',
  borderRadius: '8px', padding: '10px', color: '#f9fafb',
  fontSize: '0.8rem', lineHeight: 1.6, resize: 'vertical',
  fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
};
const inputStyle = {
  width: '100%', background: '#1f2937', border: '1px solid #374151',
  borderRadius: '8px', padding: '9px 12px', color: '#f9fafb',
  fontSize: '0.8rem', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
};
const btnSecondary = {
  padding: '7px 14px', background: '#1f2937',
  border: '1px solid #374151', borderRadius: '8px',
  color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600,
  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
};

/* ─── CanvasCard ────────────────────────────────── */
function CanvasCard({ creative, idx, plataforma, specialistImg, onMount, onGenerateVideo, videoState, videoProgress, videoUrl }) {
  const ac = angleColor(creative.angulo);
  const ref = useCallback(el => {
    if (el) onMount(el, idx);
  }, [idx, onMount]);

  function downloadVideo() {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `criativo-${idx + 1}-${(creative.angulo || 'ad').toLowerCase()}.webm`;
    a.click();
  }

  return (
    <div style={{
      background: '#0d1117', border: '1px solid #1f2937',
      borderRadius: '10px', overflow: 'hidden',
      transition: 'border-color .2s, transform .2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = ac; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1f2937'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Canvas preview */}
      <div style={{ position: 'relative', background: '#000', lineHeight: 0 }}>
        <canvas ref={ref} style={{ width: '100%', display: 'block' }} />
      </div>

      {/* Video progress bar */}
      {videoState === 'rendering' && (
        <div style={{ padding: '8px 12px', background: '#111827', borderTop: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.6rem', color: '#a855f7' }}>⚡ Gerando vídeo...</span>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.6rem', color: '#6b7280' }}>{Math.round(videoProgress * 100)}%</span>
          </div>
          <div style={{ background: '#1f2937', borderRadius: 3, height: 4 }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#a855f7,#06b6d4)', width: `${videoProgress * 100}%`, borderRadius: 3, transition: 'width 0.2s' }} />
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 12px', borderTop: `1px solid ${ac}33`,
        background: `linear-gradient(135deg, ${ac}08, transparent)`,
        gap: '8px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.58rem', color: ac, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            #{idx + 1} · {creative.angulo}
          </span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f9fafb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {creative.headline}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={() => {
              const canvas = document.querySelectorAll('[data-canvas-card]')[idx];
              if (canvas) downloadCanvas(canvas, `criativo-${idx + 1}-${creative.angulo.toLowerCase()}.png`);
            }}
            style={{ ...btnSecondary, background: ac + '22', borderColor: ac + '55', color: ac }}
          >
            ⬇ PNG
          </button>
          {videoState === 'done' ? (
            <button onClick={downloadVideo} style={{ ...btnSecondary, background: 'rgba(34,197,94,0.15)', borderColor: '#22c55e', color: '#22c55e' }}>
              ⬇ .webm
            </button>
          ) : (
            <button
              onClick={() => onGenerateVideo(idx, creative)}
              disabled={videoState === 'rendering'}
              style={{ ...btnSecondary, background: 'rgba(168,85,247,0.15)', borderColor: '#a855f755', color: videoState === 'rendering' ? '#6b7280' : '#a855f7', cursor: videoState === 'rendering' ? 'not-allowed' : 'pointer' }}
            >
              🎬 Vídeo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryCard({ project, onClick }) {
  return (
    <div style={{
      background: '#0d1117', border: '1px solid #1f2937', borderRadius: '10px',
      padding: '14px', cursor: 'pointer', transition: 'border-color .2s',
    }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#06b6d4'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1f2937'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f9fafb', flex: 1 }}>{project.name}</div>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.6rem', color: '#4b5563', whiteSpace: 'nowrap', marginLeft: '8px' }}>{project.date}</span>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {[
          { label: project.plataforma, c: '#06b6d4' },
          { label: project.modo === 'carrossel' ? 'Carrossel' : 'Imagem Única', c: '#a855f7' },
          { label: `${project.data?.criativos?.length || 0} criativos`, c: '#22c55e' },
        ].map((tag, i) => (
          <span key={i} style={{
            background: `${tag.c}22`, color: tag.c, border: `1px solid ${tag.c}44`,
            borderRadius: '4px', padding: '2px 8px',
            fontSize: '0.62rem', fontFamily: 'JetBrains Mono,monospace',
          }}>{tag.label}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── main ────────────────────────────────────────── */
export default function CreativesPage() {
  const { addProject, projects } = useStore();

  const [tab, setTab]               = useState('gerador');
  const [modo, setModo]             = useState('unica');
  const [estilo, setEstilo]         = useState('foto');
  const [estrategia, setEstrategia] = useState('');
  const [guia, setGuia]             = useState('');
  const [plataforma, setPlataforma] = useState('Meta');
  const [especialista, setEspecialista] = useState(null);
  const fileRef = useRef();

  const [loading, setLoading] = useState(false);
  const [stream, setStream]   = useState('');
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  // video state per card: { [idx]: { status, progress, url } }
  const [videoStates, setVideoStates] = useState({});

  // Refs for canvas elements and specialist image
  const canvasEls   = useRef({});
  const specialistImgRef = useRef(null);

  const history = projects.filter(p => p.type === 'criativo');

  // Load specialist image into an HTMLImageElement
  useEffect(() => {
    if (especialista) {
      const img = new Image();
      img.onload = () => { specialistImgRef.current = img; };
      img.src = especialista;
    } else {
      specialistImgRef.current = null;
    }
  }, [especialista]);

  // Draw canvases after result arrives
  useEffect(() => {
    if (!result?.criativos?.length) return;
    async function draw() {
      await document.fonts.ready;
      result.criativos.forEach((c, i) => {
        const el = canvasEls.current[i];
        if (el) {
          el.setAttribute('data-canvas-card', 'true');
          drawCreativeCanvas(el, c, result.plataforma || plataforma, specialistImgRef.current);
        }
      });
    }
    // Small delay to ensure canvas refs are mounted
    const t = setTimeout(draw, 80);
    return () => clearTimeout(t);
  }, [result]);

  const handleCanvasMount = useCallback((el, idx) => {
    canvasEls.current[idx] = el;
    el.setAttribute('data-canvas-card', 'true');
  }, []);

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setEspecialista(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!estrategia.trim()) { setError('Preencha a estratégia do anúncio.'); return; }
    setError(''); setResult(null); setStream(''); setLoading(true);
    canvasEls.current = {};
    try {
      const prompt = buildPrompt({ modo, estilo, estrategia, guia, plataforma, especialista });
      const raw = await generateWithGemini(prompt, txt => setStream(txt));
      const parsed = parseCreatives(raw);
      if (parsed?.criativos?.length) {
        setResult(parsed);
        addProject({
          id: Date.now(), type: 'criativo',
          name: estrategia.slice(0, 55),
          date: new Date().toLocaleDateString('pt-BR'),
          plataforma, modo, data: parsed,
        });
      } else {
        setError('Resposta da IA não reconhecida. Tente novamente.');
      }
    } catch (err) {
      setError('Erro: ' + err.message);
    } finally { setLoading(false); setStream(''); }
  }

  async function handleGenerateVideo(idx, creative) {
    setVideoStates(v => ({ ...v, [idx]: { status: 'rendering', progress: 0, url: null } }));
    try {
      await document.fonts.ready;
      const blob = await renderCreativeVideo(
        creative,
        result?.plataforma || plataforma,
        specialistImgRef.current,
        20,
        p => setVideoStates(v => ({ ...v, [idx]: { ...v[idx], progress: p } }))
      );
      const url = URL.createObjectURL(blob);
      setVideoStates(v => ({ ...v, [idx]: { status: 'done', progress: 1, url } }));
    } catch (e) {
      setVideoStates(v => ({ ...v, [idx]: { status: 'idle', progress: 0, url: null } }));
      setError('Erro ao gerar vídeo: ' + e.message);
    }
  }

  function downloadAll() {
    if (!result?.criativos) return;
    result.criativos.forEach((c, i) => {
      const el = canvasEls.current[i];
      if (el) {
        setTimeout(() => downloadCanvas(el, `criativo-${i + 1}-${(c.angulo || 'ad').toLowerCase()}.png`), i * 300);
      }
    });
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px', gap: '16px', overflow: 'hidden' }}>

      {/* title */}
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f9fafb', margin: 0 }}>Gerador de Criativos</h1>
        <p style={{ color: '#6b7280', fontSize: '0.82rem', margin: '4px 0 0' }}>Gera imagens PNG prontas para Meta, Google e TikTok · powered by Gemini AI</p>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #1f2937' }}>
        {[{ key: 'gerador', label: 'Gerador' }, { key: 'historico', label: `Histórico (${history.length})` }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.85rem',
            color: tab === t.key ? '#06b6d4' : '#6b7280',
            borderBottom: tab === t.key ? '2px solid #06b6d4' : '2px solid transparent',
            marginBottom: '-1px', transition: 'all .2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* HISTORICO */}
      {tab === 'historico' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {history.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#4b5563', gap: '12px' }}>
              <div style={{ fontSize: '2.5rem' }}>🎨</div>
              <div style={{ fontSize: '0.9rem' }}>Nenhum criativo gerado ainda.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', paddingBottom: '24px' }}>
              {history.map(p => (
                <HistoryCard key={p.id} project={p} onClick={() => { setResult(p.data); setTab('gerador'); }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* GERADOR */}
      {tab === 'gerador' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px', overflow: 'hidden', minHeight: 0 }}>

          {/* ═══ LEFT — form ═══ */}
          <div style={{
            background: '#0d1117', border: '1px solid #1f2937', borderRadius: '10px',
            padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto',
          }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f9fafb' }}>Crie Seu Anúncio</div>

            {/* plataforma */}
            <div>
              <label style={labelStyle}>Plataforma</label>
              <div style={toggleWrap}>
                {['Meta', 'Google', 'TikTok'].map(p => (
                  <button key={p} onClick={() => setPlataforma(p)} style={toggleBtn(plataforma === p)}>{p}</button>
                ))}
              </div>
            </div>

            {/* modo */}
            <div>
              <label style={labelStyle}>Modo de Geração</label>
              <div style={toggleWrap}>
                <button onClick={() => setModo('unica')} style={toggleBtn(modo === 'unica')}>Imagem Única</button>
                <button onClick={() => setModo('carrossel')} style={toggleBtn(modo === 'carrossel')}>Carrossel</button>
              </div>
            </div>

            {/* estilo */}
            <div>
              <label style={labelStyle}>Estilo de Design</label>
              <div style={toggleWrap}>
                <button onClick={() => setEstilo('foto')} style={toggleBtn(estilo === 'foto')}>Foto + Texto</button>
                <button onClick={() => setEstilo('pro')} style={toggleBtn(estilo === 'pro')}>Design Pro</button>
              </div>
              <p style={{ fontSize: '0.68rem', color: '#4b5563', margin: '5px 0 0' }}>
                {estilo === 'foto' ? 'Fotos reais com texto sobreposto.' : 'Layout gráfico premium com elementos visuais.'}
              </p>
            </div>

            {/* estrategia */}
            <div>
              <label style={labelStyle}>Estratégia do Anúncio / Roteiro</label>
              <textarea value={estrategia} onChange={e => setEstrategia(e.target.value)}
                placeholder="Ex: Consultoria de IA para PMEs que faturam acima de R$50k/mês, público frio, objetivo: gerar leads..."
                rows={5} style={textareaStyle}
              />
              <p style={{ fontSize: '0.68rem', color: '#4b5563', margin: '4px 0 0' }}>
                Este é o cérebro da operação. Diga à IA o que você quer alcançar.
              </p>
            </div>

            {/* guia visual */}
            <div>
              <label style={labelStyle}>Guia de Estilo Visual <span style={{ color: '#4b5563', fontWeight: 400 }}>(Opcional)</span></label>
              <input type="text" value={guia} onChange={e => setGuia(e.target.value)}
                placeholder="Ex: 'Tons escuros, futurista, azul e ciano'"
                style={inputStyle}
              />
            </div>

            {/* imagem especialista */}
            <div>
              <label style={labelStyle}>Foto do Especialista <span style={{ color: '#4b5563', fontWeight: 400 }}>(Aparece no criativo)</span></label>
              {especialista ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={especialista} alt="especialista" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #06b6d4' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: '#22c55e', marginBottom: '4px' }}>✓ Foto carregada</div>
                    <button onClick={() => setEspecialista(null)} style={{ ...btnSecondary, padding: '4px 10px', fontSize: '0.68rem' }}>Remover</button>
                  </div>
                </div>
              ) : (
                <>
                  <button onClick={() => fileRef.current?.click()} style={{
                    width: '100%', padding: '10px', background: '#1f2937',
                    border: '1px dashed #374151', borderRadius: '8px',
                    color: '#6b7280', fontSize: '0.78rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}>📷 Escolher Foto</button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                  <p style={{ fontSize: '0.68rem', color: '#4b5563', margin: '4px 0 0' }}>
                    A foto aparecerá no canto superior direito de cada imagem.
                  </p>
                </>
              )}
            </div>

            {/* error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '6px', padding: '10px', fontSize: '0.78rem', color: '#ef4444' }}>
                {error}
              </div>
            )}

            {/* CTA */}
            <button onClick={handleGenerate} disabled={loading} style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: '8px',
              background: loading ? '#1f2937' : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              color: loading ? '#6b7280' : '#000', fontWeight: 800, fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s', marginTop: 'auto',
            }}>
              {loading ? '⚡ Gerando com IA...' : '🚀 Gerar Imagens'}
            </button>
          </div>

          {/* ═══ RIGHT — preview ═══ */}
          <div style={{ border: '1px solid #1f2937', borderRadius: '10px', background: '#030712', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* streaming */}
            {loading && (
              <div style={{ padding: '24px' }}>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.65rem', color: '#06b6d4', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  ⚡ Gerando copy com Gemini AI...
                </div>
                <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px', fontFamily: 'JetBrains Mono,monospace', fontSize: '0.68rem', color: '#22c55e', lineHeight: 1.7, maxHeight: '400px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {stream || 'Conectando com a IA...'}<span style={{ opacity: 0.7 }}>▌</span>
                </div>
              </div>
            )}

            {/* empty */}
            {!loading && !result && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px' }}>
                <div style={{ fontSize: '3.5rem', opacity: 0.2 }}>🖼</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#374151' }}>Suas imagens aparecerão aqui.</div>
                <div style={{ fontSize: '0.8rem', color: '#1f2937', textAlign: 'center', maxWidth: '300px' }}>
                  Preencha a estratégia à esquerda e clique em{' '}
                  <strong style={{ color: '#06b6d4' }}>Gerar Imagens</strong> para criar os criativos.
                </div>
              </div>
            )}

            {/* results */}
            {!loading && result && (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* result header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.65rem', color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {result.criativos?.length} imagens · {result.plataforma} · {result.modo === 'carrossel' ? 'Carrossel' : 'Imagem Única'}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: '#4b5563', marginTop: '2px' }}>
                      1080×1080px · PNG · pronto para subir
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={downloadAll} style={{
                      ...btnSecondary,
                      background: 'rgba(6,182,212,0.15)', borderColor: '#06b6d4', color: '#06b6d4',
                    }}>
                      ⬇ Baixar Todos
                    </button>
                    <button onClick={() => { setResult(null); canvasEls.current = {}; setVideoStates({}); }} style={btnSecondary}>
                      + Novo
                    </button>
                  </div>
                </div>

                {/* canvas cards grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {result.criativos?.map((c, i) => {
                    const vs = videoStates[i] || { status: 'idle', progress: 0, url: null };
                    return (
                      <CanvasCard
                        key={c.id || i}
                        creative={c}
                        idx={i}
                        plataforma={result.plataforma || plataforma}
                        specialistImg={specialistImgRef.current}
                        onMount={handleCanvasMount}
                        onGenerateVideo={handleGenerateVideo}
                        videoState={vs.status}
                        videoProgress={vs.progress}
                        videoUrl={vs.url}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

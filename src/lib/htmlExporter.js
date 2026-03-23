/**
 * HTML Export Engine — generates a complete, production-ready sales page
 */

const colorPresets = {
  'Azul Profundo': { primary: '#1e40af', accent: '#3b82f6', light: '#dbeafe' },
  'Verde Esmeralda': { primary: '#065f46', accent: '#10b981', light: '#d1fae5' },
  'Violeta': { primary: '#6d28d9', accent: '#8b5cf6', light: '#ede9fe' },
  'Vermelho': { primary: '#991b1b', accent: '#ef4444', light: '#fee2e2' },
  'Indigo': { primary: '#312e81', accent: '#6366f1', light: '#e0e7ff' },
  'Grafite': { primary: '#111827', accent: '#374151', light: '#f3f4f6' },
};

export function generateHtml(copy, config, photos) {
  const colors = colorPresets[config.colorPreset] || colorPresets['Azul Profundo'];
  const heroImg = photos?.hero || '';
  const whatsapp = config.whatsapp || '';
  const checkoutUrl = config.checkoutUrl || '#';
  const produto = config.produto || 'Produto';

  const heroSection = copy.hero?.variacoes?.[0] || {
    headline: 'Headline Principal',
    subheadline: 'Subheadline poderosa aqui.',
    cta: 'Quero Começar Agora'
  };

  const faqs = copy.faq?.faqs || [];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${produto} — Página de Vendas</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', sans-serif; }
    :root {
      --primary: ${colors.primary};
      --accent: ${colors.accent};
      --light: ${colors.light};
    }
    .btn-main {
      background: ${colors.accent};
      color: white;
      padding: 18px 40px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 700;
      display: inline-block;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
    }
    .btn-main:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
    .highlight { color: ${colors.accent}; }
    @keyframes pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.03)} }
    .pulse { animation: pulse 2s infinite; }
    .faq-answer { display: none; }
    .faq-answer.open { display: block; }
    @keyframes slideDown { from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)} }
    .toast { position:fixed;bottom:20px;left:20px;background:white;border-radius:12px;padding:16px;box-shadow:0 10px 40px rgba(0,0,0,0.15);z-index:9999;max-width:320px;display:flex;gap:12px;align-items:center;animation:slideDown 0.4s ease; }
    .sticky-cta { position:fixed;bottom:0;left:0;right:0;background:${colors.accent};color:white;text-align:center;padding:14px;z-index:999;display:none; }
    @media(max-width:768px){.sticky-cta{display:block;}}
    #exit-popup { display:none;position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:99999;align-items:center;justify-content:center; }
    #exit-popup.show { display:flex; }
    #lgpd-banner { position:fixed;bottom:0;left:0;right:0;background:#111;color:#ddd;padding:16px;text-align:center;z-index:9998;font-size:13px; }
  </style>
  <!-- Google Tag Manager placeholder -->
  <!-- <script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXXXX');</script> -->
  <!-- Meta Pixel placeholder -->
  <!-- <script>!function(f,b,e,v,n,t,s){...}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','YOUR_PIXEL_ID');fbq('track','PageView');</script> -->
</head>
<body class="bg-white text-gray-900">

<!-- LGPD Banner -->
<div id="lgpd-banner">
  🍪 Usamos cookies para melhorar sua experiência. Ao continuar navegando, você concorda com nossa <a href="#" style="color:${colors.accent}">Política de Privacidade</a>.
  <button onclick="document.getElementById('lgpd-banner').style.display='none'" style="margin-left:16px;background:${colors.accent};color:white;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;">Aceitar</button>
</div>

<!-- Social Proof Toast -->
<div class="toast" id="toast" style="display:none">
  <div style="font-size:24px">🎉</div>
  <div>
    <div style="font-weight:700;font-size:14px" id="toast-name">João de São Paulo</div>
    <div style="color:#6b7280;font-size:13px">acabou de adquirir ${produto}</div>
  </div>
</div>

<!-- Exit Intent Popup -->
<div id="exit-popup">
  <div style="background:white;border-radius:16px;padding:40px;max-width:480px;width:90%;text-align:center;position:relative;">
    <button onclick="document.getElementById('exit-popup').classList.remove('show')" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:#6b7280">✕</button>
    <div style="font-size:48px;margin-bottom:16px">⚡</div>
    <h2 style="font-size:24px;font-weight:800;margin-bottom:12px">Espera! Oferta especial antes de ir...</h2>
    <p style="color:#4b5563;margin-bottom:24px">Você está prestes a perder uma oportunidade única. Temos uma condição especial só para você.</p>
    <a href="${checkoutUrl}?utm_source=exit_intent" class="btn-main" style="display:block">Quero Aproveitar a Oferta →</a>
    <p style="margin-top:12px;font-size:12px;color:#9ca3af;cursor:pointer" onclick="document.getElementById('exit-popup').classList.remove('show')">Não, prefiro deixar passar.</p>
  </div>
</div>

<!-- HERO -->
<section style="background:linear-gradient(135deg,${colors.primary} 0%,${colors.accent} 100%);color:white;padding:80px 20px;text-align:center;">
  <div style="max-width:800px;margin:0 auto;">
    <div style="display:inline-block;background:rgba(255,255,255,0.2);padding:6px 20px;border-radius:100px;font-size:13px;font-weight:600;margin-bottom:24px;letter-spacing:1px;text-transform:uppercase;">
      ${copy.estrategia?.framework || 'Método Exclusivo'}
    </div>
    <h1 style="font-size:clamp(32px,5vw,56px);font-weight:900;line-height:1.1;margin-bottom:24px;letter-spacing:-1px;">
      ${heroSection.headline}
    </h1>
    <p style="font-size:clamp(16px,2.5vw,22px);opacity:0.9;max-width:600px;margin:0 auto 40px;line-height:1.6;">
      ${heroSection.subheadline}
    </p>
    <div style="margin-bottom:16px;">
      <a href="${checkoutUrl}?utm_source=hero" class="btn-main pulse" style="font-size:20px;padding:20px 48px;box-shadow:0 8px 30px rgba(0,0,0,0.3)">
        ${heroSection.cta} →
      </a>
    </div>
    <p style="font-size:13px;opacity:0.7;">✓ Acesso imediato &nbsp;|&nbsp; ✓ Garantia inclusa &nbsp;|&nbsp; ✓ Sem risco</p>
    ${heroImg ? `<img src="${heroImg}" alt="Hero" style="margin-top:48px;border-radius:16px;max-width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);" />` : ''}
  </div>
</section>

<!-- COUNTDOWN -->
<section style="background:#1a1a1a;color:white;padding:20px;text-align:center;">
  <p style="margin:0;font-size:15px;">⏰ Oferta especial expira em: <strong id="countdown" style="color:${colors.accent};font-size:18px;font-weight:700;">--:--:--</strong></p>
</section>

<!-- PROBLEMA -->
<section style="padding:80px 20px;max-width:800px;margin:0 auto;">
  <div class="section-content">
    <h2 style="font-size:clamp(24px,4vw,36px);font-weight:800;margin-bottom:24px;color:#111;">
      Você se identifica com isso?
    </h2>
    <div style="white-space:pre-line;font-size:16px;line-height:1.8;color:#374151;">
      ${copy.problema || 'Conteúdo gerado automaticamente pela IA aparecerá aqui.'}
    </div>
  </div>
</section>

<!-- AMPLIFICACAO -->
<section style="background:#fef2f2;padding:80px 20px;">
  <div style="max-width:800px;margin:0 auto;">
    <h2 style="font-size:clamp(22px,3.5vw,32px);font-weight:800;margin-bottom:24px;color:#991b1b;">
      😔 Se você não agir agora...
    </h2>
    <div style="white-space:pre-line;font-size:16px;line-height:1.8;color:#374151;">
      ${copy.amplificacao || ''}
    </div>
  </div>
</section>

<!-- HISTORIA -->
<section style="padding:80px 20px;max-width:800px;margin:0 auto;">
  <h2 style="font-size:clamp(22px,3.5vw,32px);font-weight:800;margin-bottom:24px;color:#111;">
    Minha história...
  </h2>
  <div style="white-space:pre-line;font-size:16px;line-height:1.8;color:#374151;">
    ${copy.historia || ''}
  </div>
</section>

<!-- MECANISMO -->
<section style="background:${colors.light};padding:80px 20px;">
  <div style="max-width:800px;margin:0 auto;">
    <div style="display:inline-block;background:${colors.accent};color:white;padding:4px 16px;border-radius:100px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">
      O Método
    </div>
    <h2 style="font-size:clamp(22px,3.5vw,32px);font-weight:800;margin-bottom:24px;color:#111;">
      Por que isso funciona quando tudo mais falhou
    </h2>
    <div style="white-space:pre-line;font-size:16px;line-height:1.8;color:#374151;">
      ${copy.mecanismo || ''}
    </div>
  </div>
</section>

<!-- TRANSFORMACAO -->
<section style="padding:80px 20px;max-width:800px;margin:0 auto;text-align:center;">
  <h2 style="font-size:clamp(22px,3.5vw,36px);font-weight:900;margin-bottom:8px;color:#111;">
    ✨ Imagine sua vida assim...
  </h2>
  <div style="white-space:pre-line;font-size:16px;line-height:1.8;color:#374151;text-align:left;margin-top:24px;">
    ${copy.transformacao || ''}
  </div>
</section>

<!-- PARA QUEM E -->
<section style="background:#f9fafb;padding:80px 20px;">
  <div style="max-width:800px;margin:0 auto;">
    <h2 style="font-size:clamp(22px,3.5vw,32px);font-weight:800;margin-bottom:24px;color:#111;text-align:center;">
      Este produto é para você?
    </h2>
    <div style="white-space:pre-line;font-size:16px;line-height:1.8;color:#374151;">
      ${copy['para-quem'] || ''}
    </div>
  </div>
</section>

<!-- DEPOIMENTOS -->
<section style="padding:80px 20px;max-width:900px;margin:0 auto;text-align:center;">
  <div style="display:inline-block;background:${colors.accent};color:white;padding:4px 16px;border-radius:100px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">
    Prova Social
  </div>
  <h2 style="font-size:clamp(22px,3.5vw,36px);font-weight:800;margin-bottom:32px;color:#111;">
    O que nossos clientes dizem
  </h2>
  <div style="white-space:pre-line;font-size:16px;line-height:1.8;color:#374151;text-align:left;margin-bottom:40px;">
    ${copy.depoimentos || ''}
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-top:40px;">
    ${['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'].map((stars, i) => `
    <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:24px;text-align:left;">
      <div style="font-size:20px;margin-bottom:12px;">${stars}</div>
      <p style="color:#374151;font-size:15px;line-height:1.6;font-style:italic;">"Resultados incríveis! Superou todas as minhas expectativas. Indico para todos."</p>
      <div style="margin-top:16px;font-weight:600;font-size:14px;">— Cliente ${i + 1}</div>
    </div>`).join('')}
  </div>
</section>

<!-- OFERTA -->
<section style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:white;padding:80px 20px;">
  <div style="max-width:800px;margin:0 auto;text-align:center;">
    <div style="display:inline-block;background:${colors.accent};color:white;padding:4px 16px;border-radius:100px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">
      Oferta Especial
    </div>
    <h2 style="font-size:clamp(24px,4vw,42px);font-weight:900;margin-bottom:32px;line-height:1.2;">
      Tudo que você recebe hoje
    </h2>
    <div style="white-space:pre-line;font-size:16px;line-height:1.8;color:#e2e8f0;text-align:left;background:rgba(255,255,255,0.05);border-radius:16px;padding:32px;margin-bottom:40px;border:1px solid rgba(255,255,255,0.1);">
      ${copy.oferta || ''}
    </div>
    <a href="${checkoutUrl}?utm_source=oferta" class="btn-main" style="font-size:22px;padding:24px 56px;box-shadow:0 8px 30px rgba(0,0,0,0.5);">
      Quero Garantir Meu Acesso →
    </a>
    <p style="margin-top:16px;font-size:14px;opacity:0.7;">🔒 Pagamento 100% seguro &nbsp;|&nbsp; ✓ Acesso imediato</p>
  </div>
</section>

<!-- GARANTIA -->
<section style="padding:80px 20px;max-width:700px;margin:0 auto;text-align:center;">
  <div style="border:3px solid ${colors.accent};border-radius:16px;padding:48px;background:${colors.light};">
    <div style="font-size:64px;margin-bottom:16px;">🛡️</div>
    <h2 style="font-size:28px;font-weight:800;margin-bottom:24px;color:#111;">Garantia Total de Satisfação</h2>
    <div style="white-space:pre-line;font-size:16px;line-height:1.8;color:#374151;text-align:left;">
      ${copy.garantia || ''}
    </div>
  </div>
</section>

<!-- FAQ -->
<section style="padding:80px 20px;max-width:800px;margin:0 auto;">
  <h2 style="font-size:clamp(22px,3.5vw,32px);font-weight:800;margin-bottom:40px;color:#111;text-align:center;">
    Perguntas Frequentes
  </h2>
  <div id="faq-container">
    ${faqs.map((faq, i) => `
    <div style="border:1px solid #e5e7eb;border-radius:12px;margin-bottom:12px;overflow:hidden;">
      <button onclick="toggleFaq(${i})" style="width:100%;text-align:left;padding:20px 24px;background:white;border:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-size:16px;font-weight:600;color:#111;">
        ${faq.pergunta}
        <span id="icon-${i}" style="font-size:20px;transition:transform 0.2s;">+</span>
      </button>
      <div id="faq-${i}" class="faq-answer" style="padding:0 24px 20px;font-size:15px;line-height:1.7;color:#374151;background:white;">
        ${faq.resposta}
      </div>
    </div>`).join('')}
  </div>
</section>

<!-- CTA FINAL -->
<section style="background:linear-gradient(135deg,${colors.primary} 0%,${colors.accent} 100%);color:white;padding:80px 20px;text-align:center;">
  <div style="max-width:700px;margin:0 auto;">
    <h2 style="font-size:clamp(24px,4vw,42px);font-weight:900;margin-bottom:24px;line-height:1.2;">
      A hora é AGORA!
    </h2>
    <div style="white-space:pre-line;font-size:16px;line-height:1.8;opacity:0.9;margin-bottom:40px;">
      ${copy['cta-final'] || ''}
    </div>
    <a href="${checkoutUrl}?utm_source=cta_final" class="btn-main pulse" style="font-size:22px;padding:24px 56px;background:white;color:${colors.accent};box-shadow:0 8px 30px rgba(0,0,0,0.3);">
      Começar Agora →
    </a>
    <p style="margin-top:24px;font-size:13px;opacity:0.7;">Não perca mais tempo. Cada dia de atraso é um dia a menos de resultado.</p>
  </div>
</section>

<!-- STICKY CTA MOBILE -->
<div class="sticky-cta">
  <a href="${checkoutUrl}?utm_source=sticky" style="color:white;text-decoration:none;font-weight:700;font-size:16px;">
    🔥 Garantir Acesso Agora →
  </a>
</div>

<!-- WHATSAPP BUTTON -->
${whatsapp ? `
<a href="https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Olá!%20Tenho%20interesse%20em%20${encodeURIComponent(produto)}"
   target="_blank"
   style="position:fixed;bottom:80px;right:20px;background:#25d366;color:white;width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;text-decoration:none;box-shadow:0 4px 20px rgba(37,211,102,0.4);z-index:999;transition:all 0.2s;"
   onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
  💬
</a>` : ''}

<!-- FOOTER -->
<footer style="background:#111;color:#9ca3af;padding:40px 20px;text-align:center;font-size:13px;line-height:1.8;">
  <div style="max-width:800px;margin:0 auto;">
    <p style="margin-bottom:16px;white-space:pre-line;">${copy.footer || `© ${new Date().getFullYear()} ${produto}. Todos os direitos reservados.\n\nEste site não é afiliado ao Facebook ou a qualquer entidade do Facebook. Depois de sair do Facebook, a responsabilidade não é deles.\n\nOs resultados apresentados não são típicos. Os resultados individuais variarão com base no esforço, experiência e situação de cada pessoa.\n\nPolítica de Privacidade | Termos de Uso | Política de Reembolso`}</p>
    <div style="border-top:1px solid #1f2937;padding-top:16px;margin-top:16px;">
      <a href="#" style="color:#6b7280;text-decoration:none;margin:0 12px;">Política de Privacidade</a>
      <a href="#" style="color:#6b7280;text-decoration:none;margin:0 12px;">Termos de Uso</a>
      <a href="#" style="color:#6b7280;text-decoration:none;margin:0 12px;">Contato</a>
    </div>
  </div>
</footer>

<script>
// =====================
// COUNTDOWN TIMER
// =====================
(function() {
  var end = new Date();
  end.setHours(end.getHours() + 3);
  var saved = localStorage.getItem('countdown_end_${produto.replace(/\s/g,'_')}');
  if (saved) { end = new Date(parseInt(saved)); }
  else { localStorage.setItem('countdown_end_${produto.replace(/\s/g,'_')}', end.getTime()); }

  function update() {
    var now = new Date();
    var diff = end - now;
    if (diff <= 0) { document.getElementById('countdown').textContent = '00:00:00'; return; }
    var h = Math.floor(diff / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    document.getElementById('countdown').textContent =
      String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }
  update();
  setInterval(update, 1000);
})();

// =====================
// UTM PASSTHROUGH
// =====================
(function() {
  var params = new URLSearchParams(window.location.search);
  var utms = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','fbclid','gclid'];
  var links = document.querySelectorAll('a[href]');
  links.forEach(function(link) {
    try {
      var url = new URL(link.href);
      utms.forEach(function(utm) {
        if (params.get(utm)) url.searchParams.set(utm, params.get(utm));
      });
      link.href = url.toString();
    } catch(e) {}
  });
})();

// =====================
// FAQ ACCORDION
// =====================
function toggleFaq(i) {
  var el = document.getElementById('faq-' + i);
  var icon = document.getElementById('icon-' + i);
  var isOpen = el.classList.contains('open');
  document.querySelectorAll('.faq-answer').forEach(function(f) { f.classList.remove('open'); });
  document.querySelectorAll('[id^=icon-]').forEach(function(ic) { ic.textContent = '+'; ic.style.transform = ''; });
  if (!isOpen) {
    el.classList.add('open');
    icon.textContent = '−';
    icon.style.transform = 'rotate(180deg)';
  }
}

// =====================
// SOCIAL PROOF TOAST
// =====================
(function() {
  var names = ['João (SP)','Maria (RJ)','Carlos (MG)','Ana (RS)','Pedro (BA)','Fernanda (PR)','Lucas (CE)','Juliana (GO)'];
  var i = 0;
  function showToast() {
    var toast = document.getElementById('toast');
    document.getElementById('toast-name').textContent = names[i % names.length];
    i++;
    toast.style.display = 'flex';
    setTimeout(function() { toast.style.display = 'none'; }, 4000);
  }
  setTimeout(function() {
    showToast();
    setInterval(showToast, 18000);
  }, 5000);
})();

// =====================
// EXIT INTENT
// =====================
(function() {
  var shown = false;
  document.addEventListener('mouseleave', function(e) {
    if (e.clientY < 10 && !shown) {
      shown = true;
      document.getElementById('exit-popup').classList.add('show');
    }
  });
})();
</script>
</body>
</html>`;
}

# PageCraft App — Sales Page Factory

> Criado por Robson Melo (Godtime.AI) com assistência de Claude Code (Anthropic)

## Repositório
**https://github.com/Godtime-300682/pagecraft-app**
Branch: `master` · Visibilidade: público

## Localização Local
`C:\Users\Usuário\pagecraft-app\`

---

## Stack Técnica
- **Frontend:** React 18 + Vite
- **Estilização:** Tailwind CSS via CDN + estilos inline
- **Roteamento:** React Router v6
- **Estado global:** Zustand com persist middleware (localStorage)
- **IA:** Google Gemini API — modelo atual `gemini-3.1-flash-lite-preview`
- **Vídeo:** Canvas 2D + MediaRecorder API → export `.webm`
- **Imagens:** Canvas 2D → export `.png` (1080×1080)
- **Fontes:** Inter + JetBrains Mono (Google Fonts)
- **Dev server:** `npm run dev` → http://localhost:5173

---

## Design System
| Token | Valor |
|-------|-------|
| Background página | `#030712` |
| Background cards | `#0d1117` |
| Accent (ciano) | `#06b6d4` |
| Borders | `#1f2937` |
| Text primário | `#f9fafb` |
| Text secundário | `#9ca3af` |
| Text muted | `#6b7280` |
| Success | `#22c55e` |
| Danger | `#ef4444` |
| Purple | `#a855f7` |
| Grid sutil (canvas) | `rgba(255,255,255,0.022)` |

**Tema:** Dark — Mission Control / SpaceX aesthetic

---

## Estrutura de Arquivos
```
pagecraft-app/
├── src/
│   ├── App.jsx                    # Rotas + RequireAuth guard
│   ├── main.jsx                   # Entry point
│   ├── lib/
│   │   ├── gemini.js              # Cliente Gemini API (streaming)
│   │   ├── prompts.js             # Todos os prompts PT-BR
│   │   └── htmlExporter.js        # Export HTML da página de vendas
│   ├── store/
│   │   └── useStore.js            # Zustand store (projetos, settings)
│   ├── components/
│   │   ├── Layout.jsx             # Shell com sidebar
│   │   ├── Sidebar.jsx            # Navegação lateral
│   │   ├── LoadingSpinner.jsx
│   │   ├── StepWizard.jsx         # Wizard multi-etapa
│   │   └── ProjectCard.jsx
│   └── pages/
│       ├── LoginPage.jsx          # Entrada da API Key Gemini
│       ├── DashboardPage.jsx      # Métricas + projetos recentes
│       ├── NewSalesPageWizard.jsx # Wizard 5 etapas — página de vendas
│       ├── VSLCreatorPage.jsx     # Script VSL + geração de vídeo WebM
│       ├── CreativesPage.jsx      # Criativos PNG + vídeo por criativo
│       ├── ProjectsPage.jsx       # Histórico de projetos
│       └── SettingsPage.jsx       # Configurações
├── DOCUMENTACAO.md                # Este arquivo
├── package.json
├── vite.config.js
└── index.html
```

---

## Rotas
| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | redirect | Auth guard → login ou dashboard |
| `/login` | LoginPage | Inserir API Key Gemini |
| `/dashboard` | DashboardPage | Home com métricas |
| `/nova-pagina` | NewSalesPageWizard | Wizard 5 etapas |
| `/vsl` | VSLCreatorPage | Gerador VSL + vídeo |
| `/criativos` | CreativesPage | Gerador criativos PNG/vídeo |
| `/projetos` | ProjectsPage | Histórico |
| `/configuracoes` | SettingsPage | Settings |

---

## Autenticação
- Sem backend — API key armazenada em `localStorage` via Zustand
- `RequireAuth` HOC no App.jsx redireciona para `/login` se sem key
- Validação da key chamando `validateApiKey()` do `gemini.js`

---

## Integração Gemini (`src/lib/gemini.js`)
```javascript
// Modelo atual
model: "gemini-3.1-flash-lite-preview"

// Funções exportadas
getGeminiClient()                    // GoogleGenerativeAI com key do localStorage
generateWithGemini(prompt, onStream) // suporta streaming
validateApiKey(key)                  // valida antes do login
```

**Histórico de modelos testados:**
| Modelo | Status |
|--------|--------|
| `gemini-1.5-flash` | ❌ descontinuado (404) |
| `gemini-2.0-flash` | ❌ não disponível para novos usuários |
| `gemini-2.0-flash-lite` | ❌ substituído |
| `gemini-3.1-flash-lite-preview` | ✅ funcionando |

---

## Estado Global (`src/store/useStore.js`)
Zustand com persist → `localStorage` key: `pagecraft-storage`
```javascript
{
  projects: [],         // projetos salvos
  addProject(p),
  removeProject(id),
  settings: { geminiKey, ... }
}
```

**Tipos de projeto (`type`):**
- `'pagina'` — páginas de vendas
- `'vsl'` — scripts VSL
- `'criativo'` — criativos gerados

---

## Módulo VSL Creator
**Arquivo:** `src/pages/VSLCreatorPage.jsx`

**Fluxo:**
1. Formulário → produto, público, duração, tom de voz, preço
2. Gemini gera JSON com seções do script
3. Exibe script com cores por tipo de seção
4. Botão **▶ Gerar Vídeo** → Canvas animado

**Geração de vídeo:**
- Resolução: 1280×720 · 30fps · 5Mbps
- Formato: `video/webm;codecs=vp9`
- Duração por seção: 6 / 10 / 15 / 20s (configurável)
- Cada seção = 1 slide animado

**Animação por slide:**
```
0-8%   → accent bar preenche da esquerda
8-30%  → título entra deslizando (easeOut)
28-100%→ texto aparece palavra por palavra
70%+   → nota de produção fade in (amarelo)
88-100%→ fade out para próximo slide
```

**Cores por seção:**
```javascript
'Hook'              → #ef4444
'Promessa'          → #f97316
'Credenciais'       → #eab308
'Problema'          → #a855f7
'Agravamento'       → #ec4899
'História'          → #06b6d4
'Solução/Revelação' → #22c55e
'Prova'             → #3b82f6
'Oferta + Value Stack' → #10b981
'Garantia'          → #14b8a6
'CTA + Urgência'    → #f43f5e
'Close'             → #8b5cf6
```

---

## Módulo Criativos
**Arquivo:** `src/pages/CreativesPage.jsx`

**Layout:** painel esquerdo 300px (form) + painel direito (preview)

**Formulário:**
- Toggle Plataforma: Meta / Google / TikTok
- Toggle Modo: Imagem Única (3 variações) / Carrossel (5 cards)
- Toggle Estilo: Foto + Texto / Design Pro
- Textarea estratégia (input principal para IA)
- Guia de estilo visual (opcional)
- Upload foto especialista → aparece em círculo no criativo

**Geração de imagem PNG 1080×1080:**
- Gradient dark background + grid sutil
- Accent bar no topo, stripe lateral
- Badge plataforma/ângulo (canto esquerdo)
- Foto especialista círculo com glow (canto direito, se fornecida)
- Hook itálico → Headline bold grande → Subheadline → Body → CTA pill
- Marca "PAGECRAFT.AI" no rodapé
- Download individual ou "Baixar Todos"

**Geração de vídeo WebM 1080×1080 (20 segundos):**
- Canvas animado com `requestAnimationFrame`
- Estado por card: `idle → rendering → done`

```
0-15%  → badge aparece
15-30% → hook fade in
30-65% → headline palavra a palavra
65-85% → subheadline + body
83-100%→ CTA pulsante (animate scale)
0-5%   → fade in | 92-100% → fade out
```

**Ângulos emocionais:**
```javascript
'Dor'          → #ef4444 (vermelho)
'Desejo'       → #22c55e (verde)
'Curiosidade'  → #a855f7 (roxo)
'Prova Social' → #06b6d4 (ciano)
'Urgência'     → #eab308 (amarelo)
'Autoridade'   → #3b82f6 (azul)
```

---

## Módulo Wizard Página de Vendas
**Arquivo:** `src/pages/NewSalesPageWizard.jsx`

5 etapas — frameworks PASTOR + ACCA:
1. Briefing básico (produto, público, ticket)
2. Estratégia e seleção de framework
3. Geração de copy por seção
4. Análise e score (Bencivenga Persuasion Equation)
5. Export HTML

---

## Comandos
```bash
# Desenvolvimento
cd C:/Users/Usuário/pagecraft-app
npm run dev
# → http://localhost:5173

# Build produção
npm run build
# → pasta dist/

# Deploy Vercel (recomendado)
# Arraste a pasta dist/ para vercel.com

# Git
git add .
git commit -m "mensagem"
git push
```

---

## Decisões Técnicas
| Decisão | Motivo |
|---------|--------|
| Sem backend | Tudo no browser, zero infraestrutura |
| API key do usuário | Sem custo para o produto, cada user usa a sua |
| Canvas nativo | Bundle pequeno, sem Fabric.js / Konva |
| Vídeo em tempo real | MediaRecorder não permite aceleração |
| Inline styles | Mais controle em componentes canvas-heavy |
| Zustand persist | Projetos sobrevivem ao refresh sem backend |

---

## Pendências / Próximos Passos
- [ ] Export Stories (1080×1920) além do formato quadrado
- [ ] Integração Remotion para vídeos mais elaborados
- [ ] Deploy em produção no Vercel
- [ ] Autenticação multi-usuário (Supabase ou Firebase)
- [ ] Conectar com página de vendas GODTIME.AI

---

*Desenvolvido em março de 2026 · Godtime.AI · Robson Melo*

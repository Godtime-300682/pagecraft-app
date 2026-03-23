---
name: PageCraft App — Documentação Completa
description: Documentação técnica completa do aplicativo PageCraft criado para Robson Melo (Godtime.AI) — arquitetura, rotas, componentes, integrações e decisões técnicas
type: project
---

# PageCraft App — Sales Page Factory

## Repositório
**https://github.com/Godtime-300682/pagecraft-app**
Branch: `master` · Visibilidade: público

## Localização Local
`C:\Users\Usuário\pagecraft-app\`

## Stack Técnica
- **Frontend:** React 18 + Vite
- **Estilização:** Tailwind CSS via CDN + estilos inline (inline styles dominam)
- **Roteamento:** React Router v6
- **Estado global:** Zustand com persist middleware (localStorage)
- **IA:** Google Gemini API — modelo atual `gemini-3.1-flash-lite-preview`
- **Vídeo:** Canvas 2D + MediaRecorder API → export `.webm`
- **Imagens:** Canvas 2D → export `.png` (1080×1080)
- **Fontes:** Inter + JetBrains Mono (Google Fonts)
- **Dev server:** `npm run dev` → http://localhost:5173

## Design System
- **Tema:** Dark — Mission Control / SpaceX aesthetic
- **Background:** `#030712` (página) / `#0d1117` (cards)
- **Accent:** `#06b6d4` (ciano)
- **Borders:** `#1f2937`
- **Text:** `#f9fafb` (primário) / `#9ca3af` (secundário) / `#6b7280` (muted)
- **Success:** `#22c55e` · **Danger:** `#ef4444` · **Purple:** `#a855f7`
- **Grid sutil:** `rgba(255,255,255,0.022)` em todos os canvas

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
│       └── SettingsPage.jsx       # Configurações (API key, preferências)
├── package.json
├── vite.config.js
└── index.html
```

## Rotas (React Router v6)
| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | redirect → `/login` ou `/dashboard` | Auth guard |
| `/login` | LoginPage | Inserir API Key Gemini |
| `/dashboard` | DashboardPage | Home com métricas |
| `/nova-pagina` | NewSalesPageWizard | Wizard 5 etapas |
| `/vsl` | VSLCreatorPage | Gerador VSL + vídeo |
| `/criativos` | CreativesPage | Gerador criativos PNG/vídeo |
| `/projetos` | ProjectsPage | Histórico |
| `/configuracoes` | SettingsPage | Settings |

## Autenticação
- **Sem backend** — API key armazenada em `localStorage` via Zustand
- `RequireAuth` HOC no App.jsx redireciona para `/login` se sem key
- Validação da key na LoginPage chamando `validateApiKey()` do `gemini.js`

## Integração Gemini (`src/lib/gemini.js`)
```javascript
// Modelo atual (atualizar se mudar)
model: "gemini-3.1-flash-lite-preview"

// Funções exportadas:
getGeminiClient()           // retorna GoogleGenerativeAI com key do localStorage
generateWithGemini(prompt, onStream?)  // suporta streaming
validateApiKey(key)         // valida antes do login
```
**Histórico de modelos testados:**
- `gemini-1.5-flash` → descontinuado (404)
- `gemini-2.0-flash` → não disponível para novos usuários (404)
- `gemini-2.0-flash-lite` → testado, substituído
- `gemini-3.1-flash-lite-preview` → ✅ funcionando (conta Robson)

## Estado Global (`src/store/useStore.js`)
Zustand com persist → localStorage key `pagecraft-storage`
```javascript
{
  projects: [],        // array de projetos salvos
  addProject(p),
  removeProject(id),
  settings: { geminiKey, ... }
}
```
**Tipos de projeto** (campo `type`):
- `'pagina'` — páginas de vendas (wizard)
- `'vsl'` — scripts VSL
- `'criativo'` — criativos gerados

## Módulo VSL Creator (`VSLCreatorPage.jsx`)
**Fluxo:**
1. Formulário: produto, público, duração (5/10/15min), tom de voz, preço
2. Chama Gemini com `vslPrompt(form)` → JSON com seções
3. Exibe script organizado por seção com cores por tipo
4. Botão **"▶ Gerar Vídeo"** → `renderVSLVideo()`

**Geração de vídeo:**
- Canvas 1280×720 · 30fps · 5Mbps
- MediaRecorder → `video/webm;codecs=vp9`
- Duração configurável: 6 / 10 / 15 / 20 segundos por seção
- Cada seção = 1 slide animado com: título, texto, barra de progresso
- Download: `.webm` nomeado pelo produto

**Animação por slide:**
- 0-8%: accent bar preenche da esquerda
- 8-30%: título da seção entra deslizando da esquerda (easeOut)
- 28-100%: texto do roteiro aparece palavra por palavra
- 70%+: nota de produção (amarelo) fade in
- 88-100%: fade out para próximo slide

## Módulo Criativos (`CreativesPage.jsx`)
**Layout:** painel esquerdo (300px form) + painel direito (preview)

**Formulário:**
- Toggle Plataforma: Meta / Google / TikTok
- Toggle Modo: Imagem Única (3 variações) / Carrossel (5 cards)
- Toggle Estilo: Foto + Texto / Design Pro
- Textarea estratégia (principal input para IA)
- Input guia de estilo visual (opcional)
- Upload foto especialista → aparece circular no canto do criativo

**Geração de imagem (PNG 1080×1080):**
- Canvas 2D com: gradient background, grid sutil, accent bar, badge plataforma/ângulo
- Foto especialista em círculo (canto superior direito) com glow
- Hook (itálico) → Headline (grande bold) → Accent bar → Subheadline → Body → CTA pill
- Marca "PAGECRAFT.AI" no rodapé
- Download individual por card ou "Baixar Todos" (sequencial com delay 300ms)

**Geração de vídeo (WebM 1080×1080, 20 segundos) por criativo:**
- Mesmo Canvas mas animado com `requestAnimationFrame`
- Timeline: 0-15% badge | 15-30% hook | 30-65% headline palavra a palavra | 65-85% subheadline+body | 83-100% CTA pulsante
- Fade in (0-5%) e fade out (92-100%)
- Estado por card: `idle → rendering → done`
- Download: `.webm` nomeado pelo ângulo emocional

**Ângulos emocionais e cores:**
```javascript
'Dor' → #ef4444 (vermelho)
'Desejo' → #22c55e (verde)
'Curiosidade' → #a855f7 (roxo)
'Prova Social' → #06b6d4 (ciano)
'Urgência' → #eab308 (amarelo)
'Autoridade' → #3b82f6 (azul)
```

**Histórico:** aba "Histórico" mostra projetos do Zustand com `type === 'criativo'`. Clique carrega resultado de volta na aba Gerador.

## Módulo Wizard Página de Vendas (`NewSalesPageWizard.jsx`)
5 etapas progressivas usando PASTOR + ACCA frameworks:
1. Briefing básico (produto, público, ticket)
2. Estratégia e framework
3. Geração de copy por seção
4. Análise e score (Bencivenga Persuasion Equation)
5. Export HTML

## Comandos Úteis
```bash
# Rodar em dev
cd C:/Users/Usuário/pagecraft-app
npm run dev

# Build produção
npm run build

# Push para GitHub
git add .
git commit -m "mensagem"
git push
```

## Decisões Técnicas Importantes
- **Sem backend** — tudo roda no browser, sem servidor próprio
- **API key do usuário** — cada usuário usa sua própria key Gemini (sem custo para o produto)
- **Vídeo em tempo real** — MediaRecorder grava o canvas em tempo real (não há aceleração de renderização)
- **Canvas nativo** — não usa bibliotecas de imagem (Fabric.js, Konva) para manter bundle pequeno
- **Inline styles** — preferidos sobre Tailwind para componentes canvas-heavy (mais controle preciso)
- **Zustand persist** — projetos e settings sobrevivem ao refresh sem backend

## Pendências / Próximos Passos
- [ ] Adicionar export de imagem para Stories (1080×1920)
- [ ] Integração com Remotion para vídeos mais elaborados (`/remotion-video` skill)
- [ ] Deploy em produção (Vercel recomendado — drag & drop da pasta `dist/`)
- [ ] Adicionar autenticação real (Supabase ou Firebase) para multi-usuário
- [ ] Conectar com página de vendas GODTIME.AI gerada neste projeto

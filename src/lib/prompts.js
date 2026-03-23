/**
 * All prompts for PageCraft — output always in Brazilian Portuguese
 * Based on Russell Brunson (DotCom Secrets / Expert Secrets) and Alex Hormozi ($100M Offers) frameworks
 */

export function strategyPrompt(briefing) {
  return `Você é um estrategista de marketing direto de elite, especialista em copywriting de alta conversão.
Analise este briefing e crie uma estratégia completa de página de vendas.

BRIEFING:
- Produto/Serviço: ${briefing.produto}
- Descrição: ${briefing.descricao}
- Preço/Ticket: ${briefing.preco}
- Público-Alvo: ${briefing.publico}
- Tom de Voz: ${briefing.tom}
- Provas Sociais disponíveis: ${briefing.provas.join(', ')}

Selecione o melhor framework de copywriting para este produto entre:
1. PASTOR (Problem-Amplify-Story-Testimony-Offer-Response)
2. AIDA (Atenção-Interesse-Desejo-Ação)
3. Hero's Journey + VSL Hybrid
4. Problem-Solution-Results (Alex Hormozi style)
5. Story Brand Framework

Responda em JSON válido com esta estrutura exata:
{
  "framework": "nome do framework",
  "justificativa": "por que este framework é ideal para este produto/público",
  "mapa_pagina": ["Seção 1: descrição", "Seção 2: descrição", "Seção 3: descrição", "..."],
  "angulos_copy": ["Ângulo 1: descrição", "Ângulo 2: descrição", "Ângulo 3: descrição"],
  "big_idea": "A grande ideia central da página",
  "promessa_principal": "A promessa principal do produto",
  "objecoes_principais": ["Objeção 1", "Objeção 2", "Objeção 3"],
  "gatilhos_mentais": ["Gatilho 1", "Gatilho 2", "Gatilho 3", "Gatilho 4"]
}`;
}

export function heroPrompt(briefing, strategy) {
  return `Você é um copywriter de resposta direta de elite. Crie 3 variações de Hero Section para esta página de vendas.
Escreva em Português do Brasil, tom: ${briefing.tom}.

PRODUTO: ${briefing.produto}
PÚBLICO: ${briefing.publico}
PREÇO: ${briefing.preco}
BIG IDEA: ${strategy.big_idea}
PROMESSA: ${strategy.promessa_principal}
FRAMEWORK: ${strategy.framework}

Crie 3 variações de hero com headline, subheadline e CTA. Use fórmulas poderosas:
- Variação 1: Focada na DOR/PROBLEMA principal
- Variação 2: Focada na TRANSFORMAÇÃO/RESULTADO
- Variação 3: Curiosidade + Mecanismo único

Responda em JSON:
{
  "variacoes": [
    {
      "tipo": "Dor/Problema",
      "headline": "...",
      "subheadline": "...",
      "cta": "..."
    },
    {
      "tipo": "Transformação",
      "headline": "...",
      "subheadline": "...",
      "cta": "..."
    },
    {
      "tipo": "Curiosidade + Mecanismo",
      "headline": "...",
      "subheadline": "...",
      "cta": "..."
    }
  ]
}`;
}

export function sectionPrompt(sectionName, briefing, strategy) {
  const sectionGuides = {
    problema: `Escreva a seção de PROBLEMA/DOR.
Agite a dor do público usando o método PAS (Problem-Agitate-Solution).
Mostre que você entende profundamente a frustração deles.
Tom empático mas direto. 3-5 parágrafos impactantes.`,

    amplificacao: `Escreva a seção de AMPLIFICAÇÃO DA DOR.
Mostre as consequências de NÃO resolver o problema.
Use bullets de dor específica e real. Faça o leitor pensar: "Isso sou EU".
Tom urgente. 1 parágrafo intro + 5-7 bullets + 1 parágrafo de transição.`,

    historia: `Escreva a seção de HISTÓRIA/AUTORIDADE.
Use storytelling poderoso seguindo a jornada do herói.
Mostre o "antes" difícil, o momento de virada, e o "depois" transformado.
Crie conexão emocional genuína. 4-6 parágrafos narrativos.`,

    mecanismo: `Escreva a seção do MECANISMO ÚNICO.
Explique POR QUE este produto funciona quando outros falharam.
Dê um nome especial ao método/sistema. Explique a ciência/lógica por trás.
3-4 parágrafos + bullets explicativos.`,

    transformacao: `Escreva a seção de TRANSFORMAÇÃO.
Pinte o "quadro de depois" — a vida do cliente após usar o produto.
Seja específico e visual. Use presente do indicativo para tornar real.
2-3 parágrafos + bullets de resultados específicos.`,

    'para-quem': `Escreva a seção "PARA QUEM É ESTE PRODUTO".
Liste quem é o público ideal (5-6 bullets de qualificação positiva).
Depois liste quem NÃO é (3-4 bullets — isso aumenta credibilidade).
Tom direto e seguro.`,

    oferta: `Escreva a seção de OFERTA / VALUE STACK completa.
Apresente o produto principal com valor percebido alto.
Liste todos os bônus com valor individual.
Calcule o valor total vs. o preço real.
Use formatação: "Você recebe: X (valor R$X), Y (valor R$X)..."
CTA forte ao final.`,

    depoimentos: `Escreva a seção de DEPOIMENTOS/PROVA SOCIAL.
Crie o copy de apresentação dos depoimentos (não invente os depoimentos).
Texto de intro que maximiza a credibilidade.
Use as provas disponíveis: ${briefing.provas.join(', ')}.
3-4 parágrafos de contexto + chamada para os depoimentos.`,

    faq: `Crie 8 perguntas e respostas frequentes (FAQ) estratégicas.
As perguntas devem quebrar objeções e aumentar conversão.
Objeções a responder: ${strategy.objecoes_principais ? strategy.objecoes_principais.join(', ') : 'preço, tempo, funciona pra mim, garantia'}
Responda em JSON:
{
  "faqs": [
    {"pergunta": "...", "resposta": "..."},
    ...
  ]
}`,

    garantia: `Escreva a seção de GARANTIA.
Crie uma garantia irresistível que elimine 100% do risco.
Nome criativo para a garantia. Período de 7, 15 ou 30 dias.
Tom confiante e desafiador. "Você não tem nada a perder, mas tudo a ganhar."
2-3 parágrafos poderosos.`,

    'cta-final': `Escreva o CTA FINAL da página.
Último push de conversão. Combine urgência + escassez + FOMO.
Relembre o preço e o valor. Última chamada.
2-3 parágrafos + CTA button text + texto de urgência.`,

    footer: `Escreva o texto do FOOTER da página de vendas.
Inclua: aviso de direitos, disclaimers de resultados, política de privacidade (resumo), termos de uso (resumo).
Tom formal e legal. Proteja juridicamente.`
  };

  const guide = sectionGuides[sectionName] || `Escreva a seção "${sectionName}" seguindo as melhores práticas de copywriting de alta conversão.`;

  return `Você é um copywriter de resposta direta de elite, especializado em páginas de vendas de alta conversão.
Escreva em Português do Brasil. Tom: ${briefing.tom}.

PRODUTO: ${briefing.produto}
DESCRIÇÃO: ${briefing.descricao}
PÚBLICO: ${briefing.publico}
PREÇO: ${briefing.preco}
FRAMEWORK: ${strategy.framework}
PROMESSA: ${strategy.promessa_principal || 'Transformação completa'}

INSTRUÇÃO PARA ESTA SEÇÃO:
${guide}

Escreva APENAS o copy desta seção. Seja específico, poderoso e orientado à conversão.
Use linguagem natural em PT-BR, evite clichês genéricos. Seja autêntico e direto.`;
}

export function vslPrompt(briefing) {
  return `Você é um especialista em VSL (Video Sales Letter) e roteiros de vendas em vídeo.
Crie um roteiro VSL completo em Português do Brasil.

PRODUTO: ${briefing.produto}
PÚBLICO-ALVO: ${briefing.publico}
DURAÇÃO ALVO: ${briefing.duracao} minutos
TOM: ${briefing.tom}
DESCRIÇÃO: ${briefing.descricao}
PREÇO: ${briefing.preco}

Crie um roteiro VSL completo seguindo esta estrutura EXATA:

ESTRUTURA DO VSL (baseada em Frank Kern + Russell Brunson):
1. HOOK (primeiros 30 segundos) — Captura atenção imediata
2. PROMESSA — O que o espectador vai aprender/ganhar
3. CREDENCIAIS — Por que você é a pessoa certa para ensinar isso
4. PROBLEMA — A dor que ele está sentindo agora
5. AGRAVAMENTO — O que acontece se continuar assim
6. HISTÓRIA — Sua jornada pessoal ou de um cliente
7. SOLUÇÃO/REVELAÇÃO — O método/sistema único
8. PROVA — Resultados e depoimentos
9. OFERTA + VALUE STACK — O que está sendo vendido
10. GARANTIA — Eliminar risco
11. CTA + URGÊNCIA — Chamada para ação com escassez
12. CLOSE — Últimas palavras persuasivas

Responda em JSON:
{
  "titulo_vsl": "...",
  "duracao_estimada": "X minutos",
  "secoes": [
    {
      "nome": "Hook",
      "tempo_estimado": "0:00 - 0:30",
      "roteiro": "...",
      "notas_producao": "..."
    },
    ...
  ],
  "total_palavras": 0,
  "notas_gerais": "..."
}`;
}

export function creativesPrompt(briefing, platform, count) {
  const platformGuides = {
    Meta: "Facebook e Instagram Ads. Foque em storytelling emocional, hooks de feed, mobile-first.",
    Google: "Google Ads (Search + Display). Foque em intenção de busca, palavras-chave, clareza direta.",
    TikTok: "TikTok Ads. Foque em hooks rápidos (primeiros 3 segundos), tendências, linguagem jovem e autêntica."
  };

  return `Você é um especialista em performance marketing e criação de anúncios de alta conversão.
Crie ${count} criativos completos para ${platform} Ads em Português do Brasil.

PRODUTO: ${briefing.produto}
OBJETIVO: ${briefing.objetivo}
PÚBLICO: ${briefing.publico}
PLATAFORMA: ${platform} — ${platformGuides[platform] || 'Anúncios digitais'}
PREÇO: ${briefing.preco}

Para cada criativo, crie variações testando diferentes ângulos emocionais:
- Dor/Frustração
- Desejo/Aspiração
- Curiosidade/Mistério
- Prova Social/FOMO
- Autoridade/Credibilidade

Responda em JSON:
{
  "criativos": [
    {
      "numero": 1,
      "angulo": "nome do ângulo emocional",
      "headline_primario": "...",
      "headline_secundario": "...",
      "body_copy": "...",
      "cta": "...",
      "hook_variacao": "...",
      "formato_sugerido": "imagem/video/carrossel",
      "notas": "sugestão visual ou de produção"
    }
  ]
}`;
}

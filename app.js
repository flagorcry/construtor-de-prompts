/* =========================================================================
   Construtor de Prompts de Excelência — lógica principal (vanilla JS)
   Sem dependências. Estado em memória + templates no localStorage.
   ========================================================================= */

"use strict";

const STORAGE_KEY = "promptbuilder.templates";

/* -------------------------------------------------------------------------
   Definição dos blocos (metodologias de um bom prompt).
   weight = peso no score de qualidade.
   ------------------------------------------------------------------------- */
const BLOCKS = [
  {
    key: "papel",
    emoji: "🎭",
    title: "Papel / Persona",
    help: "Quem a IA deve ser. Especialista em quê? Com qual experiência?",
    placeholder: "Você é um engenheiro de software sênior, especialista em Python e boas práticas de código.",
    weight: 15,
  },
  {
    key: "contexto",
    emoji: "🧭",
    title: "Contexto",
    help: "Situação, público-alvo, stack, dados disponíveis e restrições do ambiente.",
    placeholder: "Trabalho em um projeto de API REST em FastAPI, com PostgreSQL. O código será revisado por colegas.",
    weight: 15,
  },
  {
    key: "tarefa",
    emoji: "🎯",
    title: "Tarefa",
    help: "O objetivo específico e mensurável. Seja direto sobre o que você quer.",
    placeholder: "Implemente uma função que valida CPF, com tratamento de erros e testes unitários.",
    weight: 25,
  },
  {
    key: "formato",
    emoji: "📐",
    title: "Formato de saída",
    help: "Estrutura, tom e tamanho. Ex.: blocos de código, tabela, JSON, lista, máx. N linhas.",
    placeholder: "Responda com o código em um bloco, seguido de uma explicação curta em tópicos.",
    weight: 15,
  },
  {
    key: "exemplos",
    emoji: "💡",
    title: "Exemplos (few-shot)",
    help: "Demonstre o padrão desejado com pares entrada → saída. Opcional, mas poderoso.",
    placeholder: "Entrada: \"529.982.247-25\" → Saída: válido\nEntrada: \"111.111.111-11\" → Saída: inválido",
    weight: 10,
  },
  {
    key: "raciocinio",
    emoji: "🧠",
    title: "Raciocínio",
    help: "Peça que a IA pense passo a passo antes de responder, quando o problema for complexo.",
    placeholder: "Pense passo a passo: analise o requisito, considere casos de borda e só então escreva a solução.",
    weight: 10,
  },
  {
    key: "restricoes",
    emoji: "🚧",
    title: "Restrições / Critérios de qualidade",
    help: "O que evitar e o que priorizar. Limites, premissas e padrões de qualidade.",
    placeholder: "Não use bibliotecas externas. Trate todos os erros. Não invente dados — sinalize suposições.",
    weight: 10,
  },
];

/* Títulos usados ao montar o prompt em Markdown */
const OUTPUT_HEADINGS = {
  papel: "Papel",
  contexto: "Contexto",
  tarefa: "Tarefa",
  formato: "Formato de saída",
  exemplos: "Exemplos",
  raciocinio: "Raciocínio",
  restricoes: "Restrições e critérios de qualidade",
};

/* -------------------------------------------------------------------------
   Presets por área de uso.
   ------------------------------------------------------------------------- */
const PRESETS = {
  programacao: {
    papel: "Você é um engenheiro de software sênior, especialista em {linguagem}, focado em código limpo, legível e bem testado.",
    contexto: "Descreva aqui o projeto, a stack, as versões e como o código será usado/revisado.",
    tarefa: "Descreva a funcionalidade ou problema de código a resolver, de forma específica.",
    formato: "Responda com o código em um único bloco, seguido de uma explicação curta em tópicos. Comente apenas trechos não óbvios.",
    exemplos: "",
    raciocinio: "Pense passo a passo: analise o requisito, considere casos de borda e só então escreva a solução.",
    restricoes: "Siga boas práticas e o estilo idiomático da linguagem. Trate erros. Evite dependências desnecessárias. Não invente APIs.",
  },
  dados: {
    papel: "Você é um analista de dados experiente, rigoroso com metodologia e transparente sobre suposições.",
    contexto: "Descreva a origem dos dados, o formato, o volume e a pergunta de negócio por trás da análise.",
    tarefa: "Descreva o que você quer extrair, analisar ou classificar a partir dos dados.",
    formato: "Apresente o resultado em uma tabela Markdown ou JSON estruturado. Liste insights principais em tópicos.",
    exemplos: "",
    raciocinio: "Pense passo a passo: explicite as suposições, mostre o caminho da análise e depois conclua.",
    restricoes: "Não invente dados nem resultados. Sinalize incertezas e suposições. Cite quais cálculos foram usados.",
  },
  escrita: {
    papel: "Você é um redator profissional, claro e envolvente, que adapta o tom ao público.",
    contexto: "Descreva o público-alvo, o canal (blog, e-mail, rede social) e o objetivo do texto.",
    tarefa: "Descreva o que deve ser escrito e qual ação ou sentimento você quer provocar no leitor.",
    formato: "Defina tom, tamanho e estrutura (ex.: 3 parágrafos, lista, com chamada para ação no final).",
    exemplos: "",
    raciocinio: "",
    restricoes: "Linguagem natural e direta. Evite clichês e jargão. Não invente fatos.",
  },
};

/* -------------------------------------------------------------------------
   Categorias e biblioteca de modelos prontos
   ------------------------------------------------------------------------- */
const CATEGORIES = [
  { id: "escrita", label: "Escrita & Conteúdo", icon: "✍️" },
  { id: "marketing", label: "Marketing & Vendas", icon: "📣" },
  { id: "codigo", label: "Programação", icon: "💻" },
  { id: "dados", label: "Dados & Análise", icon: "📊" },
  { id: "aprendizado", label: "Aprendizado", icon: "🎓" },
  { id: "carreira", label: "Carreira", icon: "💼" },
  { id: "produtividade", label: "Produtividade", icon: "⚡" },
  { id: "criatividade", label: "Criatividade", icon: "🎨" },
];

const MODELS = [
  {
    cat: "escrita", icon: "📝", title: "Post para LinkedIn",
    desc: "Cria um post envolvente, com gancho forte na primeira linha e chamada para interação.",
    blocks: {
      papel: "Você é um especialista em conteúdo para LinkedIn que escreve posts autênticos e que geram engajamento.",
      contexto: "Tema do post: [DESCREVA]. Público: [ex.: profissionais de tecnologia]. Objetivo: gerar discussão e autoridade.",
      tarefa: "Escreva um post de LinkedIn sobre o tema, com um gancho de impacto na primeira linha, desenvolvimento em frases curtas e uma pergunta final que convide ao comentário.",
      formato: "Texto corrido com quebras de linha curtas (estilo LinkedIn), 120 a 200 palavras, tom pessoal e profissional. Sugira 3 a 5 hashtags relevantes.",
      restricoes: "Evite clichês de 'coach'. Nada de emojis em excesso. Não invente números ou citações.",
    },
  },
  {
    cat: "escrita", icon: "📰", title: "Artigo de blog (SEO)",
    desc: "Estrutura um artigo otimizado para busca, com títulos, subtítulos e palavra-chave.",
    blocks: {
      papel: "Você é um redator de conteúdo especialista em SEO.",
      contexto: "Palavra-chave principal: [PALAVRA]. Público e intenção de busca: [DESCREVA].",
      tarefa: "Escreva um artigo completo otimizado para a palavra-chave, com introdução que prende, seções com subtítulos e uma conclusão com chamada para ação.",
      formato: "Markdown com H1, H2 e H3. 800 a 1200 palavras. Inclua a palavra-chave no título e nos subtítulos de forma natural.",
      restricoes: "Sem 'keyword stuffing'. Linguagem clara. Não invente estatísticas — marque com [fonte] onde dados forem necessários.",
    },
  },
  {
    cat: "escrita", icon: "✉️", title: "E-mail profissional",
    desc: "Redige um e-mail claro, educado e objetivo a partir dos pontos que você quer passar.",
    blocks: {
      papel: "Você é um assistente de comunicação profissional.",
      contexto: "Destinatário: [QUEM]. Relação: [ex.: cliente, chefe]. Pontos a passar: [LISTE].",
      tarefa: "Escreva um e-mail que comunique os pontos com clareza e cordialidade, com assunto sugerido e uma ação clara para o destinatário.",
      formato: "Assunto + corpo. Máximo 150 palavras. Tom profissional e cordial.",
      restricoes: "Direto ao ponto, sem rodeios. Não prometa nada que não esteja nos pontos fornecidos.",
    },
  },
  {
    cat: "escrita", icon: "🔄", title: "Reescrever / melhorar texto",
    desc: "Aprimora clareza, tom e gramática de um texto que você já tem, mantendo o sentido.",
    blocks: {
      papel: "Você é um editor de texto experiente.",
      contexto: "Texto original: [COLE AQUI]. Tom desejado: [ex.: formal, descontraído].",
      tarefa: "Reescreva o texto melhorando clareza, fluidez e correção, mantendo a mensagem original e o tom pedido.",
      formato: "Devolva apenas a versão final, seguida de uma lista curta das principais mudanças feitas.",
      restricoes: "Não altere o significado nem adicione informação nova. Preserve o que já está bom.",
    },
  },
  {
    cat: "marketing", icon: "🧲", title: "Copywriting AIDA",
    desc: "Texto de venda na estrutura Atenção, Interesse, Desejo e Ação.",
    blocks: {
      papel: "Você é um copywriter sênior especialista em conversão.",
      contexto: "Produto/serviço: [DESCREVA]. Público: [QUEM]. Dor que resolve: [DOR].",
      tarefa: "Escreva um texto de venda usando a estrutura AIDA: capture a Atenção, gere Interesse, desperte o Desejo e termine com uma Ação clara.",
      formato: "Marque cada etapa (Atenção / Interesse / Desejo / Ação). Tom persuasivo, porém honesto. Máx. 250 palavras.",
      restricoes: "Sem promessas exageradas ou enganosas. Foque em benefícios reais para o cliente.",
    },
  },
  {
    cat: "marketing", icon: "🛍️", title: "Descrição de produto",
    desc: "Descrição que destaca benefícios e converte, a partir das características do produto.",
    blocks: {
      papel: "Você é um especialista em e-commerce e descrições que vendem.",
      contexto: "Produto e características: [LISTE]. Público: [QUEM].",
      tarefa: "Transforme as características em benefícios e escreva uma descrição atraente que ajude na decisão de compra.",
      formato: "Um parágrafo de abertura + bullets de benefícios + frase de fechamento. Máx. 180 palavras.",
      restricoes: "Não invente especificações. Linguagem que conecta característica → benefício para o cliente.",
    },
  },
  {
    cat: "marketing", icon: "💥", title: "Títulos magnéticos",
    desc: "Gera várias opções de título/headline para testar qual converte melhor.",
    blocks: {
      papel: "Você é especialista em headlines de alta conversão.",
      contexto: "Assunto/oferta: [DESCREVA]. Canal: [ex.: anúncio, e-mail, blog].",
      tarefa: "Gere 10 títulos variando os ângulos: curiosidade, benefício, urgência, número e pergunta.",
      formato: "Lista numerada de 10 títulos, indicando entre parênteses o ângulo de cada um.",
      restricoes: "Sem clickbait enganoso. Cada título deve refletir a oferta real.",
    },
  },
  {
    cat: "codigo", icon: "⚙️", title: "Gerar função com testes",
    desc: "Implementa uma função robusta, com tratamento de erros e testes unitários.",
    blocks: {
      papel: "Você é um engenheiro de software sênior, especialista em [LINGUAGEM] e código testável.",
      contexto: "Stack e versão: [DESCREVA]. Onde a função será usada: [CONTEXTO].",
      tarefa: "Implemente [DESCREVA A FUNÇÃO], cobrindo casos de borda, com tratamento de erros e testes unitários.",
      formato: "Código em um bloco, seguido dos testes em outro bloco e uma explicação curta em tópicos.",
      raciocinio: "Pense passo a passo: requisitos, casos de borda, implementação e depois os testes.",
      restricoes: "Siga o estilo idiomático da linguagem. Sem dependências desnecessárias. Não invente APIs.",
    },
  },
  {
    cat: "codigo", icon: "🔍", title: "Code review",
    desc: "Revisa um trecho de código apontando bugs, riscos e melhorias.",
    blocks: {
      papel: "Você é um revisor de código rigoroso e construtivo.",
      contexto: "Código a revisar: [COLE]. Linguagem e objetivo: [DESCREVA].",
      tarefa: "Revise o código identificando bugs, riscos de segurança, problemas de legibilidade e oportunidades de simplificação.",
      formato: "Liste os achados por severidade (Alta / Média / Baixa), cada um com o porquê e a sugestão de correção.",
      restricoes: "Seja específico e cite as linhas. Não reescreva tudo — foque no que importa.",
    },
  },
  {
    cat: "codigo", icon: "🧑‍🏫", title: "Explicar código",
    desc: "Explica um código de forma clara, ideal para aprender ou documentar.",
    blocks: {
      papel: "Você é um mentor de programação que explica com clareza.",
      contexto: "Código: [COLE]. Nível de quem vai ler: [ex.: iniciante].",
      tarefa: "Explique o que o código faz, como funciona passo a passo e por que foi feito assim.",
      formato: "Resumo em uma frase + explicação em tópicos linha a linha quando útil.",
      restricoes: "Adapte a profundidade ao nível indicado. Não assuma conhecimento que o leitor não tem.",
    },
  },
  {
    cat: "codigo", icon: "🐞", title: "Debugar erro",
    desc: "Ajuda a encontrar a causa de um erro a partir da mensagem e do código.",
    blocks: {
      papel: "Você é um especialista em depuração de software.",
      contexto: "Mensagem de erro: [COLE]. Código relevante: [COLE]. O que eu esperava: [DESCREVA].",
      tarefa: "Identifique a causa provável do erro, explique por que acontece e proponha a correção.",
      formato: "Causa provável → explicação → correção (com código) → como evitar no futuro.",
      raciocinio: "Pense passo a passo, levantando hipóteses e eliminando-as.",
      restricoes: "Se faltar informação para concluir, diga o que precisa ser verificado.",
    },
  },
  {
    cat: "dados", icon: "📈", title: "Análise exploratória",
    desc: "Roteiro de análise para entender um conjunto de dados e gerar insights.",
    blocks: {
      papel: "Você é um analista de dados experiente e rigoroso com metodologia.",
      contexto: "Dados disponíveis (colunas/amostra): [DESCREVA]. Pergunta de negócio: [DESCREVA].",
      tarefa: "Proponha uma análise exploratória: o que investigar, quais métricas e cruzamentos, e quais insights buscar.",
      formato: "Lista de passos da análise + insights esperados em tópicos.",
      raciocinio: "Explicite as suposições antes de concluir.",
      restricoes: "Não invente dados nem resultados. Sinalize incertezas.",
    },
  },
  {
    cat: "dados", icon: "🗄️", title: "Gerar consulta SQL",
    desc: "Escreve uma query SQL a partir da descrição do que você quer extrair.",
    blocks: {
      papel: "Você é um especialista em SQL e modelagem de dados.",
      contexto: "Tabelas e colunas relevantes: [DESCREVA]. Banco: [ex.: PostgreSQL].",
      tarefa: "Escreva a consulta SQL que retorna [DESCREVA O RESULTADO DESEJADO].",
      formato: "Query em um bloco, seguida de uma explicação curta do que cada parte faz.",
      restricoes: "Use apenas tabelas/colunas informadas. Otimize quando possível. Sinalize suposições sobre o schema.",
    },
  },
  {
    cat: "dados", icon: "📋", title: "Interpretar métricas",
    desc: "Traduz números e relatórios em insights e recomendações de negócio.",
    blocks: {
      papel: "Você é um analista que conecta dados a decisões de negócio.",
      contexto: "Métricas/relatório: [COLE]. Contexto do negócio: [DESCREVA].",
      tarefa: "Interprete os números, destaque o que é relevante e proponha próximas ações.",
      formato: "Principais leituras (tópicos) → riscos/oportunidades → recomendações priorizadas.",
      restricoes: "Não extrapole além do que os dados mostram. Diferencie correlação de causa.",
    },
  },
  {
    cat: "aprendizado", icon: "🧒", title: "Explique para iniciante (ELI5)",
    desc: "Explica qualquer assunto complexo de forma simples, com analogias.",
    blocks: {
      papel: "Você é um professor que explica temas complexos de forma simples e cativante.",
      contexto: "Tema: [DESCREVA]. Para quem: alguém sem conhecimento prévio.",
      tarefa: "Explique o tema como se eu tivesse 12 anos, usando uma analogia do dia a dia e um exemplo concreto.",
      formato: "Analogia → explicação simples → exemplo → resumo em uma frase.",
      restricoes: "Sem jargão. Se usar um termo técnico, explique na hora.",
    },
  },
  {
    cat: "aprendizado", icon: "🗺️", title: "Tutor & plano de estudos",
    desc: "Monta um plano de aprendizado passo a passo para dominar um tema.",
    blocks: {
      papel: "Você é um tutor que cria trilhas de estudo personalizadas.",
      contexto: "O que quero aprender: [TEMA]. Nível atual: [ex.: iniciante]. Tempo disponível: [ex.: 1h/dia].",
      tarefa: "Crie um plano de estudos progressivo com etapas, o que estudar em cada uma e como praticar.",
      formato: "Cronograma em etapas, cada uma com objetivo, recursos sugeridos e um exercício prático.",
      restricoes: "Realista para o tempo informado. Comece pelo fundamental antes do avançado.",
    },
  },
  {
    cat: "aprendizado", icon: "📚", title: "Resumir texto longo",
    desc: "Condensa um texto extenso mantendo os pontos essenciais.",
    blocks: {
      papel: "Você é um especialista em síntese de informação.",
      contexto: "Texto a resumir: [COLE]. Para que vou usar o resumo: [DESCREVA].",
      tarefa: "Resuma o texto destacando as ideias centrais e as conclusões, sem perder nuances importantes.",
      formato: "Resumo em 5 a 7 tópicos + uma frase final com a ideia principal.",
      restricoes: "Fidelidade ao original. Não adicione opiniões nem informação externa.",
    },
  },
  {
    cat: "carreira", icon: "📄", title: "Revisão de currículo",
    desc: "Aprimora descrições do currículo com foco em resultados e impacto.",
    blocks: {
      papel: "Você é um recrutador sênior que sabe o que destaca um currículo.",
      contexto: "Vaga-alvo: [DESCREVA]. Trecho do currículo: [COLE].",
      tarefa: "Reescreva as experiências com foco em resultados mensuráveis e alinhamento à vaga.",
      formato: "Versão melhorada em bullets (verbo de ação + resultado) + dicas do que falta.",
      restricoes: "Não invente conquistas. Trabalhe apenas com o que foi informado, deixando lacunas marcadas.",
    },
  },
  {
    cat: "carreira", icon: "🎤", title: "Preparação para entrevista",
    desc: "Simula perguntas e ajuda a estruturar respostas para uma vaga.",
    blocks: {
      papel: "Você é um coach de carreira que prepara candidatos para entrevistas.",
      contexto: "Vaga: [DESCREVA]. Minha experiência: [RESUMA].",
      tarefa: "Liste perguntas prováveis (técnicas e comportamentais) e ajude a estruturar respostas no método STAR.",
      formato: "Perguntas agrupadas por tipo, cada uma com um roteiro de resposta em tópicos.",
      restricoes: "Respostas honestas baseadas na experiência informada. Sem exageros.",
    },
  },
  {
    cat: "produtividade", icon: "🧠", title: "Brainstorm estruturado",
    desc: "Gera ideias variadas e organizadas para um problema ou objetivo.",
    blocks: {
      papel: "Você é um facilitador de brainstorming criativo e organizado.",
      contexto: "Desafio/objetivo: [DESCREVA]. Restrições: [SE HOUVER].",
      tarefa: "Gere ideias diversas, agrupadas por abordagem, do mais seguro ao mais ousado.",
      formato: "Ideias em grupos temáticos. Ao final, destaque as 3 mais promissoras e por quê.",
      restricoes: "Priorize variedade na geração; só filtre no final.",
    },
  },
  {
    cat: "produtividade", icon: "📝", title: "Resumo de reunião + ações",
    desc: "Transforma anotações de reunião em resumo e lista de próximos passos.",
    blocks: {
      papel: "Você é um assistente que organiza reuniões com clareza.",
      contexto: "Anotações/transcrição: [COLE].",
      tarefa: "Resuma as decisões e extraia os itens de ação com responsável e prazo quando mencionados.",
      formato: "Resumo em tópicos + tabela de ações (item | responsável | prazo).",
      restricoes: "Use apenas o que está nas anotações. Marque como [a definir] o que não foi dito.",
    },
  },
  {
    cat: "produtividade", icon: "⚖️", title: "Matriz de decisão",
    desc: "Ajuda a decidir entre opções comparando critérios de forma estruturada.",
    blocks: {
      papel: "Você é um consultor que estrutura decisões de forma racional.",
      contexto: "Decisão a tomar: [DESCREVA]. Opções: [LISTE]. Critérios importantes: [LISTE].",
      tarefa: "Compare as opções pelos critérios, com prós e contras, e recomende uma com justificativa.",
      formato: "Tabela opção × critério + recomendação final com o raciocínio.",
      raciocinio: "Pondere os critérios antes de concluir.",
      restricoes: "Seja transparente sobre suposições e incertezas.",
    },
  },
  {
    cat: "criatividade", icon: "💡", title: "Gerador de ideias",
    desc: "Produz ideias originais para conteúdo, produtos, nomes ou campanhas.",
    blocks: {
      papel: "Você é uma fonte inesgotável de ideias criativas e viáveis.",
      contexto: "Para o quê preciso de ideias: [DESCREVA]. Público/estilo: [DESCREVA].",
      tarefa: "Gere 10 ideias originais, cada uma com uma frase explicando o conceito.",
      formato: "Lista numerada de 10 ideias com explicação curta.",
      restricoes: "Evite o óbvio. Misture seguras e ousadas. Mantenha viável para o contexto.",
    },
  },
  {
    cat: "criatividade", icon: "🎬", title: "Roteiro de vídeo curto",
    desc: "Cria roteiro para Reels/Shorts/TikTok com gancho e ritmo.",
    blocks: {
      papel: "Você é um roteirista de vídeos curtos que prendem a atenção.",
      contexto: "Tema/mensagem: [DESCREVA]. Plataforma e duração: [ex.: Reels, 30s].",
      tarefa: "Escreva um roteiro com gancho nos primeiros 3 segundos, desenvolvimento ágil e chamada para ação.",
      formato: "Roteiro por cenas (tempo | fala/narração | sugestão visual).",
      restricoes: "Linguagem natural para falar. Ritmo rápido. Sem enrolação no início.",
    },
  },
];

/* -------------------------------------------------------------------------
   Técnicas de prompt engineering (conteúdo educativo)
   ------------------------------------------------------------------------- */
const TECHNIQUES = [
  {
    icon: "🎭", title: "Atribua um papel",
    desc: "Dizer quem a IA deve ser ativa o conhecimento e o tom certos. Um 'especialista em X' responde diferente de um assistente genérico.",
    eg: "Você é um <strong>advogado especialista em LGPD</strong>. Revise este texto...",
  },
  {
    icon: "💡", title: "Dê exemplos (few-shot)",
    desc: "Mostrar 1 a 3 exemplos do par entrada → saída ensina o padrão melhor do que qualquer descrição. Ideal para formato e estilo consistentes.",
    eg: "Entrada: 'feliz' → Saída: 😊 | Entrada: 'triste' → Saída: <strong>?</strong>",
  },
  {
    icon: "🧠", title: "Peça raciocínio passo a passo",
    desc: "Para problemas de lógica, matemática ou decisão, pedir que a IA 'pense passo a passo' (chain-of-thought) reduz erros significativamente.",
    eg: "<strong>Pense passo a passo</strong> antes de dar a resposta final.",
  },
  {
    icon: "🎯", title: "Seja específico na tarefa",
    desc: "Vago gera vago. Troque 'fale sobre marketing' por um objetivo claro, com escopo, público e resultado esperado.",
    eg: "❌ 'Escreva sobre IA' → ✅ '<strong>Escreva 3 dicas práticas de IA para dentistas</strong>'",
  },
  {
    icon: "📐", title: "Defina o formato de saída",
    desc: "Diga exatamente como quer a resposta: tabela, JSON, lista, número de palavras, tom. Você ganha previsibilidade e economiza retrabalho.",
    eg: "Responda em <strong>tabela Markdown</strong> com colunas Nome, Prós, Contras.",
  },
  {
    icon: "🧱", title: "Use delimitadores",
    desc: "Separe instruções de conteúdo com marcadores (aspas triplas, ###, tags). Evita que a IA confunda o que é ordem e o que é dado.",
    eg: 'Resuma o texto entre as marcas: <strong>"""...texto..."""</strong>',
  },
  {
    icon: "🚧", title: "Estabeleça restrições",
    desc: "Diga o que evitar e o que priorizar. Guardrails como 'não invente dados' ou 'máx. 100 palavras' aumentam muito a qualidade.",
    eg: "<strong>Não invente fatos.</strong> Se não souber, diga que não sabe.",
  },
  {
    icon: "❓", title: "Peça que pergunte antes",
    desc: "Para tarefas ambíguas, instrua a IA a fazer perguntas de esclarecimento antes de responder. Evita respostas baseadas em suposições erradas.",
    eg: "Se faltar informação, <strong>faça perguntas antes</strong> de começar.",
  },
  {
    icon: "🪜", title: "Decomponha tarefas grandes",
    desc: "Quebre um pedido complexo em etapas menores. Uma cadeia de prompts simples costuma superar um único prompt gigante.",
    eg: "1) Faça um esboço. 2) Depois desenvolva cada tópico do esboço.",
  },
  {
    icon: "🔁", title: "Itere e refine",
    desc: "O primeiro resultado raramente é o melhor. Trate o prompt como rascunho: ajuste, peça variações e refine com feedback específico.",
    eg: "Ficou formal demais. <strong>Refaça com tom mais leve</strong> e exemplos.",
  },
];

/* -------------------------------------------------------------------------
   Estado: { [key]: { text, enabled } }
   ------------------------------------------------------------------------- */
const state = {};
BLOCKS.forEach((b) => {
  state[b.key] = { text: "", enabled: b.key !== "exemplos" }; // exemplos começa opcional/off
});

/* -------------------------------------------------------------------------
   Renderização dos blocos
   ------------------------------------------------------------------------- */
function renderBlocks() {
  const editor = document.getElementById("editor");
  editor.innerHTML = "";

  BLOCKS.forEach((b) => {
    const wrap = document.createElement("div");
    wrap.className = "block" + (state[b.key].enabled ? "" : " disabled");
    wrap.dataset.key = b.key;

    // Estrutura estática via innerHTML (apenas constantes de BLOCKS, sem dados do usuário).
    wrap.innerHTML = `
      <div class="block-head">
        <div class="block-title"><span class="emoji"></span><span class="t"></span></div>
        <label class="switch" title="Incluir este bloco no prompt">
          <input type="checkbox" ${state[b.key].enabled ? "checked" : ""} data-toggle="${b.key}">
          <span class="slider"></span>
        </label>
      </div>
      <p class="block-help"></p>
      <textarea data-input="${b.key}"></textarea>
    `;

    // Dados (incluindo conteúdo do usuário) atribuídos por propriedade — nunca interpretados como HTML.
    wrap.querySelector(".emoji").textContent = b.emoji;
    wrap.querySelector(".block-title .t").textContent = b.title;
    wrap.querySelector(".block-help").textContent = b.help;
    const ta = wrap.querySelector("textarea");
    ta.placeholder = b.placeholder;
    ta.value = state[b.key].text;

    editor.appendChild(wrap);
  });

  // Listeners
  editor.querySelectorAll("textarea[data-input]").forEach((ta) => {
    ta.addEventListener("input", (e) => {
      state[e.target.dataset.input].text = e.target.value;
      update();
    });
  });
  editor.querySelectorAll("input[data-toggle]").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const key = e.target.dataset.toggle;
      state[key].enabled = e.target.checked;
      e.target.closest(".block").classList.toggle("disabled", !e.target.checked);
      update();
    });
  });
}

/* -------------------------------------------------------------------------
   Montagem do prompt em Markdown
   ------------------------------------------------------------------------- */
function buildPrompt() {
  const parts = [];
  BLOCKS.forEach((b) => {
    const s = state[b.key];
    if (s.enabled && s.text.trim()) {
      parts.push(`## ${OUTPUT_HEADINGS[b.key]}\n${s.text.trim()}`);
    }
  });
  return parts.join("\n\n");
}

/* -------------------------------------------------------------------------
   Score de qualidade + dicas
   ------------------------------------------------------------------------- */
function scorePrompt() {
  let score = 0;
  let maxScore = 0;
  const tips = [];

  BLOCKS.forEach((b) => {
    const filled = state[b.key].enabled && state[b.key].text.trim().length > 0;
    maxScore += b.weight;
    if (filled) {
      score += b.weight;
    } else if (b.weight >= 15) {
      tips.push({ ok: false, text: `Defina o bloco "${b.title}" — é essencial.` });
    } else {
      tips.push({ ok: false, text: `Considere adicionar "${b.title}".` });
    }
  });

  // Bônus de qualidade do texto da tarefa (especificidade)
  const tarefa = state.tarefa.text.trim();
  if (tarefa.length > 0 && tarefa.length < 25) {
    tips.push({ ok: false, text: "A tarefa parece curta — seja mais específico no objetivo." });
  }

  const pct = Math.round((score / maxScore) * 100);

  if (tips.length === 0) {
    tips.push({ ok: true, text: "Prompt completo! Todos os blocos preenchidos." });
  }

  return { pct, tips };
}

/* -------------------------------------------------------------------------
   Atualização da UI (preview + score)
   ------------------------------------------------------------------------- */
function update() {
  document.getElementById("preview").textContent = buildPrompt();

  const { pct, tips } = scorePrompt();
  document.getElementById("scoreValue").textContent = pct;
  const fill = document.getElementById("scoreFill");
  fill.style.width = pct + "%";
  fill.style.background = pct < 40 ? "var(--bad)" : pct < 75 ? "var(--warn)" : "var(--good)";

  const tipsEl = document.getElementById("tips");
  tipsEl.innerHTML = "";
  tips.forEach((t) => {
    const li = document.createElement("li");
    if (t.ok) li.className = "ok";
    li.textContent = t.text;
    tipsEl.appendChild(li);
  });
}

/* -------------------------------------------------------------------------
   Presets e aplicação de blocos
   ------------------------------------------------------------------------- */

/* Aplica um conjunto de blocos ao estado e re-renderiza. Base comum de
   presets e modelos. */
function applyBlocks(blocks) {
  BLOCKS.forEach((b) => {
    const value = blocks[b.key] !== undefined ? blocks[b.key] : "";
    state[b.key].text = value;
    state[b.key].enabled = value.trim().length > 0 || b.key !== "exemplos";
  });
  renderBlocks();
  update();
}

function applyPreset(name) {
  if (name === "limpar") {
    BLOCKS.forEach((b) => {
      state[b.key].text = "";
      state[b.key].enabled = b.key !== "exemplos";
    });
    renderBlocks();
    update();
    toast("Tudo limpo.");
    return;
  }

  const preset = PRESETS[name];
  if (!preset) return;
  applyBlocks(preset);
  const labels = { programacao: "Programação", dados: "Análise/Dados", escrita: "Escrita" };
  toast(`Preset "${labels[name] || name}" aplicado.`);
}

/* -------------------------------------------------------------------------
   Templates (localStorage)
   ------------------------------------------------------------------------- */
function loadTemplates() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function persistTemplates(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function renderTemplates() {
  const list = loadTemplates();
  const el = document.getElementById("templateList");
  el.innerHTML = "";

  if (list.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Nenhum template salvo ainda.";
    el.appendChild(li);
    return;
  }

  list.forEach((tpl, i) => {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.className = "t-name";
    name.textContent = tpl.name;
    name.title = "Carregar este template";
    name.addEventListener("click", () => loadTemplateIntoState(tpl));

    const del = document.createElement("button");
    del.className = "t-del";
    del.textContent = "✕";
    del.title = "Excluir";
    del.addEventListener("click", () => {
      const updated = loadTemplates();
      updated.splice(i, 1);
      persistTemplates(updated);
      renderTemplates();
      toast("Template excluído.");
    });

    li.appendChild(name);
    li.appendChild(del);
    el.appendChild(li);
  });
}

function saveTemplate() {
  const input = document.getElementById("templateName");
  const name = input.value.trim();
  if (!name) {
    toast("Dê um nome ao template.");
    input.focus();
    return;
  }
  const list = loadTemplates();
  const snapshot = { name, state: JSON.parse(JSON.stringify(state)), savedAt: Date.now() };

  const existing = list.findIndex((t) => t.name === name);
  if (existing >= 0) list[existing] = snapshot;
  else list.push(snapshot);

  persistTemplates(list);
  input.value = "";
  renderTemplates();
  toast(`Template "${name}" salvo.`);
}

function loadTemplateIntoState(tpl) {
  BLOCKS.forEach((b) => {
    if (tpl.state[b.key]) {
      state[b.key].text = tpl.state[b.key].text || "";
      state[b.key].enabled = !!tpl.state[b.key].enabled;
    }
  });
  renderBlocks();
  update();
  toast(`Template "${tpl.name}" carregado.`);
}

/* -------------------------------------------------------------------------
   Exportar / Importar JSON
   ------------------------------------------------------------------------- */
function exportTemplates() {
  const data = JSON.stringify(loadTemplates(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "prompt-templates.json";
  a.click();
  URL.revokeObjectURL(url);
  toast("Templates exportados.");
}

function importTemplates(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error("formato inválido");
      const current = loadTemplates();
      let count = 0;
      // Mescla por nome (importado sobrescreve), normalizando cada entrada.
      imported.forEach((raw) => {
        const tpl = sanitizeTemplate(raw);
        if (!tpl) return;
        const idx = current.findIndex((t) => t.name === tpl.name);
        if (idx >= 0) current[idx] = tpl;
        else current.push(tpl);
        count++;
      });
      persistTemplates(current);
      renderTemplates();
      toast(`${count} template(s) importado(s).`);
    } catch {
      toast("Arquivo JSON inválido.");
    }
  };
  reader.readAsText(file);
}

/* -------------------------------------------------------------------------
   Utilitários
   ------------------------------------------------------------------------- */

/* Normaliza um template importado para o formato conhecido, descartando
   campos inesperados e coagindo tipos. Retorna null se for inválido. */
function sanitizeTemplate(tpl) {
  if (!tpl || typeof tpl !== "object") return null;
  if (typeof tpl.name !== "string" || !tpl.name.trim()) return null;
  if (!tpl.state || typeof tpl.state !== "object") return null;

  const cleanState = {};
  BLOCKS.forEach((b) => {
    const raw = tpl.state[b.key];
    cleanState[b.key] = {
      text: typeof raw?.text === "string" ? raw.text : "",
      enabled: typeof raw?.enabled === "boolean" ? raw.enabled : b.key !== "exemplos",
    };
  });

  return {
    name: tpl.name.trim().slice(0, 120),
    state: cleanState,
    savedAt: typeof tpl.savedAt === "number" ? tpl.savedAt : Date.now(),
  };
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

/* Copia texto com fallback para file:// sem permissão de clipboard. */
async function copyText(text, okMsg) {
  if (!text) {
    toast("Nada para copiar ainda.");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast(okMsg);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast(okMsg);
  }
}

function copyPrompt() {
  copyText(buildPrompt(), "Prompt copiado!");
}

/* Monta um prompt em Markdown a partir de um objeto de blocos { key: texto }. */
function assemblePrompt(blocks) {
  const parts = [];
  BLOCKS.forEach((b) => {
    const text = (blocks[b.key] || "").trim();
    if (text) parts.push(`## ${OUTPUT_HEADINGS[b.key]}\n${text}`);
  });
  return parts.join("\n\n");
}

/* -------------------------------------------------------------------------
   Abas
   ------------------------------------------------------------------------- */
function switchTab(name) {
  document.querySelectorAll(".tab-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === name)
  );
  document.querySelectorAll(".tab-panel").forEach((p) =>
    p.classList.toggle("active", p.id === "tab-" + name)
  );
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* -------------------------------------------------------------------------
   Modelos: filtros + grid
   ------------------------------------------------------------------------- */
let activeCat = "todos";

function renderCategoryFilters() {
  const el = document.getElementById("catFilters");
  el.innerHTML = "";
  const all = [{ id: "todos", label: "Todos", icon: "✦" }, ...CATEGORIES];
  all.forEach((c) => {
    const chip = document.createElement("button");
    chip.className = "cat-chip" + (c.id === activeCat ? " active" : "");
    chip.textContent = `${c.icon} ${c.label}`;
    chip.addEventListener("click", () => {
      activeCat = c.id;
      renderCategoryFilters();
      renderModels();
    });
    el.appendChild(chip);
  });
}

function catLabel(id) {
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? c.label : id;
}

function renderModels() {
  const grid = document.getElementById("modelsGrid");
  const term = document.getElementById("modelSearch").value.trim().toLowerCase();
  grid.innerHTML = "";

  const list = MODELS.filter((m) => {
    const matchCat = activeCat === "todos" || m.cat === activeCat;
    const matchTerm = !term || (m.title + " " + m.desc).toLowerCase().includes(term);
    return matchCat && matchTerm;
  });

  if (list.length === 0) {
    const empty = document.createElement("p");
    empty.style.color = "var(--text-dim)";
    empty.textContent = "Nenhum modelo encontrado para essa busca.";
    grid.appendChild(empty);
    return;
  }

  list.forEach((m) => {
    const card = document.createElement("article");
    card.className = "model-card";

    const cat = document.createElement("span");
    cat.className = "m-cat";
    cat.textContent = catLabel(m.cat);

    const h3 = document.createElement("h3");
    h3.textContent = `${m.icon} ${m.title}`;

    const p = document.createElement("p");
    p.textContent = m.desc;

    const actions = document.createElement("div");
    actions.className = "model-actions";

    const useBtn = document.createElement("button");
    useBtn.className = "primary";
    useBtn.textContent = "Usar no construtor";
    useBtn.addEventListener("click", () => {
      applyBlocks(m.blocks);
      switchTab("construtor");
      toast(`Modelo "${m.title}" carregado no construtor.`);
    });

    const copyBtn = document.createElement("button");
    copyBtn.className = "ghost";
    copyBtn.textContent = "Copiar";
    copyBtn.addEventListener("click", () =>
      copyText(assemblePrompt(m.blocks), `Modelo "${m.title}" copiado!`)
    );

    actions.append(useBtn, copyBtn);
    card.append(cat, h3, p, actions);
    grid.appendChild(card);
  });
}

/* -------------------------------------------------------------------------
   Técnicas: grid educativo
   ------------------------------------------------------------------------- */
function renderTechniques() {
  const grid = document.getElementById("techGrid");
  grid.innerHTML = "";
  TECHNIQUES.forEach((t) => {
    const card = document.createElement("article");
    card.className = "tech-card";

    const h3 = document.createElement("h3");
    h3.textContent = `${t.icon} ${t.title}`;

    const p = document.createElement("p");
    p.textContent = t.desc;

    const eg = document.createElement("div");
    eg.className = "tech-eg";
    // t.eg é conteúdo estático e confiável (constantes de TECHNIQUES), com <strong> de ênfase.
    eg.innerHTML = t.eg;

    card.append(h3, p, eg);
    grid.appendChild(card);
  });
}

/* -------------------------------------------------------------------------
   Inicialização
   ------------------------------------------------------------------------- */
function init() {
  renderBlocks();
  renderTemplates();
  renderCategoryFilters();
  renderModels();
  renderTechniques();
  update();

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
  });
  document.getElementById("modelSearch").addEventListener("input", renderModels);
  document.getElementById("copyBtn").addEventListener("click", copyPrompt);
  document.getElementById("saveBtn").addEventListener("click", saveTemplate);
  document.getElementById("templateName").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveTemplate();
  });
  document.getElementById("exportBtn").addEventListener("click", exportTemplates);
  document.getElementById("importBtn").addEventListener("click", () =>
    document.getElementById("importFile").click()
  );
  document.getElementById("importFile").addEventListener("change", (e) => {
    if (e.target.files[0]) importTemplates(e.target.files[0]);
    e.target.value = "";
  });
}

document.addEventListener("DOMContentLoaded", init);

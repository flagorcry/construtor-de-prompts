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
};

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

    wrap.innerHTML = `
      <div class="block-head">
        <div class="block-title"><span class="emoji">${b.emoji}</span>${b.title}</div>
        <label class="switch" title="Incluir este bloco no prompt">
          <input type="checkbox" ${state[b.key].enabled ? "checked" : ""} data-toggle="${b.key}">
          <span class="slider"></span>
        </label>
      </div>
      <p class="block-help">${b.help}</p>
      <textarea data-input="${b.key}" placeholder="${escapeAttr(b.placeholder)}">${state[b.key].text}</textarea>
    `;
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
   Presets
   ------------------------------------------------------------------------- */
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
  BLOCKS.forEach((b) => {
    if (preset[b.key] !== undefined) {
      state[b.key].text = preset[b.key];
      state[b.key].enabled = preset[b.key].trim().length > 0 || b.key !== "exemplos";
    }
  });
  renderBlocks();
  update();
  toast(`Preset "${name === "programacao" ? "Programação" : "Análise/Dados"}" aplicado.`);
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
      // Mescla por nome (importado sobrescreve)
      imported.forEach((tpl) => {
        if (!tpl.name || !tpl.state) return;
        const idx = current.findIndex((t) => t.name === tpl.name);
        if (idx >= 0) current[idx] = tpl;
        else current.push(tpl);
      });
      persistTemplates(current);
      renderTemplates();
      toast(`${imported.length} template(s) importado(s).`);
    } catch {
      toast("Arquivo JSON inválido.");
    }
  };
  reader.readAsText(file);
}

/* -------------------------------------------------------------------------
   Utilitários
   ------------------------------------------------------------------------- */
function escapeAttr(str) {
  return str.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

async function copyPrompt() {
  const text = buildPrompt();
  if (!text) {
    toast("Nada para copiar ainda.");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast("Prompt copiado!");
  } catch {
    // Fallback para file:// sem permissão de clipboard
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast("Prompt copiado!");
  }
}

/* -------------------------------------------------------------------------
   Inicialização
   ------------------------------------------------------------------------- */
function init() {
  renderBlocks();
  renderTemplates();
  update();

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
  });
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

# Construtor de Prompts de Excelência

App web local (sem instalação) para construir prompts de alta qualidade de forma
consistente, montando-os a partir de blocos baseados em metodologias comprovadas.
Focado em **programação** e **análise/dados**, mas serve para qualquer caso.

## Como usar

1. Dê **duplo-clique em `index.html`** (abre no seu navegador padrão). Funciona offline.
2. Preencha os blocos na coluna da esquerda. O **preview** à direita monta o prompt em tempo real.
3. Clique em **Copiar** e cole na sua IA (Claude, ChatGPT, etc.).

## Recursos

- **Blocos por metodologia**: Papel/Persona, Contexto, Tarefa, Formato de saída,
  Exemplos (few-shot), Raciocínio (passo a passo) e Restrições/Critérios de qualidade.
  Cada bloco pode ser ligado/desligado no toggle.
- **Presets**: botões **💻 Programação** e **📊 Análise/Dados** pré-preenchem os blocos
  com bons pontos de partida. **Limpar tudo** reseta.
- **Medidor de qualidade**: nota de 0 a 100 com dicas acionáveis sobre o que falta.
- **Biblioteca de templates**: salve configurações com nome, carregue, exclua.
  Os dados ficam no `localStorage` do navegador.
- **Exportar / Importar JSON**: backup e portabilidade entre máquinas/navegadores.

## Os 7 blocos de um bom prompt

| Bloco | Para quê |
|-------|----------|
| 🎭 Papel | Define quem a IA deve ser (especialista em quê). |
| 🧭 Contexto | Situação, público, stack, dados e restrições do ambiente. |
| 🎯 Tarefa | O objetivo específico e mensurável. **O mais importante.** |
| 📐 Formato | Estrutura, tom e tamanho da resposta. |
| 💡 Exemplos | Pares entrada → saída (few-shot) para fixar o padrão. |
| 🧠 Raciocínio | Pedir que pense passo a passo em problemas complexos. |
| 🚧 Restrições | O que evitar, o que priorizar, premissas e qualidade. |

## Notas técnicas

- HTML + CSS + JavaScript puro, sem dependências nem build.
- Os templates são salvos por origem do navegador. Ao abrir via `file://`, ficam
  vinculados a esse contexto — use **Exportar JSON** para mover entre máquinas.

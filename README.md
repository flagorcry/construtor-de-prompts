# Construtor de Prompts de Excelência

Ferramenta web gratuita (sem instalação) para criar prompts de IA de alta qualidade.
Combina três coisas: um **construtor por blocos**, uma **biblioteca de modelos prontos**
e um **guia de técnicas** de prompt engineering. Serve para qualquer caso de uso.

🔗 **Use online:** https://flagorcry.github.io/construtor-de-prompts/

## As 3 abas

- **🔧 Construtor** — monte o prompt bloco a bloco, com preview ao vivo, medidor de
  qualidade e biblioteca pessoal de templates.
- **📚 Modelos** — mais de 20 prompts prontos e testados em 8 categorias (escrita,
  LinkedIn, marketing, código, dados, carreira, ensino, produtividade). Use no
  construtor para editar, ou copie direto.
- **🎓 Técnicas** — cards didáticos com as metodologias por trás de um bom prompt
  (papel, few-shot, chain-of-thought, delimitadores, restrições e mais).

## Como usar

1. Acesse o link acima **ou** dê duplo-clique em `index.html` (funciona offline).
2. Comece por um **modelo** ou monte do zero no **construtor**.
3. Clique em **Copiar** e cole na sua IA (Claude, ChatGPT, etc.).

## Recursos do construtor

- **Blocos por metodologia**: Papel/Persona, Contexto, Tarefa, Formato de saída,
  Exemplos (few-shot), Raciocínio (passo a passo) e Restrições/Critérios de qualidade.
  Cada bloco pode ser ligado/desligado no toggle.
- **Presets** de início rápido: 💻 Programação, 📊 Análise/Dados e ✍️ Escrita.
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

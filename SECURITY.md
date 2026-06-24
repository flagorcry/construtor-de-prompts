# Política de Segurança

## Resumo

O **Construtor de Prompts de Excelência** é uma aplicação **100% estática** (HTML, CSS
e JavaScript puro) que roda inteiramente no navegador do usuário. Não há servidor,
banco de dados, autenticação nem coleta de dados.

## Privacidade dos dados

- **Nada é enviado para fora do navegador.** O app não faz nenhuma chamada de rede.
- Os **templates** que você salva ficam apenas no `localStorage` do seu próprio
  navegador. Eles não são transmitidos, armazenados em servidor nem acessíveis por
  terceiros.
- Não há login, senhas, cookies de rastreamento ou informações de pagamento.

## Modelo de segurança

| Área | Como é tratado |
|------|----------------|
| Conteúdo do usuário | Inserido via `textContent` / `.value` — nunca interpretado como HTML (proteção contra XSS). |
| `innerHTML` | Usado apenas com constantes fixas do próprio código, nunca com entrada do usuário. |
| Importação de JSON | Validada e normalizada por `sanitizeTemplate()`, que coage tipos e descarta dados inesperados. |
| Dependências | **Nenhuma.** Sem bibliotecas de terceiros, CDNs ou scripts externos — sem risco de supply chain. |
| Execução dinâmica | Sem `eval`, `new Function` ou `document.write`. |
| Rede | Sem `fetch` / `XMLHttpRequest`. O app funciona totalmente offline. |
| Transporte | Servido via HTTPS pelo GitHub Pages. |

## Boas práticas para quem usa

- Importe arquivos de template (`.json`) apenas de fontes em que você confia. Ainda
  que o app trate o conteúdo como texto seguro, é um bom hábito geral.

## Como reportar uma vulnerabilidade

Encontrou algo? Abra uma
[issue](https://github.com/flagorcry/construtor-de-prompts/issues) descrevendo o
problema e os passos para reproduzir. Para questões sensíveis, prefira um relato
privado antes de divulgação pública. Toda contribuição responsável é bem-vinda.

## Escopo

Esta política cobre o código deste repositório. A infraestrutura de hospedagem
(GitHub Pages) é mantida pelo GitHub e segue as políticas de segurança da plataforma.

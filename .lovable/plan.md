## Plano: Página /faq

### Objetivo
Criar a rota `/faq` com o visual do projeto, contendo 10 perguntas em accordion e um CTA para WhatsApp.

### Estrutura da página
- **Header da página**: título "Perguntas Frequentes" + subtítulo com classe `eyebrow`/`font-display` e container `container-premium`.
- **Accordion**: componente `Accordion` do Radix já existente em `@/components/ui/accordion`, com as 10 perguntas e respostas fornecidas.
- **CTA final**: botão "Ainda tem dúvidas? Fale no WhatsApp" apontando para `https://wa.me/5532351202810`.
- **Layout padrão do site**: `SiteHeader` + `<main>` + `Footer` + `WhatsAppFAB`.

### Metadados
- `title`: "Perguntas Frequentes — Ágil Persianas"
- `description`: "Tire suas dúvidas sobre persianas e cortinas sob medida."
- `og:title` e `og:description` espelhando o conteúdo.

### Arquivos a serem criados
- `src/routes/faq.tsx` — rota e componente da página.

### Nenhuma alteração em outras páginas.

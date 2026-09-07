/**
 * Contato comercial da Landing Page (Fase 10.1 — venda assistida).
 *
 * IMPORTANTE: WHATSAPP_NUMERO é um placeholder — precisa ser substituído
 * pelo número real do WhatsApp comercial antes de publicar a página. Os
 * dois CTAs (demonstração e "falar agora") apontam para o mesmo número,
 * só com mensagens pré-preenchidas diferentes, já que ainda não existe
 * nenhuma ferramenta de agendamento (Calendly ou similar) integrada.
 */
export const WHATSAPP_NUMERO = "5500000000000"; // TODO: substituir pelo número real (formato 55DDDNÚMERO, só dígitos)

export const MENSAGEM_DEMONSTRACAO =
  "Olá! Quero agendar uma demonstração gratuita do CAIXA360.";
export const MENSAGEM_GERAL = "Olá! Quero conhecer o CAIXA360.";

export function linkWhatsApp(mensagem: string): string {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
}

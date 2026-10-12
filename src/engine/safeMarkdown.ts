import { Marked } from 'marked';

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Markdown for text written by an AI model (tutor replies, agent messages, generated project briefs).
 * Raw HTML is shown as text, images are reduced to their alt text, and only http(s)/mailto/# links survive,
 * so model output can never inject script into the app (which matters most in the desktop app).
 */
export const safeMarked = new Marked({
  gfm: true,
  walkTokens(token) {
    if (token.type === 'link' && !/^(https?:|mailto:|#)/i.test(token.href.trim())) token.href = '#';
  },
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    image({ text }) {
      return escapeHtml(text ? `[image: ${text}]` : '[image]');
    },
  },
});

/** Renders lesson markdown, swapping `{{ill:name}}` / `{{viz:name}}` lines for live components. */

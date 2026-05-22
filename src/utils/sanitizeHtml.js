export function sanitizeRichHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

export function isRichHtmlEmpty(html) {
  if (!html) return true;
  const stripped = String(html).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  return !stripped;
}

/** Strip Quill empty paragraphs / extra breaks so redeem copy spacing stays tight. */
export function compactRichHtml(html) {
  if (!html) return '';
  let s = String(html);
  s = s.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
  s = s.replace(/(<br\s*\/?>\s*){2,}/gi, '<br/>');
  return s.trim();
}

/** Strip Quill inline sizing; keep semantic headings (h1–h6) for customer-side CSS. */
export function normalizeRedeemTypography(html) {
  if (!html) return '';
  let s = String(html);

  const stripStyleProps = (style) =>
    style
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => {
        const key = part.split(':')[0]?.trim().toLowerCase();
        return !['font-size', 'font-family', 'line-height'].includes(key);
      })
      .join('; ');

  s = s.replace(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi, (match, dbl, sgl) => {
    const kept = stripStyleProps(dbl || sgl || '');
    return kept ? ` style="${kept}"` : '';
  });

  s = s.replace(/\sclass\s*=\s*("([^"]*)"|'([^']*)')/gi, (_match, dbl, sgl) => {
    const classes = (dbl || sgl || '')
      .split(/\s+/)
      .filter((cls) => cls && !/^ql-/.test(cls));
    return classes.length ? ` class="${classes.join(' ')}"` : '';
  });

  s = s.replace(/<font\b[^>]*>/gi, '').replace(/<\/font>/gi, '');

  return s;
}

/** Tailwind classes for redeem HTML: body = deal description size; headings scaled up. */
export const REDEEM_HTML_CONTENT_CLASS =
  'redeem-html-content [&_p]:m-0 [&_p]:text-[12px] [&_p]:leading-[1.4] [&_p]:font-normal [&_p]:text-gray-600 [&_p:not(:last-child)]:mb-1 ' +
  '[&_h1]:m-0 [&_h1]:mb-1 [&_h1]:text-[18px] [&_h1]:leading-[1.3] [&_h1]:font-semibold [&_h1]:text-gray-900 ' +
  '[&_h2]:m-0 [&_h2]:mb-1 [&_h2]:text-[16px] [&_h2]:leading-[1.35] [&_h2]:font-semibold [&_h2]:text-gray-900 ' +
  '[&_h3]:m-0 [&_h3]:mb-1 [&_h3]:text-[14px] [&_h3]:leading-[1.4] [&_h3]:font-semibold [&_h3]:text-gray-800 ' +
  '[&_h4]:m-0 [&_h4]:mb-1 [&_h4]:text-[13px] [&_h4]:leading-[1.4] [&_h4]:font-semibold [&_h4]:text-gray-800 ' +
  '[&_h5]:m-0 [&_h5]:mb-1 [&_h5]:text-[12px] [&_h5]:leading-[1.4] [&_h5]:font-semibold [&_h5]:text-gray-700 ' +
  '[&_h6]:m-0 [&_h6]:mb-1 [&_h6]:text-[12px] [&_h6]:leading-[1.4] [&_h6]:font-semibold [&_h6]:text-gray-700 ' +
  '[&_ul]:m-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:text-[12px] [&_ul]:text-gray-600 [&_ul:not(:last-child)]:mb-1 ' +
  '[&_ol]:m-0 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:text-[12px] [&_ol]:text-gray-600 [&_ol:not(:last-child)]:mb-1 ' +
  '[&_li]:m-0 [&_li]:text-[12px] [&_li]:leading-[1.4] [&_strong]:font-semibold [&_a]:text-primary';

export function prepareRedeemHtml(html) {
  return sanitizeRichHtml(normalizeRedeemTypography(compactRichHtml(html)));
}

/** Soft-render benefit text that may include markdown-ish / emoji walls */
export function formatBenefitInline(text) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-brand-black">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const EMOJI_RE =
  /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\uFE0F\u200D])+[\s]*/u;

/** Split one admin feature string into icon / title / body for card UI */
export function parseBenefitCard(raw) {
  const text = String(raw || '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!text) return { emoji: '', title: '', body: '' };

  let rest = text;
  let emoji = '';
  const emojiMatch = rest.match(EMOJI_RE);
  if (emojiMatch) {
    emoji = emojiMatch[0].trim();
    rest = rest.slice(emojiMatch[0].length).trim();
  }

  const lines = rest
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return { emoji, title: '', body: '' };

  const first = lines[0];
  const headingMatch = first.match(/^#{1,3}\s+(.+)$/);
  const boldMatch = first.match(/^\*\*(.+)\*\*$/);
  const boldInline = first.match(/^\*\*(.+?)\*\*\s*(.*)$/);

  let title = '';
  let bodyLines = [];

  if (headingMatch) {
    title = headingMatch[1].replace(/\*\*/g, '').trim();
    bodyLines = lines.slice(1);
  } else if (boldMatch) {
    title = boldMatch[1].trim();
    bodyLines = lines.slice(1);
  } else if (boldInline && boldInline[1]) {
    title = boldInline[1].trim();
    const after = (boldInline[2] || '').trim();
    bodyLines = [...(after ? [after] : []), ...lines.slice(1)];
  } else if (lines.length === 1) {
    title = first.replace(/\*\*/g, '').trim();
  } else {
    title = first.replace(/\*\*/g, '').trim();
    bodyLines = lines.slice(1);
  }

  return {
    emoji,
    title,
    body: bodyLines.map((l) => l.replace(/^[-•]\s+/, '')).join('\n'),
  };
}

export function parseBenefitBlocks(raw) {
  const text = String(raw || '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!text) return [];

  const chunks = text
    .split(/\n(?=#{1,3}\s)|(?:^|\n)---+(?:\n|$)/)
    .map((c) => c.trim())
    .filter(Boolean);

  if (chunks.length <= 1 && !text.includes('\n')) {
    return [{ type: 'body', lines: [text] }];
  }

  const source =
    chunks.length > 1 ? chunks : text.split(/\n{2,}/).map((c) => c.trim()).filter(Boolean);
  return source.map((chunk) => {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    const headingMatch = lines[0]?.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      return { type: 'section', title: headingMatch[1].replace(/\*\*/g, ''), lines: lines.slice(1) };
    }
    const boldTitle = lines[0]?.match(/^\*\*(.+)\*\*$/);
    if (boldTitle && lines.length > 1) {
      return { type: 'section', title: boldTitle[1], lines: lines.slice(1) };
    }
    return { type: 'body', lines };
  });
}

/** Individual benefit card used in membership section */
export function BenefitCard({ text, index = 0 }) {
  const { emoji, title, body } = parseBenefitCard(text);
  const accents = [
    'from-brand-gold/25 to-brand-gold/5',
    'from-amber-100 to-orange-50',
    'from-stone-100 to-neutral-50',
  ];
  const accent = accents[index % accents.length];

  return (
    <article
      className="group relative h-full overflow-hidden rounded-2xl border border-brand-border/80 bg-white p-5 sm:p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition duration-300 hover:-translate-y-0.5 hover:border-brand-gold/50 hover:shadow-[0_16px_40px_-24px_rgba(0,0,0,0.35)]"
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${accent} opacity-80 transition group-hover:scale-110`}
        aria-hidden
      />
      <div className="relative flex gap-4 items-start">
        <div className="shrink-0">
          {emoji ? (
            <span
              className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 border border-brand-gold/25 text-2xl sm:text-[1.65rem] shadow-sm"
              aria-hidden
            >
              {emoji}
            </span>
          ) : (
            <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-brand-black text-brand-gold text-sm font-bold tracking-wide">
              {String(index + 1).padStart(2, '0')}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          {title ? (
            <h4 className="font-display text-lg sm:text-xl leading-snug text-brand-black mb-1.5 sm:mb-2">
              {formatBenefitInline(title)}
            </h4>
          ) : null}
          {body ? (
            <div className="space-y-2">
              {body.split('\n').map((line, i) => (
                <p
                  key={i}
                  className="text-sm sm:text-[15px] leading-relaxed text-brand-muted"
                >
                  {formatBenefitInline(line)}
                </p>
              ))}
            </div>
          ) : !title ? (
            <p className="text-sm sm:text-base leading-relaxed text-brand-black/90">
              {formatBenefitInline(text)}
            </p>
          ) : null}
        </div>
      </div>
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-brand-gold/0 group-hover:bg-brand-gold transition-colors" />
    </article>
  );
}

const BenefitContent = ({ text }) => {
  const blocks = parseBenefitBlocks(text);
  const isLong = String(text || '').length > 160 || String(text || '').includes('\n');

  if (!isLong && blocks.length <= 1) {
    return (
      <p className="text-base sm:text-lg leading-relaxed text-brand-black/90">
        {formatBenefitInline(text)}
      </p>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {blocks.map((block, bi) => (
        <div
          key={bi}
          className={
            block.type === 'section'
              ? 'rounded-xl bg-[#faf9f7] border border-brand-border/70 px-4 py-3.5 sm:px-5 sm:py-4'
              : ''
          }
        >
          {block.type === 'section' && block.title ? (
            <h4 className="font-display text-lg sm:text-xl text-brand-black mb-2.5">
              {block.title}
            </h4>
          ) : null}
          <div className="space-y-2.5">
            {block.lines.map((line, li) => {
              const cleaned = line.replace(/^#{1,3}\s+/, '').replace(/^[-•]\s+/, '');
              return (
                <p key={li} className="text-base sm:text-lg leading-relaxed text-brand-black/90">
                  {formatBenefitInline(cleaned)}
                </p>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BenefitContent;

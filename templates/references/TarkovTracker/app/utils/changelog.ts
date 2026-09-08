export const cleanText = (value: string): string => {
  let text = value.replace(/\s*\(#\d+\)\s*$/, '');
  text = text.replace(/\s*\[[^\]]+\]\s*$/, '');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/[`*_~]/g, '');
  text = text.replace(/[_/]+/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
};
export const toSentence = (value: string): string => {
  let text = cleanText(value);
  if (!text) return '';
  const firstChar = text.charAt(0);
  if (firstChar) {
    text = firstChar.toUpperCase() + text.slice(1);
  }
  if (!/[.!?]$/.test(text)) {
    text += '.';
  }
  return text;
};
const SKIP_TYPES = new Set(['chore', 'ci', 'test', 'tests', 'docs', 'build', 'style', 'deps']);
const VERB_MAP: Readonly<Record<string, string>> = Object.freeze({
  feat: 'Added',
  fix: 'Fixed',
  perf: 'Improved',
  ui: 'Updated',
  refactor: 'Improved',
});
const INFERRED_MAP: Readonly<Record<string, string>> = Object.freeze({
  add: 'Added',
  adds: 'Added',
  added: 'Added',
  fix: 'Fixed',
  fixes: 'Fixed',
  fixed: 'Fixed',
  improve: 'Improved',
  improves: 'Improved',
  improved: 'Improved',
  update: 'Updated',
  updates: 'Updated',
  updated: 'Updated',
  refactor: 'Improved',
  refactors: 'Improved',
  refactored: 'Improved',
});
export const extractReleaseBullets = (body: string | null | undefined): string[] => {
  if (!body) return [];
  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const bulletLines = lines.filter((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line));
  const sourceLines = bulletLines.length
    ? bulletLines
    : lines.filter((line) => !line.startsWith('#'));
  return sourceLines
    .map((line) =>
      line
        .replace(/^[-*]\s+/, '')
        .replace(/^\d+\.\s+/, '')
        .trim()
    )
    .filter(Boolean);
};
export const normalizeCommitMessage = (message: string | null | undefined): string | null => {
  if (!message) return null;
  const firstLine = message.split('\n')[0]?.trim();
  if (!firstLine) return null;
  if (/^merge\b/i.test(firstLine)) return null;
  if (/^revert\b/i.test(firstLine)) return null;
  const conventional = firstLine.match(/^([a-z]+)(?:\([^)]+\))?:\s*(.+)$/i);
  const type = conventional?.[1]?.toLowerCase() ?? '';
  let subject = conventional?.[2] ?? firstLine;
  if (type && SKIP_TYPES.has(type)) return null;
  let verb = VERB_MAP[type] || '';
  subject = cleanText(subject);
  if (!subject) return null;
  const verbPattern =
    /^(add|adds|added|fix|fixes|fixed|improve|improves|improved|update|updates|updated|refactor|refactors|refactored)\b\s*/i;
  const leadingVerb = subject.match(verbPattern);
  if (!verb && leadingVerb && leadingVerb[1]) {
    const keyword = leadingVerb[1].toLowerCase();
    const inferred = INFERRED_MAP[keyword];
    if (inferred) {
      verb = inferred;
      subject = subject.replace(verbPattern, '');
    }
  }
  if (!verb) return null;
  const sentence = toSentence(`${verb} ${subject}`);
  return sentence || null;
};

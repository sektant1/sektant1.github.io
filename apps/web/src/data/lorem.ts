// Placeholder prose for the showcase. Deliberately lorem ipsum rather than
// written copy: this is a component demo, and real-looking body text invites
// the reader to judge the writing instead of the layout.
//
// Lengths vary on purpose so wrapping, clamping and truncation all get
// exercised by the fixtures.

const WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "eu",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum",
]

/**
 * Deterministic lorem. `seed` picks the starting offset, so two calls with the
 * same seed give the same text across reloads — no flicker, no snapshot churn.
 */
export function lorem(words: number, seed = 0) {
  const out: string[] = []
  for (let i = 0; i < words; i++) {
    out.push(WORDS[(seed * 7 + i * 3) % WORDS.length])
  }
  const text = out.join(" ")
  return text.charAt(0).toUpperCase() + text.slice(1) + "."
}

/** A few sentences, for body copy. */
export function loremParagraph(sentences: number, seed = 0) {
  return Array.from({ length: sentences }, (_, i) =>
    lorem(9 + ((seed + i * 5) % 14), seed + i)
  ).join(" ")
}

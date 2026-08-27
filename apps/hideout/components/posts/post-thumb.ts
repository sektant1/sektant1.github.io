/**
 * A post without its own thumbnail borrows one of the local stand-ins.
 *
 * The old site pointed these at hotlinked GIFs on tumblr and reddit, which
 * broke offline and leaked a referrer on every page view. These ship with the
 * site. The pick is by index rather than at random, so a given row shows the
 * same image on the server and on the client.
 */
const FALLBACKS = [
  "/placeholders/post-fallback.gif",
  "/placeholders/post-fallback2.gif",
  "/placeholders/post-fallback3.webp",
]

export function postThumb(thumbnail: string | undefined, index: number) {
  return thumbnail ?? FALLBACKS[index % FALLBACKS.length]
}

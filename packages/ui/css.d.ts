/**
 * A stylesheet imported for its side effect is not a module TypeScript knows
 * how to type, and it refuses the import outright rather than ignoring it.
 * Bundlers handle these; the compiler only needs to be told they exist.
 */
declare module "*.css"

export interface PostSearchHit {
  id: string;
  href: string;
  title: string;
  date?: string;
  tags: string[];
  snippet?: string;
  text: string;
}

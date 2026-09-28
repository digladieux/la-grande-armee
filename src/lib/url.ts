/**
 * Préfixe un chemin interne avec la base du site (indispensable sur GitHub Pages,
 * où le site est servi sous /<nom-du-repo>/).
 *   url('/quiz') -> '/la-grande-armee/quiz'
 */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}` || '/';
}

/** Compare le chemin courant à un lien de navigation (gère la base). */
export function isActive(currentPath: string, href: string): boolean {
  const strip = (p: string) => p.replace(/\/$/, '') || '/';
  const target = strip(url(href));
  const current = strip(currentPath);
  return target === strip(url('/')) ? current === target : current.startsWith(target);
}

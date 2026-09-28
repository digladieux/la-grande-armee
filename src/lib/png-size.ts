import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Dimensions d'un PNG de /public (lecture de l'en-tête IHDR, au build). */
export function pngSize(publicPath: string): { width: number; height: number } | undefined {
  try {
    const buf = readFileSync(join(process.cwd(), 'public', publicPath));
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch {
    return undefined;
  }
}

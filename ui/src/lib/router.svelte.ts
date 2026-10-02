// Links out of the islands (the canvas, the dependency graph) go to the
// server-rendered pages, which live at real paths under the mount.
import { base } from './api/client';

export function navigate(path: string) {
  location.assign(base + path);
}

export const href = (path: string) => base + path;

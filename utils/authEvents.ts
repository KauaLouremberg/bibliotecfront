type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeSessionCleared(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emitSessionCleared(): void {
  listeners.forEach((fn) => {
    fn();
  });
}

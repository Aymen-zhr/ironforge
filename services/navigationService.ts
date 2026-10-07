export type TabScreen = 'index' | 'fridge' | 'workout' | 'diet';

type NavigationListener = (tab: TabScreen) => void;
const listeners: Set<NavigationListener> = new Set();

export function subscribeNavigation(listener: NavigationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function navigateTab(tab: TabScreen): void {
  listeners.forEach((listener) => {
    try {
      listener(tab);
    } catch (err) {
      console.warn('[navigationService] Listener error:', err);
    }
  });
}

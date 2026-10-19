import { useState, useEffect } from 'react';
import { ironforgeState, IronforgeGlobalState } from './ironforgeStateStore';

export function useIronforgeStore(): IronforgeGlobalState {
  const [state, setState] = useState<IronforgeGlobalState>(ironforgeState.get());

  useEffect(() => {
    ironforgeState.init();
    const unsubscribe = ironforgeState.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  return state;
}

export * from './ironforgeStateStore';

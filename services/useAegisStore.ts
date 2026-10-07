import { useState, useEffect } from 'react';
import { aegisState, AegisGlobalState } from './aegisStateStore';

export function useAegisStore(): AegisGlobalState {
  const [state, setState] = useState<AegisGlobalState>(aegisState.get());

  useEffect(() => {
    aegisState.init();
    const unsubscribe = aegisState.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  return state;
}

export { aegisState };
export * from './aegisStateStore';

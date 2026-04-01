/**
 * Keyboard shortcuts:
 *   Esc   — deselect aircraft
 *   F     — focus/follow selected (re-triggers CameraFollow)
 *   R     — reset camera to default view
 */

import { useEffect } from 'react';
import { useFlightStore } from '../store/flightStore';

export function useKeyboard(orbitRef) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return; // don't capture search input

      switch (e.key) {
        case 'Escape':
          useFlightStore.getState().clearSelection();
          break;

        case 'f':
        case 'F':
          // Re-trigger camera follow by toggling selectedId off and back on
          // (CameraFollow activates on id change)
          {
            const { selectedId } = useFlightStore.getState();
            if (selectedId) {
              useFlightStore.setState({ selectedId: null });
              setTimeout(() => useFlightStore.setState({ selectedId }), 16);
            }
          }
          break;

        case 'r':
        case 'R':
          // Signal for camera reset — watched by CameraFollow
          useFlightStore.setState({ cameraResetAt: Date.now() });
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
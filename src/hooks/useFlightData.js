/**
 * useFlightData — React hook that drives the OpenSky polling loop.
 *
 * Fires an immediate request on mount, then polls every POLL_MS.
 * All state mutations go through the Zustand store so any component
 * can subscribe without prop-drilling.
 */

import { useEffect, useRef, useCallback } from 'react';
import { fetchFlights, dataSource } from '../api/opensky';
import { useFlightStore }           from '../store/flightStore';

const POLL_MS = 12_000;

export function useFlightData() {
  const setFlights    = useFlightStore(s => s.setFlights);
  const setFetchError = useFlightStore(s => s.setFetchError);
  const intervalRef   = useRef(null);

  const poll = useCallback(async () => {
    useFlightStore.setState({ fetchError: false });
    const data = await fetchFlights();
    // fetchFlights always returns something (mock fallback)
    // so data will never be null
    if (!data || data.length === 0) {
      setFetchError();
    } else {
      setFlights(data);
      // expose active source to the UI
      useFlightStore.setState({ dataSource });
    }
  }, [setFlights, setFetchError]);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, [poll]);
}
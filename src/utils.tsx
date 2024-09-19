import { useEffect, useRef } from "react";

export function usePollingEffect(
  asyncCallback: () => Promise<void>,
  dependencies = [],
  {
    interval = 10_000, // 10 seconds
    onCleanUp = () => {},
  } = {},
) {
  const timeoutIdRef = useRef<any>(null);
  useEffect(() => {
    let _stopped = false;
    (async function pollingCallback() {
      try {
        await asyncCallback();
      } finally {
        // Set timeout after it finished, unless stopped
        timeoutIdRef.current = !_stopped && setTimeout(pollingCallback, interval);
      }
    })();
    // Clean up if dependencies change
    return () => {
      _stopped = true; // prevent racing conditions
      clearTimeout(timeoutIdRef.current);
      onCleanUp();
    };
  }, [...dependencies, interval]);
}

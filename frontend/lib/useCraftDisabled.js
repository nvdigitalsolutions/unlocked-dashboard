import { useEffect, useState } from 'react';

export function useCraftDisabled() {
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DISABLE_CRAFTJS === 'true') {
      setDisabled(true);
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/check-auth');
        setDisabled(!res.ok);
      } catch {
        setDisabled(true);
      }
    })();
  }, []);

  return disabled;
}

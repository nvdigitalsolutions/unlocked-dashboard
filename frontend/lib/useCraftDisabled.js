import { useEffect, useState } from 'react';

export function useCraftDisabled() {
  const [disabled, setDisabled] = useState(
    process.env.NEXT_PUBLIC_DISABLE_CRAFTJS === 'true'
  );

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DISABLE_CRAFTJS === 'true') {
      return;
    }
    if (typeof document !== 'undefined') {
      const loggedIn = document.cookie.includes('jwt=');
      if (!loggedIn) {
        setDisabled(true);
      }
    }
  }, []);

  return disabled;
}

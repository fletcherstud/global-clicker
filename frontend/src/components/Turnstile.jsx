import { useEffect, useRef } from 'react';
import { useTurnstile } from './TurnstileContext';

export function Turnstile({ onVerify, onError, onExpire }) {
  const widgetRef = useRef(null);
  const { setIsVerified, setToken } = useTurnstile();

  useEffect(() => {
    // Load the Turnstile script if it hasn't been loaded yet
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup if component unmounts
      if (widgetRef.current) {
        window.turnstile?.remove(widgetRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Initialize Turnstile when the script is loaded
    const initTurnstile = () => {
      if (window.turnstile && widgetRef.current) {
        window.turnstile.render(widgetRef.current, {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
          theme: 'light',
          callback: function(token) {
            setIsVerified(true);
            setToken(token);
            onVerify?.(token);
          },
          'error-callback': function() {
            setIsVerified(false);
            setToken(null);
            onError?.();
          },
          'expire-callback': function() {
            setIsVerified(false);
            setToken(null);
            onExpire?.();
          }
        });
      }
    };

    // If turnstile is already loaded, initialize immediately
    if (window.turnstile) {
      initTurnstile();
    } else {
      // Otherwise wait for the script to load
      const interval = setInterval(() => {
        if (window.turnstile) {
          initTurnstile();
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [onVerify, onError, onExpire, setIsVerified, setToken]);

  return (
    <div 
      ref={widgetRef}
      className="turnstile-container"
    />
  );
} 
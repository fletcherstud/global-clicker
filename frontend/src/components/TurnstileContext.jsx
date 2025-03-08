import { createContext, useContext, useState, useCallback } from 'react';

const TurnstileContext = createContext();

export function TurnstileProvider({ children }) {
  const [isVerified, setIsVerified] = useState(false);
  const [token, setToken] = useState(null);
  const [requestCount, setRequestCount] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(null);
  
  const incrementRequest = useCallback(() => {
    const now = Date.now();
    setRequestCount(prev => prev + 1);
    setLastRequestTime(now);
  }, []);

  const needsVerification = useCallback(() => {
    const now = Date.now();
    // Require verification if:
    // 1. More than 10 requests in the last minute
    // 2. Requests are coming in too quickly (less than 500ms apart)
    if (lastRequestTime && (now - lastRequestTime < 500)) return true;
    if (requestCount > 10) return true;
    return false;
  }, [requestCount, lastRequestTime]);

  const resetCounts = useCallback(() => {
    setRequestCount(0);
    setLastRequestTime(null);
  }, []);

  return (
    <TurnstileContext.Provider
      value={{
        isVerified,
        setIsVerified,
        token,
        setToken,
        incrementRequest,
        needsVerification,
        resetCounts,
      }}
    >
      {children}
    </TurnstileContext.Provider>
  );
}

export function useTurnstile() {
  const context = useContext(TurnstileContext);
  if (!context) {
    throw new Error('useTurnstile must be used within a TurnstileProvider');
  }
  return context;
} 
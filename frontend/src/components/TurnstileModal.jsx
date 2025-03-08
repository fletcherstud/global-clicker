import { useEffect, useState } from 'react';
import { Turnstile } from './Turnstile';
import { useTurnstile } from './TurnstileContext';

export function TurnstileModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { needsVerification, isVerified, resetCounts } = useTurnstile();

  useEffect(() => {
    if (needsVerification() && !isVerified) {
      setIsOpen(true);
    }
  }, [needsVerification, isVerified]);

  const handleVerify = () => {
    setIsOpen(false);
    resetCounts();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Please verify you're human</h2>
        <p className="text-gray-600 mb-4">
          We've detected unusual activity. Please complete this quick verification to continue.
        </p>
        <div className="flex justify-center">
          <Turnstile
            onVerify={handleVerify}
            onError={() => setIsOpen(true)}
            onExpire={() => setIsOpen(true)}
          />
        </div>
      </div>
    </div>
  );
} 
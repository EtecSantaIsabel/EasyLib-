import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-[#FFF1E6] border-b border-[#FED7AA] text-[#9A3412] px-4 py-2 text-xs font-bold flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Você está offline — suas lições salvas continuam disponíveis.</span>
    </div>
  );
};

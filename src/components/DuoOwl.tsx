import React from 'react';
import { LibiMascot, LibiMood } from './LibiMascot';

export type SignerMood = LibiMood;

interface DuoOwlProps {
  mood?: LibiMood;
  outfit?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSpeechBubble?: boolean;
  speechText?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Re-exporting Libi as the official mascot of EasyLib
 */
export const DuoOwl: React.FC<DuoOwlProps> = (props) => {
  return <LibiMascot {...props} />;
};

export { LibiMascot };

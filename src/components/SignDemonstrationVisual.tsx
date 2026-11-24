import React from 'react';
import { SignData } from '../types';
import { findCatalogSign } from '../data/librasCatalog255';
import { SignMediaPlayer } from './SignSchematicVisualizer';

interface SignDemonstrationVisualProps {
  sign?: SignData;
  className?: string;
}

export const SignDemonstrationVisual = ({
  sign,
  className = ''
}: SignDemonstrationVisualProps) => {
  if (!sign) return null;

  const catalogSign = findCatalogSign(sign.id || sign.name);

  return (
    <div className={`bg-white rounded-2xl border border-[#E8E2D9] p-4 space-y-3 ${className}`}>
      <div className="space-y-0.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] block">
          {catalogSign.categoria}
        </span>
        <h4 className="font-display text-lg font-bold text-[#1C1917]">
          {catalogSign.palavra}
        </h4>
        <p className="text-xs font-medium text-[#57534E]">
          {catalogSign.significado}
        </p>
      </div>

      <SignMediaPlayer sign={catalogSign} compact={true} />
    </div>
  );
};

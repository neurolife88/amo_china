import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

interface ExpandableTextProps {
  text: string | null | undefined;
  maxLength?: number;
  className?: string;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({ 
  text, 
  maxLength = 50, 
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { patients: patientTranslations } = useTranslations();
  
  // Обработка пустых значений
  if (!text || text.trim() === '') {
    return (
      <div className={`text-sm text-gray-400 italic ${className}`}>
        —
      </div>
    );
  }

  const cleanText = text.trim();
  
  // Если текст короткий, показываем его полностью
  if (cleanText.length <= maxLength) {
    return (
      <div className={`text-sm text-gray-700 leading-relaxed ${className}`}>
        {cleanText}
      </div>
    );
  }

  const truncatedText = cleanText.slice(0, maxLength);
  
  return (
    <div className={`text-sm text-gray-700 ${className}`}>
      <div className="space-y-2">
        <div className="leading-relaxed whitespace-pre-wrap">
          {isExpanded ? cleanText : `${truncatedText}...`}
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 
                     font-medium transition-colors duration-200 hover:underline focus:outline-none
                     focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 rounded px-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={12} />
              {patientTranslations.mobileCards.collapse()}
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              {patientTranslations.mobileCards.showFull()}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExpandableText;

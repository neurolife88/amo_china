import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, toggleLanguage, t } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">
        {currentLanguage === 'ru' ? '中文' : 'Рус'}
      </span>
    </Button>
  );
};

import React from 'react';

const Version: React.FC = () => {
  // Получаем версию и дату билда из переменных окружения
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const buildDate = import.meta.env.VITE_BUILD_DATE;
  
  // Форматируем дату в российский формат (дд.мм.гггг)
  const formatDate = (isoDate: string): string => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      // Fallback: текущая дата
      return new Date().toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  const formattedDate = buildDate ? formatDate(buildDate) : formatDate(new Date().toISOString());

  return (
    <div className="text-xs text-gray-400 font-mono">
      <span>v{version}</span>
      {/* На экранах меньше 640px скрываем дату */}
      <span className="hidden sm:inline">
        {' • '}{formattedDate}
      </span>
    </div>
  );
};

export default Version;

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface StickyHorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
}

const StickyHorizontalScroll: React.FC<StickyHorizontalScrollProps> = ({ 
  children, 
  className = "" 
}) => {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const contentInnerRef = useRef<HTMLDivElement>(null);
  
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollWidth, setScrollWidth] = useState(0);

  // Обновление ширины скроллбара
  const updateScrollWidth = useCallback(() => {
    if (contentInnerRef.current) {
      const newScrollWidth = contentInnerRef.current.scrollWidth;
      setScrollWidth(newScrollWidth);
    }
  }, []);

  // Синхронизация скролла с предотвращением бесконечных циклов
  const handleScroll = useCallback((
    source: 'top' | 'content' | 'bottom',
    scrollLeft: number
  ) => {
    if (isScrolling) return;
    
    setIsScrolling(true);
    

    
    // Синхронизируем все остальные скроллы
    if (source !== 'top' && topScrollRef.current) {
      topScrollRef.current.scrollLeft = scrollLeft;
    }
    if (source !== 'content' && contentScrollRef.current) {
      contentScrollRef.current.scrollLeft = scrollLeft;
    }
    if (source !== 'bottom' && bottomScrollRef.current) {
      bottomScrollRef.current.scrollLeft = scrollLeft;
    }
    
    // Сбрасываем флаг через небольшую задержку
    setTimeout(() => setIsScrolling(false), 10);
  }, [isScrolling]);

  // Обработчики скролла для каждого элемента
  const handleTopScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    handleScroll('top', scrollLeft);
  }, [handleScroll]);

  const handleContentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    handleScroll('content', scrollLeft);
  }, [handleScroll]);

  const handleBottomScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    handleScroll('bottom', scrollLeft);
  }, [handleScroll]);

  // Отслеживание изменений размера контента
  useEffect(() => {
    updateScrollWidth();
    
    // ResizeObserver для отслеживания изменений размера
    const resizeObserver = new ResizeObserver(() => {
      updateScrollWidth();
    });
    
    if (contentInnerRef.current) {
      resizeObserver.observe(contentInnerRef.current);
    }
    
    // MutationObserver для отслеживания добавления/удаления элементов
    const mutationObserver = new MutationObserver(() => {
      updateScrollWidth();
    });
    
    if (contentInnerRef.current) {
      mutationObserver.observe(contentInnerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
    
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateScrollWidth]);

  return (
    <div className={`relative ${className}`}>
      {/* Верхний скролл - sticky */}
      <div 
        ref={topScrollRef}
        className="sticky top-0 z-10 h-6 overflow-x-auto overflow-y-hidden bg-gray-50 border-b border-gray-300"
        onScroll={handleTopScroll}
      >
                {/* Невидимый div для создания скроллбара */}
        <div
          style={{ width: scrollWidth || '100%', height: '1px', minWidth: '100%' }}
          className="pointer-events-none"
        />
      </div>

      {/* Основной контент с таблицей */}
      <div 
        ref={contentScrollRef}
        className="overflow-x-auto overflow-y-visible"
        onScroll={handleContentScroll}
      >
        <div ref={contentInnerRef}>
          {children}
        </div>
      </div>

      {/* Нижний скролл */}
      <div 
        ref={bottomScrollRef}
        className="h-6 overflow-x-auto overflow-y-hidden bg-gray-50 border-t border-gray-300"
        onScroll={handleBottomScroll}
      >
                {/* Невидимый div для создания скроллбара */}
        <div
          style={{ width: scrollWidth || '100%', height: '1px', minWidth: '100%' }}
          className="pointer-events-none"
        />
      </div>
    </div>
  );
};

export default StickyHorizontalScroll;

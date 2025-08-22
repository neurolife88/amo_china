import { Hospital } from 'lucide-react';

// Объект с логотипами клиник
const clinicLogos = {
  "Народная": () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Зеленая дуга */}
      <path 
        d="M 20 180 Q 20 80 100 80 Q 180 80 180 160 Q 180 180 140 180 Q 80 180 20 180 Z" 
        fill="#6B7B47"
      />
      {/* Оранжевые диагональные полосы */}
      <rect x="120" y="20" width="15" height="80" fill="#E87722" transform="rotate(30 127 60)" />
      <rect x="140" y="40" width="15" height="100" fill="#E87722" transform="rotate(30 147 90)" />
      <rect x="160" y="60" width="15" height="120" fill="#E87722" transform="rotate(30 167 120)" />
    </svg>
  ),
  
  "Боя": () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Синий круг с белым текстом */}
      <circle cx="100" cy="100" r="80" fill="#1E40AF" />
      <text x="100" y="110" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">Боя</text>
    </svg>
  ),
  
  "Beijing International Medical Center": () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Синий круг с китайским текстом */}
      <circle cx="100" cy="100" r="80" fill="#1E40AF" />
      <text x="100" y="110" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">北京</text>
    </svg>
  ),
  
  "Shanghai Global Health Hospital": () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Зеленый круг с китайским текстом */}
      <circle cx="100" cy="100" r="80" fill="#059669" />
      <text x="100" y="110" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">上海</text>
    </svg>
  ),
  
  "Guangzhou Medical Tourism Hub": () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Красный круг с китайским текстом */}
      <circle cx="100" cy="100" r="80" fill="#DC2626" />
      <text x="100" y="110" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">广州</text>
    </svg>
  ),
  
  "Shenzhen International Hospital": () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Коричневый круг с китайским текстом */}
      <circle cx="100" cy="100" r="80" fill="#7C2D12" />
      <text x="100" y="110" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">深圳</text>
    </svg>
  )
};

// Типы для TypeScript
export type ClinicName = keyof typeof clinicLogos;

interface ClinicLogoProps {
  clinicName?: string;
  className?: string;
}

// Главный компонент логотипа
export const ClinicLogo = ({ clinicName, className = "w-10 h-10" }: ClinicLogoProps) => {
  // Если есть специфический логотип для клиники
  if (clinicName && clinicLogos[clinicName as ClinicName]) {
    const LogoComponent = clinicLogos[clinicName as ClinicName];
    return (
      <div className={className}>
        <LogoComponent />
      </div>
    );
  }
  
  // Fallback - обычная иконка больницы
  return <Hospital className={`${className} text-blue-600`} />;
};

export default ClinicLogo;

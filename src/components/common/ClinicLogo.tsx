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
    <svg viewBox="0 0 204 258" className="w-full h-full">
      <defs>
        <linearGradient id="a" gradientUnits="userSpaceOnUse" x1="-2.263" y1="74.005" x2="134.2" y2="74.005">
          <stop offset="0" style={{stopColor:"#2ca81d"}}></stop>
          <stop offset=".049" style={{stopColor:"#239e2e"}}></stop>
          <stop offset=".13" style={{stopColor:"#179343"}}></stop>
          <stop offset=".221" style={{stopColor:"#0f8a52"}}></stop>
          <stop offset=".328" style={{stopColor:"#0a855a"}}></stop>
          <stop offset=".493" style={{stopColor:"#09845d"}}></stop>
          <stop offset=".501" style={{stopColor:"#088756"}}></stop>
          <stop offset=".537" style={{stopColor:"#06913c"}}></stop>
          <stop offset=".578" style={{stopColor:"#049926"}}></stop>
          <stop offset=".627" style={{stopColor:"#029f15"}}></stop>
          <stop offset=".687" style={{stopColor:"#01a409"}}></stop>
          <stop offset=".77" style={{stopColor:"#00a602"}}></stop>
          <stop offset="1" style={{stopColor:"#00a700"}}></stop>
        </linearGradient>
        <linearGradient id="b" gradientUnits="userSpaceOnUse" x1="87.775" y1="87.182" x2="125.748" y2="119.511">
          <stop offset="0" style={{stopColor:"#2ca81d"}}></stop>
          <stop offset=".103" style={{stopColor:"#30a933"}}></stop>
          <stop offset=".415" style={{stopColor:"#3aac71"}}></stop>
          <stop offset=".679" style={{stopColor:"#42ae9e"}}></stop>
          <stop offset=".882" style={{stopColor:"#46b0ba"}}></stop>
          <stop offset="1" style={{stopColor:"#48b0c4"}}></stop>
        </linearGradient>
        <linearGradient id="c" gradientUnits="userSpaceOnUse" x1="66.876" y1="138.036" x2="202" y2="138.036">
          <stop offset="0" style={{stopColor:"#30b0c4"}}></stop>
          <stop offset=".285" style={{stopColor:"#30aec4"}}></stop>
          <stop offset=".388" style={{stopColor:"#30a7c5"}}></stop>
          <stop offset=".461" style={{stopColor:"#309cc6"}}></stop>
          <stop offset=".52" style={{stopColor:"#308bc7"}}></stop>
          <stop offset=".528" style={{stopColor:"#3088c7"}}></stop>
          <stop offset="1" style={{stopColor:"#3088c7"}}></stop>
        </linearGradient>
      </defs>
      
      {/* Основные элементы логотипа */}
      <path fill="url(#a)" d="M71.8 99.3c-3.6 10.4-3.1 11.4-5.6 16.8-1.7 3.7-4.1 8.6-8.9 13.5-1.8 1.9-5.9 5.6-12.1 8.5-6.6 3-12.6 3.7-16.3 3.8H10.8c-4.6.1-8.4-3.5-8.4-8.1 2.3-80.7-16.7-59.4 63.7-63V15c0-4.9 4-8.8 8.9-8.8h56c4.1 0 7.5 3.3 7.5 7.5 0 15.9-1.6 33.1-8.3 42C117.6 72.5 98.4 76 93.1 76.8 85 78.3 80.7 82 78.4 84.5c-2.3 2.6-3.8 6.7-6.6 14.8z"></path>
      <path fill="url(#b)" d="M128.8 82.4c-4.6.8-6.2 5.9-5.7 8.4.5 2.9 1.4 6.5 2.4 9.4 1.5 3.2 1.3 10.8 0 13.7-2 5.3-6.1 11.1-11.7 13.5-3.9 1.6-6.3 1.9-10.4 2.4-4.9.6-9.3.3-13.8-1.3 2.5-.4 7.3-2 9.4-3.6 3.7-2.8 5.7-7.1 5.1-10-2-8.8-13.5-14.6-21-14-2-4.7-2.2-8.3-4.2-13 13.6-2.5 20.4-1.2 31.3 8.8-1.6-3.4-3.6-3.9-4.1-5.7-.1-.4-.6-1.7 0-3.5 1.3-3.6 4.8-7.7 10.2-8.8 2.7-.6 4.9 0 6 .2 3.2.9 5.4 2.5 6.5 3.5z"></path>
      <path fill="url(#c)" d="M138.4 141.8v54.5c0 5.5-4.5 10-10.1 10H75.7c-4.9 0-8.8-3.9-8.8-8.8v-19.9c.3-4.1 1.6-17.7 12.4-29.6 9.7-10.8 18.9-13.9 23.1-14.9 2.6-.5 11-2.6 17-6.5 6.2-4 8.6-14.1 9.4-16.8.4-1.2 5.2-24.5 20.9-32.5 4.3-2.2 14.7-5.8 26.8-7.2 2.7-.3 5.7-.5 9-.5 2.8 0 5.4.2 7.7.5.6 0 3.7.1 6.2 2.5 1.6 1.6 2.6 3.7 2.6 6.1v54.6c0 4.6-3.7 8.2-8.3 8.2h-55.3z"></path>
      
      {/* Текст логотипа */}
      <text transform="matrix(1.1751 0 0 1 42.016 232.72)" fill="#30B0C4" fontFamily="'KozGoPr6N-Regular-90ms-RKSJ-H'" fontSize="17.016">运城博雅医院</text>
    </svg>
  ),
  
  "Нейролайф": () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Фиолетовый круг с белым текстом */}
      <circle cx="100" cy="100" r="80" fill="#7C3AED" />
      <text x="100" y="110" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">Нейролайф</text>
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

import { Plane, TrainFront } from 'lucide-react';

export function getTransportIcon(transportType: string | null) {
  if (!transportType) return <span>-</span>;
  
  switch (transportType) {
    case 'Самолет':
      return <Plane className="h-4 w-4" />;
    case 'Поезд':
      return <TrainFront className="h-4 w-4" />;
    default:
      return <span>{transportType}</span>;
  }
}

'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow relative overflow-visible">
      {/* Icono en esquina superior derecha */}
      {icon && (
        <div className="absolute top-5 right-5 z-10">
          <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center opacity-80">
            {icon}
          </div>
        </div>
      )}
      
      {/* Contenido con padding derecho para evitar solapamiento con icono */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1 overflow-visible">
          {value}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-normal mt-2">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className={`flex items-center mt-2 text-sm ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span className="ml-1">{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}


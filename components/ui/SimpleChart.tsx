import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleChartProps {
  data: DataPoint[];
  type?: 'bar' | 'line';
  color?: string;
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
}

const SimpleChart: React.FC<SimpleChartProps> = ({
  data,
  type = 'bar',
  color = '#E91E63',
  height = 120,
  showLabels = true,
  showValues = false,
}) => {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-400 text-sm"
        style={{ height }}
      >
        Sin datos
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  if (type === 'line') {
    // Line chart using SVG
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * 100;
      const y = 100 - (d.value / maxValue) * 100;
      return `${x},${y}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    const areaD = `M 0,100 L ${points.join(' L ')} L 100,100 Z`;

    return (
      <div className="w-full" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Area fill */}
          <path
            d={areaD}
            fill={color}
            opacity={0.1}
          />
          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
          {/* Points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1 || 1)) * 100;
            const y = 100 - (d.value / maxValue) * 100;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={3}
                fill={color}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {showLabels && (
          <div className="flex justify-between mt-1">
            {data.map((d, i) => (
              <span
                key={i}
                className="text-[10px] text-gray-400 truncate"
                style={{ width: `${barWidth}%`, textAlign: 'center' }}
              >
                {d.label}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Bar chart
  return (
    <div className="w-full" style={{ height: height + (showLabels ? 20 : 0) }}>
      <div className="flex items-end justify-between gap-1 h-full" style={{ height }}>
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * 100;
          return (
            <div
              key={i}
              className="flex flex-col items-center justify-end"
              style={{ width: `${barWidth}%`, height: '100%' }}
            >
              {showValues && d.value > 0 && (
                <span className="text-[10px] text-gray-500 mb-1">
                  {d.value}
                </span>
              )}
              <div
                className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: color,
                  minHeight: d.value > 0 ? 4 : 0,
                }}
              />
            </div>
          );
        })}
      </div>
      {showLabels && (
        <div className="flex justify-between mt-1">
          {data.map((d, i) => (
            <span
              key={i}
              className="text-[10px] text-gray-400 truncate"
              style={{ width: `${barWidth}%`, textAlign: 'center' }}
            >
              {d.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleChart;

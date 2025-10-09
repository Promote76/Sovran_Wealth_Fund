import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface TokenAllocation {
  label: string;
  value: number;
  tokens: string;
  color: string;
  description: string;
  vestingPeriod?: string;
}

interface TokenomicsPieChartProps {
  allocations: TokenAllocation[];
  totalSupply: string;
  title?: string;
  showLegend?: boolean;
  interactive?: boolean;
  onSliceClick?: (allocation: TokenAllocation) => void;
}

const TokenomicsPieChart: React.FC<TokenomicsPieChartProps> = ({
  allocations,
  totalSupply,
  title = "SWF Token Distribution",
  showLegend = true,
  interactive = true,
  onSliceClick
}) => {
  const chartData = {
    labels: allocations.map(item => item.label),
    datasets: [
      {
        label: 'Token Allocation',
        data: allocations.map(item => item.value),
        backgroundColor: allocations.map(item => item.color),
        borderColor: allocations.map(item => item.color),
        borderWidth: 2,
        hoverBorderWidth: 4,
        hoverOffset: 10,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', 'system-ui', sans-serif",
          },
          color: '#1F2937',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const allocation = allocations[context.dataIndex];
            const lines = [
              `${allocation.label}: ${allocation.value}%`,
              `Tokens: ${allocation.tokens}`,
              `Description: ${allocation.description}`,
            ];
            
            if (allocation.vestingPeriod) {
              lines.push(`Vesting: ${allocation.vestingPeriod}`);
            }
            
            return lines;
          },
        },
      },
    },
    onClick: (event, elements) => {
      if (interactive && elements.length > 0 && onSliceClick) {
        const index = elements[0].index;
        onSliceClick(allocations[index]);
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      {title && (
        <div className="mb-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">Total Supply: {totalSupply} SWF</p>
        </div>
      )}
      
      <div className="relative" style={{ height: '400px' }}>
        <Pie data={chartData} options={options} />
      </div>
      
      {/* Mobile-friendly legend for small screens */}
      <div className="md:hidden mt-6">
        <div className="grid grid-cols-1 gap-2">
          {allocations.map((allocation, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: allocation.color }}
                />
                <span className="text-sm font-medium text-gray-900">
                  {allocation.label}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-700">
                {allocation.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Summary statistics */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {allocations.length}
            </p>
            <p className="text-sm text-gray-600">Distribution Categories</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {allocations.reduce((sum, item) => sum + item.value, 0)}%
            </p>
            <p className="text-sm text-gray-600">Total Allocated</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenomicsPieChart;
'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

interface TransactionChartProps {
  chartData: { blockNumber: string; count: number; totalFees?: number }[];
}


// Custom tooltip with proper typing
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    // Ensure we display the exact integer value, not interpolated
    const value = Math.round(payload[0].value);
    return (
      <div className="bg-purple-900/95 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 shadow-2xl">
        <p className="text-purple-200 text-sm font-medium">Block #{label}</p>
        <div className="flex items-center space-x-2 mt-2">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
          <p className="text-white font-bold text-lg">
            {value.toLocaleString()} transactions
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function TransactionChart({ chartData }: TransactionChartProps) {
    // Memoize calculations to prevent unnecessary recalculations
    const { maxValue, totalTx, avgTx } = useMemo(() => {
        const max = Math.max(...chartData.map(d => d.count), 1);
        const total = chartData.reduce((sum, d) => sum + d.count, 0);
        const avg = chartData.length > 0 ? Math.round(total / chartData.length) : 0;
        return {
            maxValue: max,
            totalTx: total,
            avgTx: avg
        };
    }, [chartData]);

    // Ensure all data points have integer values
    const cleanedData = useMemo(() => {
        return chartData.map(item => ({
            ...item,
            count: Math.round(item.count) // Ensure integer values
        }));
    }, [chartData]);
    
    return (
      <div className="space-y-4">
        {/* Header with stats */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Last 10 Blocks</h3>
            <p className="text-purple-300 text-sm">Real-time transaction volume by block</p>
          </div>
        </div>

        {/* Chart container with modern styling */}
        <div className="relative">
          {/* Background grid effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent rounded-xl"></div>
          
          <div className="relative h-80 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={cleanedData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="30%" stopColor="#a855f7" stopOpacity={0.6} />
                    <stop offset="70%" stopColor="#c084fc" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                
                <XAxis 
                  dataKey="blockNumber" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#c4b5fd' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  type="category"
                  tickFormatter={(value) => `#${value}`} // Add # prefix to block numbers
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#c4b5fd' }}
                  domain={[0, maxValue * 1.1]}
                  tickFormatter={(value) => Math.round(value).toString()}
                  type="number"
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Single clean Area chart */}
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="url(#strokeGradient)"
                  strokeWidth={3}
                  fill="url(#areaGradient)"
                  fillOpacity={1}
                  dot={false} // No dots for clean look
                  activeDot={{ 
                    r: 6, 
                    fill: '#8b5cf6', 
                    stroke: '#ffffff', 
                    strokeWidth: 2 
                  }}
                  isAnimationActive={true}
                  animationDuration={600} // Smooth animation
                  animationEasing="ease-in-out"
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Bottom stats bar */}
          <div className="flex items-center justify-between mt-4 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-purple-300 text-xs">Live Data</span>
              </div>
              <div className="text-purple-300 text-xs">
                Avg: {avgTx.toLocaleString()} tx/block
              </div>
            </div>
            <div className="text-purple-300 text-xs">
              Total: {totalTx.toLocaleString()} transactions
            </div>
          </div>
        </div>
      </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SevenDayData {
  dailyTransactions: Record<string, number>;
  totalTxsLast7Days: number;
  lastSyncedBlock: number;
  lastSyncedTimestamp: number;
}

interface ChartDataPoint {
  date: string;
  transactions: number;
  shortDate: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
  }>;
  label?: string;
}

export function SevenDayChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [totalTxs, setTotalTxs] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  const fetchSevenDayStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.monadfrens.fun/seven-days-stats');
      const data: SevenDayData = await response.json();
      
      // Format data for chart - keep original dates from API
      const formattedData = Object.entries(data.dailyTransactions)
        .map(([date, transactions]) => {
          // Create short date format from the API date (YYYY-MM-DD)
          const dateParts = date.split('-');
          const month = parseInt(dateParts[1]);
          const day = parseInt(dateParts[2]);
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          
          return {
            date,
            transactions,
            shortDate: `${monthNames[month - 1]} ${day}`
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date)); // Sort by original date string

      setChartData(formattedData);
      setTotalTxs(new Intl.NumberFormat().format(data.totalTxsLast7Days));
    } catch (error) {
      console.error('Error fetching 7-day stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSevenDayStats();
  }, []);

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-purple-900/90 backdrop-blur-sm border border-purple-500/30 rounded-lg p-3 shadow-xl">
          <p className="text-purple-200 text-sm">{label}</p>
          <p className="text-white font-semibold">
            {new Intl.NumberFormat().format(payload[0].value)} txs
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📈</span>
          </div>
          <div>
            <h3 className="text-purple-200 text-sm font-medium">7-Day Activity</h3>
            <p className="text-2xl font-bold text-white font-mono">Loading...</p>
          </div>
        </div>
        <div className="h-24 bg-purple-500/10 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <span className="text-2xl">📈</span>
        </div>
        <div>
          <h3 className="text-purple-200 text-sm font-medium">7-Day Activity</h3>
          <p className="text-2xl font-bold text-white font-mono">{totalTxs}</p>
        </div>
      </div>
      
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis 
              dataKey="shortDate" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#c4b5fd' }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="transactions" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#a855f7' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-purple-300 text-xs mt-2">
        Total transactions over the last 7 days
      </p>
    </div>
  );
}

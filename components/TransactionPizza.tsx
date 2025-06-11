'use client';

import { TxInfo, TxType } from '../types/transaction';
import { ReactElement } from 'react';

interface TransactionPizzaProps {
  chartData: { blockNumber: string; count: number }[]; // Updated interface
  latestTxs?: TxInfo[];
  maxTx?: number;
}

// Map transaction types to colors with modern gradients
const txTypeColors: Record<TxType, { color: string; gradient: string; name: string; icon: string }> = {
  transfer: { 
    color: '#10b981', 
    gradient: 'from-emerald-400 to-emerald-600',
    name: 'Transfer',
    icon: '💸'
  },
  swap: { 
    color: '#3b82f6', 
    gradient: 'from-blue-400 to-blue-600',
    name: 'Swap',
    icon: '🔄'
  },
  burn: { 
    color: '#ef4444', 
    gradient: 'from-red-400 to-red-600',
    name: 'Burn',
    icon: '🔥'
  },
  mint: { 
    color: '#f59e0b', 
    gradient: 'from-amber-400 to-amber-600',
    name: 'Mint',
    icon: '✨'
  },
  contract: { 
    color: '#8b5cf6', 
    gradient: 'from-purple-400 to-purple-600',
    name: 'Contract',
    icon: '📜'
  },
  unknown: { 
    color: '#6b7280', 
    gradient: 'from-gray-400 to-gray-600',
    name: 'Unknown',
    icon: '❓'
  },
};

export function TransactionPizza({ chartData, latestTxs = [], maxTx = 1000 }: TransactionPizzaProps) {
  // Use chartData as the source of truth
  const totalTx = chartData.reduce((sum, d) => sum + d.count, 0);
  const pizzaSize = Math.max(200, Math.min(300, 200 + (totalTx / maxTx) * 100));
  const toppingCount = Math.floor(totalTx / 15);

  // For legend, we'll estimate distribution based on recent transactions
  // but scale it to match the chartData total
  const recentTxTypes = latestTxs.slice(0, 100); // Use recent 100 for type distribution
  
  // Count transaction types from recent transactions
  const recentTypeCounts = Object.keys(txTypeColors).reduce((acc, type) => {
    acc[type as TxType] = 0;
    return acc;
  }, {} as Record<TxType, number>);

  recentTxTypes.forEach(tx => {
    recentTypeCounts[tx.type] = (recentTypeCounts[tx.type] || 0) + 1;
  });

  const recentTotal = Object.values(recentTypeCounts).reduce((sum, count) => sum + count, 0);

  // Scale the recent distribution to match chartData total
  const scaledTypeCounts = Object.keys(recentTypeCounts).reduce((acc, type) => {
    if (recentTotal > 0) {
      const proportion = recentTypeCounts[type as TxType] / recentTotal;
      acc[type as TxType] = Math.round(proportion * totalTx);
    } else {
      acc[type as TxType] = 0;
    }
    return acc;
  }, {} as Record<TxType, number>);

  // Generate toppings based on scaled counts - Add explicit typing
  const toppings: ReactElement[] = [];
  let toppingIndex = 0;
  
  Object.entries(scaledTypeCounts).forEach(([type, count]) => {
    const colorInfo = txTypeColors[type as TxType];
    const toppingsForType = Math.floor((count / totalTx) * toppingCount);
    
    for (let i = 0; i < toppingsForType && toppingIndex < toppingCount; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = (pizzaSize / 2) * 0.7 * Math.sqrt(Math.random());
      const x = pizzaSize / 2 + radius * Math.cos(angle);
      const y = pizzaSize / 2 + radius * Math.sin(angle);
      const size = 8 + Math.random() * 6;
      
      toppings.push(
        <circle
          key={toppingIndex}
          cx={x}
          cy={y}
          r={size}
          fill={colorInfo.color}
          opacity="0.85"
        />
      );
      toppingIndex++;
    }
  });

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Pizza Pizza Pizza...</h3>
      </div>

      {/* Pizza and Legend Side by Side */}
      <div className="flex items-start space-x-6">
        {/* Pizza */}
        <div className="flex-shrink-0">
          <svg width={pizzaSize} height={pizzaSize} style={{ background: 'none' }}>
            {/* Pizza base */}
            <circle
              cx={pizzaSize / 2}
              cy={pizzaSize / 2}
              r={pizzaSize / 2 - 8}
              fill="#f6e05e"
              stroke="#d69e2e"
              strokeWidth="8"
            />
            {/* Toppings */}
            {toppings}
          </svg>
        </div>

        {/* Compact Legend */}
        <div className="flex-1 min-w-[200px]">
          <h4 className="text-white font-medium mb-2 text-sm">Transaction Types</h4>
          <div className="space-y-1">
            {Object.entries(scaledTypeCounts)
              .sort(([,a], [,b]) => b - a)
              .map(([type, count]) => {
                const colorInfo = txTypeColors[type as TxType];
                const percentage = totalTx > 0 ? ((count / totalTx) * 100).toFixed(1) : '0';
                
                return (
                  <div 
                    key={type}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colorInfo.color }}
                      ></div>
                      <span className="text-xs text-white font-medium">
                        {colorInfo.icon} {colorInfo.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white mr-1">{count}</span>
                      <span className="text-xs text-purple-300">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
          </div>
          
          {/* Compact Summary stats */}
          <div className="mt-3 p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
            <div className="flex justify-between items-center mt-1">
              <span className="text-purple-200 text-xs">Activity Level</span>
              <div className="flex items-center space-x-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < Math.min(5, Math.ceil((totalTx / maxTx) * 5))
                        ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                        : 'bg-gray-600'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

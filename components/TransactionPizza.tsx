'use client';

import { TxInfo, TxType } from '../types/transaction';

interface TransactionPizzaProps {
  chartData: { time: string; count: number }[];
  latestTxs?: TxInfo[]; // Pass this prop from Dashboard
  maxTx?: number;
}

// Map transaction types to colors
const txTypeColors: Record<TxType, string> = {
  transfer: '#38a169', // green
  swap:     '#6366f1', // blue
  burn:     '#e53e3e', // red
  mint:     '#ecc94b', // yellow
  contract: '#805ad5', // purple
  unknown:  '#a0aec0', // gray
};

export function TransactionPizza({ chartData, latestTxs = [], maxTx = 1000 }: TransactionPizzaProps) {
  const totalTx = chartData.reduce((sum, d) => sum + d.count, 0);
  const pizzaSize = 100 + Math.min(totalTx, maxTx) / maxTx * 300; // 100-400px
  const toppingCount = Math.min(Math.floor(totalTx / 20), 50);

  // Get the last N transactions (up to toppingCount) for topping types
  const toppingsTx = latestTxs.slice(0, toppingCount);

  // Generate toppings based on transaction type
  const toppings = Array.from({ length: toppingCount }, (_, i) => {
    const txType = toppingsTx[i]?.type ?? 'unknown';
    const color = txTypeColors[txType];
    const angle = Math.random() * 2 * Math.PI;
    const radius = (pizzaSize / 2) * 0.7 * Math.sqrt(Math.random());
    const x = pizzaSize / 2 + radius * Math.cos(angle);
    const y = pizzaSize / 2 + radius * Math.sin(angle);
    return (
      <circle
        key={i}
        cx={x}
        cy={y}
        r={8 + Math.random() * 6}
        fill={color}
        opacity="0.85"
      />
    );
  });

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-2">🍕 Monad Pizza</h2>
      <div className="mb-2 text-gray-600 text-sm">
        {totalTx} transactions in last 10 blocks
      </div>
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
  );
}
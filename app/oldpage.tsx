// app/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const MONAD_RPC = 'https://testnet-rpc.monad.xyz';
const provider = new ethers.JsonRpcProvider(MONAD_RPC);

type TxType = 'transfer' | 'swap' | 'burn' | 'mint' | 'contract' | 'unknown';

interface TxInfo {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  type: TxType;
  gasUsed?: number;
  gasPrice?: string;
  txFee?: string;
  inputData?: string;
}

// Rate limiting utility
class RateLimiter {
  private queue: (() => Promise<unknown>)[] = [];
  private processing = false;
  private readonly delay: number;

  constructor(requestsPerSecond: number = 20) {
    this.delay = 1000 / requestsPerSecond;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const fn = this.queue.shift()!;
      await fn();
      
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    
    this.processing = false;
  }
}
const formatTxFee = (fee: string) => {
  const num = parseFloat(fee);
  if (num === 0) return '0';
  if (num < 0.000001) return '<0.000001';
  if (num < 0.001) return num.toFixed(6);
  return num.toFixed(4);
};
// Transaction type detection based on heuristics
function detectTransactionType(tx: ethers.TransactionResponse, receipt?: ethers.TransactionReceipt): TxType {
  const value = tx.value;
  const data = tx.data;
  const to = tx.to;
  const gasUsed = receipt?.gasUsed || BigInt(0);

  // Simple transfer (ETH only, no data)
  if (value > BigInt(0) && (!data || data === '0x') && to) {
    return 'transfer';
  }

  // Contract creation (no 'to' address)
  if (!to) {
    return 'contract';
  }

  // Burn transaction (sending to zero address or common burn addresses)
  const burnAddresses = [
    '0x0000000000000000000000000000000000000000',
    '0x000000000000000000000000000000000000dead',
  ];
  if (burnAddresses.includes(to.toLowerCase())) {
    return 'burn';
  }

  // Check function signatures in data for common patterns
  if (data && data.length >= 10) {
    const methodId = data.slice(0, 10).toLowerCase();
    
    // Common DEX swap signatures
    const swapSignatures = [
      '0x38ed1739', // swapExactTokensForTokens
      '0x7ff36ab5', // swapExactETHForTokens
      '0x18cbafe5', // swapExactTokensForETH
      '0x8803dbee', // swapTokensForExactTokens
      '0x02751cec', // swapETHForExactTokens
      '0x791ac947', // swapExactTokensForTokensSupportingFeeOnTransferTokens
      '0xb6f9de95', // swapExactETHForTokensSupportingFeeOnTransferTokens
      '0x5c11d795', // swapExactTokensForETHSupportingFeeOnTransferTokens
      '0x128acb08', // swapTokensForExactETH
      '0xfb3bdb41', // swapETHForExactTokens
    ];

    // Common mint signatures
    const mintSignatures = [
      '0x40c10f19', // mint(address,uint256)
      '0xa0712d68', // mint(uint256)
      '0x1249c58b', // mint()
    ];

    // Common burn signatures  
    const burnSignatures = [
      '0x42966c68', // burn(uint256)
      '0x9dc29fac', // burn(address,uint256)
      '0x8d1247ba', // burn(address,uint256,bytes)
    ];

    if (swapSignatures.includes(methodId)) {
      return 'swap';
    }
    
    if (mintSignatures.includes(methodId)) {
      return 'mint';
    }
    
    if (burnSignatures.includes(methodId)) {
      return 'burn';
    }
  }

  // High gas usage might indicate complex contract interaction
  if (gasUsed > BigInt(100000)) {
    return 'contract';
  }

  // Has data but doesn't match known patterns
  if (data && data !== '0x' && data.length > 2) {
    return 'contract';
  }

  return 'unknown';
}


// Get emoji and color for transaction type
function getTxTypeDisplay(type: TxType): { emoji: string; color: string; label: string } {
  switch (type) {
    case 'transfer':
      return { emoji: '💸', color: 'text-green-600', label: 'Transfer' };
    case 'swap':
      return { emoji: '🔄', color: 'text-blue-600', label: 'Swap' };
    case 'burn':
      return { emoji: '🔥', color: 'text-red-600', label: 'Burn' };
    case 'mint':
      return { emoji: '🪙', color: 'text-yellow-600', label: 'Mint' };
    case 'contract':
      return { emoji: '⚙️', color: 'text-purple-600', label: 'Contract' };
    default:
      return { emoji: '❓', color: 'text-gray-600', label: 'Unknown' };
  }
}

export default function Home() {
  const [latestTxs, setLatestTxs] = useState<TxInfo[]>([]);
  const txQueue = useRef<TxInfo[]>([]);
  const [chartData, setChartData] = useState<{ time: string; count: number }[]>([]);

  const rateLimiter = useRef(new RateLimiter(15));

  // Listen to new blocks and extract transactions
  useEffect(() => {
    provider.on('block', async (blockNumber) => {
      try {
        const block = await provider.getBlock(blockNumber);
        console.log(`New block: ${blockNumber} with ${block?.transactions.length} transactions`);
        if (!block) return;

        const maxTxsPerBlock = 10;
        const txHashes = block.transactions.slice(0, maxTxsPerBlock);
        
        const txPromises = txHashes.map(txHash => 
          rateLimiter.current.add(async () => {
            const tx = await provider.getTransaction(txHash);
            if (!tx) return null;
            
            // Try to get receipt for better type detection
            try {
              const receipt = await provider.getTransactionReceipt(txHash);
              return { tx, receipt };
            } catch {
              return { tx, receipt: null };
            }
          })
        );
        
        const batchSize = 5;
        const newTxs: TxInfo[] = [];
        
        for (let i = 0; i < txPromises.length; i += batchSize) {
          const batch = txPromises.slice(i, i + batchSize);
          try {
            const results = await Promise.all(batch);
            const batchTxs = results
              .filter((result): result is { tx: ethers.TransactionResponse; receipt: ethers.TransactionReceipt | null } => 
                result !== null && result.tx !== null
              )
              .map(({ tx, receipt }) => {
                const txType = detectTransactionType(tx, receipt || undefined);
                const gasUsed = receipt ? Number(receipt.gasUsed) : undefined;
                const gasPrice = tx.gasPrice ? ethers.formatEther(tx.gasPrice) : undefined;
                let txFee: string | undefined;
                if (gasUsed && tx.gasPrice) {
                  const feeInWei = BigInt(gasUsed) * tx.gasPrice;
                  txFee = ethers.formatEther(feeInWei);
                }
                
                return {
                  hash: tx.hash,
                  from: tx.from,
                  to: tx.to ?? '0x0',
                  value: ethers.formatEther(tx.value),
                  timestamp: Date.now(),
                  blockNumber: blockNumber,
                  type: txType,
                  gasUsed: gasUsed,
                  gasPrice: gasPrice,
                  txFee: txFee,
                  inputData: tx.data
                };
              });
            newTxs.push(...batchTxs);
          } catch (error) {
            console.warn(`Failed to fetch transaction batch:`, error);
          }
        }

        txQueue.current.push(...newTxs);

        setLatestTxs(prev => {
          const updated = [...newTxs, ...prev];
          return updated.slice(0, 50);
        });

        setChartData((prev) => {
          const now = new Date();
          const label = now.toLocaleTimeString();
          const updated = [...prev, { time: label, count: block.transactions.length }];
          return updated.slice(-10);
        });
      } catch (error) {
        console.error('Error processing block:', error);
      }
    });

    return () => {
      provider.removeAllListeners();
    };
  }, []);


  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatValue = (value: string) => {
    const num = parseFloat(value);
    if (num === 0) return '0';
    if (num < 0.001) return '<0.001';
    return num.toFixed(4);
  };

  return (
    <main className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">🔥 Monad Testnet Dashboard</h1>

      {/* Main content grid - transactions on left, chart on right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Latest Transactions */}
        <section className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">📋 Latest Transactions ({latestTxs.length}/50)</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hash
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      To
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value (MON)
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {latestTxs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Waiting for transactions...
                      </td>
                    </tr>
                  ) : (
                    latestTxs.map((tx, index) => {
                      const typeDisplay = getTxTypeDisplay(tx.type);
                      return (
                        <motion.tr
                          key={tx.hash}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index < 5 ? index * 0.1 : 0 }}
                          className={`hover:bg-gray-50 ${index < 3 ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                            {formatTime(tx.timestamp)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-gray-900">
                            <a
                              href={`https://testnet.monadscan.com/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {formatAddress(tx.hash)}
                            </a>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-sm">{typeDisplay.emoji}</span>
                              <span className={`text-xs font-medium ${typeDisplay.color}`}>
                                {typeDisplay.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-gray-900">
                            {formatAddress(tx.from)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-gray-900">
                            {formatAddress(tx.to)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                            <span className={`${parseFloat(tx.value) > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                              {formatValue(tx.value)}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                            {tx.gasUsed ? (
                              <span className="text-xs bg-gray-100 px-1 py-1 rounded">
                                {tx.txFee ? formatTxFee(tx.txFee) : 'N/A'}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right side - Chart */}
        <section className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-2">📊 TX Volume (last 10 blocks)</h2>
          <div className="mb-4 text-sm text-gray-600">
            Queue: {txQueue.current.length} transactions pending
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
        </section>
      </div>
    </main>
  );
}

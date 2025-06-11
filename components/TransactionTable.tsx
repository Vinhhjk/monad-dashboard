'use client';

import { motion } from 'framer-motion';
import { TxInfo } from '../types/transaction';
import { getTxTypeDisplay, formatTime, formatAddress, formatValue, formatTxFee } from '../utils/transactionUtils';

interface TransactionTableProps {
  transactions: TxInfo[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function TransactionTable({ transactions, onMouseEnter, onMouseLeave }: TransactionTableProps) {
  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent rounded-xl"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span className="text-purple-300 text-sm">
              Showing latest {transactions.length} of 50 transactions
            </span>
          </div>
        </div>

        {/* Modern table container */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
            <table className="w-full">
              <thead className="bg-white/10 backdrop-blur-sm sticky top-0 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    Hash
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    Value (MON)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                    Block
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <span className="text-2xl">⏳</span>
                        </div>
                        <p className="text-purple-300">Waiting for transactions...</p>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, index) => {
                    const typeDisplay = getTxTypeDisplay(tx.type);
                    const isRecent = index < 3;
                    
                    return (
                      <motion.tr
                        key={tx.hash}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index < 5 ? index * 0.1 : 0 }}
                        className={`
                          hover:bg-white/10 transition-all duration-200 group
                          ${isRecent ? 'bg-purple-500/10 border-l-2 border-l-purple-400' : ''}
                        `}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-white">
                          <div className="flex items-center space-x-2">
                            {isRecent && (
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                            )}
                            <span className="font-mono">{formatTime(tx.timestamp)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-mono">
                          <a
                            href={`https://testnet.monadscan.com/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-300 hover:text-purple-100 hover:underline transition-colors duration-200 group-hover:text-purple-200"
                          >
                            {formatAddress(tx.hash)}
                          </a>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{typeDisplay.emoji}</span>
                            <span className={`
                              text-xs font-medium px-2 py-1 rounded-full
                              ${typeDisplay.label === 'Transfer' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : ''}
                              ${typeDisplay.label === 'Contract' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : ''}
                              ${typeDisplay.label === 'Unknown' ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30' : ''}
                            `}>
                              {typeDisplay.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-purple-200">
                          <span className="bg-white/5 px-2 py-1 rounded border border-white/10">
                            {formatAddress(tx.from)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-purple-200">
                          <span className="bg-white/5 px-2 py-1 rounded border border-white/10">
                            {formatAddress(tx.to)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          <span className={`
                            font-mono font-medium
                            ${parseFloat(tx.value) > 0 
                              ? 'text-green-300 bg-green-500/10 px-2 py-1 rounded border border-green-500/20' 
                              : 'text-gray-400'
                            }
                          `}>
                            {formatValue(tx.value)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          {tx.gasUsed ? (
                            <span className="text-xs bg-purple-500/20 text-purple-200 px-2 py-1 rounded border border-purple-500/30 font-mono">
                              {tx.txFee ? formatTxFee(tx.txFee) : 'N/A'}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-white">
                          <span className="bg-indigo-500/20 text-indigo-200 px-2 py-1 rounded border border-indigo-500/30">
                            #{tx.blockNumber}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom info bar */}
        <div className="flex items-center justify-between mt-4 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-xs">Live Updates</span>
            </div>
            <span className="text-purple-300 text-xs">
              Auto-refresh every block
            </span>
          </div>
          <div className="text-purple-300 text-xs">
            Scroll to see more transactions
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { TxInfo } from '../types/transaction';
import { getTxTypeDisplay, formatTime, formatAddress, formatTxFee } from '../utils/transactionUtils';

interface TransactionTableProps {
  transactions: TxInfo[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function TransactionTable({ transactions, onMouseEnter, onMouseLeave}: TransactionTableProps) {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">📋 Latest Transactions ({transactions.length}/50)</h2>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
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
                  Fee
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Block
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Waiting for transactions...
                  </td>
                </tr>
              ) : (
                transactions.map((tx, index) => {
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
                        {tx.gasUsed ? (
                          <span className="text-xs bg-gray-100 px-1 py-1 rounded">
                            {tx.txFee ? formatTxFee(tx.txFee) : 'N/A'}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-gray-900">
                        {tx.blockNumber}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

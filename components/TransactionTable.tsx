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
      {/* Header - Responsive */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <h2 className="text-white text-base sm:text-lg font-medium">Live Activity</h2>
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
        <span className="text-purple-300 text-xs sm:text-sm hidden sm:block">
          Click on any item for details
        </span>
      </div>

      {/* Transaction List - Mobile Optimized */}
      <div className="space-y-2 sm:space-y-3">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center space-y-4 py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-purple-400/30">
              <span className="text-2xl sm:text-3xl">⏳</span>
            </div>
            <p className="text-purple-300 text-base sm:text-lg">Waiting for transactions...</p>
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        ) : (
          transactions.map((tx, index) => {
            const typeDisplay = getTxTypeDisplay(tx.type);
            const isRecent = index < 3;
            
            return (
              <motion.div
                key={tx.hash}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index < 5 ? index * 0.1 : 0 }}
                className={`
                  group relative bg-purple-900/20 backdrop-blur-md hover:bg-purple-800/30 
                  border border-purple-500/30 hover:border-purple-400/50
                  rounded-xl p-3 sm:p-4 transition-all duration-200 cursor-pointer
                  shadow-lg hover:shadow-purple-500/20
                  ${isRecent ? 'ring-1 ring-purple-400/40 bg-purple-500/10 shadow-purple-400/20' : ''}
                `}
                onClick={() => window.open(`https://testnet.monadscan.com/tx/${tx.hash}`, '_blank')}
              >
                {/* Mobile Layout - Stacked */}
                <div className="block sm:hidden">
                  {/* Top Row - Type Icon + Hash + Value */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center text-sm backdrop-blur-sm
                        ${typeDisplay.label === 'Transfer' ? 'bg-purple-500/30 border border-purple-400/40' : ''}
                        ${typeDisplay.label === 'Contract' ? 'bg-indigo-500/30 border border-indigo-400/40' : ''}
                        ${typeDisplay.label === 'Unknown' ? 'bg-purple-600/30 border border-purple-500/40' : ''}
                      `}>
                        {typeDisplay.emoji}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className="text-white font-medium hover:text-purple-300 transition-colors font-mono text-xs truncate">
                            {formatAddress(tx.hash)} {/* Shorter on mobile */}
                          </span>
                          {isRecent && (
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Value - Right aligned */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-purple-100 font-medium text-sm">
                        <span className="font-mono">
                          {parseFloat(tx.value) > 0 ? formatValue(tx.value) : '0 MON'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Second Row - From/To addresses */}
                  <div className="text-purple-300 text-xs font-mono mb-2">
                    <div className="flex items-center space-x-1">
                      <span className="truncate flex-1">{formatAddress(tx.from)}</span>
                      <span className="flex-shrink-0 text-purple-400">→</span>
                      <span className="truncate flex-1">{formatAddress(tx.to)}</span>
                    </div>
                  </div>
                  
                  {/* Third Row - Type, Time, Block */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className={`
                        px-2 py-1 rounded-full font-medium text-xs backdrop-blur-sm
                        ${typeDisplay.label === 'Transfer' ? 'bg-purple-500/30 text-purple-200 border border-purple-400/30' : ''}
                        ${typeDisplay.label === 'Contract' ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30' : ''}
                        ${typeDisplay.label === 'Unknown' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : ''}
                      `}>
                        {typeDisplay.label}
                      </span>
                      
                      <span className="text-purple-300 font-mono">
                        #{tx.blockNumber}
                      </span>
                    </div>
                    
                    <div className="text-purple-400 text-xs">
                      {formatTime(tx.timestamp)}
                    </div>
                  </div>
                  
                  {/* Fee info if available */}
                  {tx.txFee && (
                    <div className="mt-2 pt-2 border-t border-purple-500/30">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-purple-400">Fee:</span>
                        <span className="text-purple-200 font-mono">
                          {formatTxFee(tx.txFee)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:block">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center text-lg backdrop-blur-sm
                        ${typeDisplay.label === 'Transfer' ? 'bg-purple-500/30 border border-purple-400/40' : ''}
                        ${typeDisplay.label === 'Contract' ? 'bg-indigo-500/30 border border-indigo-400/40' : ''}
                        ${typeDisplay.label === 'Unknown' ? 'bg-purple-600/30 border border-purple-500/40' : ''}
                      `}>
                        {typeDisplay.emoji}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Transaction Hash */}
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-white font-medium hover:text-purple-300 transition-colors font-mono text-sm">
                            {formatAddress(tx.hash)}
                          </span>
                          {isRecent && (
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        
                        {/* Transaction Details */}
                        <div className="text-purple-300 text-sm font-mono">
                          <div className="flex items-center space-x-2">
                            <span>{formatAddress(tx.from)}</span>
                            <span className="text-purple-400">→</span>
                            <span>{formatAddress(tx.to)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - Value/Time */}
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-purple-100 font-medium mb-1">
                        <span className="font-mono">
                          {parseFloat(tx.value) > 0 ? formatValue(tx.value) : '0 MON'}
                        </span>
                      </div>
                      <div className="text-purple-400 text-sm">
                        {formatTime(tx.timestamp)}
                      </div>
                    </div>
                    
                    {/* Arrow indicator */}
                    <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Additional Info Row for Desktop */}
                  <div className="mt-3 pt-3 border-t border-purple-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-purple-400">Type:</span>
                        <span className={`
                          px-2 py-1 rounded-full font-medium backdrop-blur-sm
                          ${typeDisplay.label === 'Transfer' ? 'bg-purple-500/30 text-purple-200 border border-purple-400/30' : ''}
                          ${typeDisplay.label === 'Contract' ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30' : ''}
                          ${typeDisplay.label === 'Unknown' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : ''}
                        `}>
                          {typeDisplay.label}
                        </span>
                      </div>
                      
                      {tx.txFee && (
                        <div className="flex items-center space-x-1">
                          <span className="text-purple-400">Fee:</span>
                          <span className="text-purple-200 font-mono">
                            {formatTxFee(tx.txFee)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <span className="text-purple-400">Block:</span>
                        <span className="text-purple-300 font-mono">
                          #{tx.blockNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Bottom info bar - Responsive */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 sm:mt-6 px-3 sm:px-4 py-3 bg-purple-900/20 backdrop-blur-md rounded-lg border border-purple-500/30 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-200 text-xs sm:text-sm font-medium">Live Updates</span>
          </div>
          <span className="text-purple-300 text-xs sm:text-sm">
            Auto-refresh every block
          </span>
        </div>
        <div className="text-purple-300 text-xs sm:text-sm">
          Showing latest {transactions.length} transactions
        </div>
      </div>
    </div>
  );
}

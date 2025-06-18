'use client';

import { useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import { TransactionTable } from './TransactionTable';
import { TransactionChart } from './TransactionChart';
import { RateLimiter } from '../utils/RateLimiter';
import { detectTransactionType } from '../utils/transactionUtils';
import { TxInfo } from '../types/transaction';
import { TransactionPizza, TransactionPizzaGif } from './TransactionPizza';
import { SevenDayChart } from './SevenDayChart';
import { FaXTwitter } from "react-icons/fa6";

const MONAD_RPC = 'https://monad-testnet.rpc.hypersync.xyz';
const provider = new ethers.JsonRpcProvider(MONAD_RPC);

export function Dashboard() {
    const [latestTxs, setLatestTxs] = useState<TxInfo[]>([]);

    const [chartData, setChartData] = useState<{ blockNumber: string; count: number; totalFees?: number }[]>([]);
    const [latestBlock, setLatestBlock] = useState<number | null>(null);
    const [paused, setPaused] = useState(false);
    const [totalTxs, setTotalTxs] = useState<string>('Loading...');
    const [lastQueriedBlock, setLastQueriedBlock] = useState<string>('Loading...');
    const [totalFeesLast10Blocks, setTotalFeesLast10Blocks] = useState<number>(0)
    // TPS related state
    const [currentTPS, setCurrentTPS] = useState<number>(0);
    const [avgTPS, setAvgTPS] = useState<number>(0);
    const tpsHistory = useRef<Array<{ timestamp: number; txCount: number; blockTime: number }>>([]);

    const rateLimiter = useRef(new RateLimiter(15));

    const fetchTotalTxs = async () => {
        try {
            const response = await fetch('https://api.monadfrens.fun/get-txs-count');
            const data = await response.json();
            const formattedNumber = new Intl.NumberFormat().format(data.totalTxs);
            setTotalTxs(formattedNumber);
            setLastQueriedBlock(data.lastQueriedBlock.toString());
        } catch (error) {
            console.error('Error fetching total transactions:', error);
            setTotalTxs('Error loading');
            setLastQueriedBlock('Error loading');
        }
    };

    const calculateTPS = (txCount: number, blockTimestamp: number) => {
        
        // Add current block data to history with actual block timestamp
        tpsHistory.current.push({
            timestamp: blockTimestamp * 1000, // Convert to milliseconds
            txCount,
            blockTime: 0 // We'll calculate this differently
        });
    
        // Keep only last 10 blocks for calculation
        if (tpsHistory.current.length > 10) {
            tpsHistory.current = tpsHistory.current.slice(-10);
        }
    
        // Calculate block time using actual block timestamps
        let actualBlockTime = 1; // Default fallback
        if (tpsHistory.current.length >= 2) {
            const currentBlock = tpsHistory.current[tpsHistory.current.length - 1];
            const previousBlock = tpsHistory.current[tpsHistory.current.length - 2];
            actualBlockTime = (currentBlock.timestamp - previousBlock.timestamp) / 1000; // Convert to seconds
            
            // Ensure reasonable block time (avoid division by zero or negative values)
            if (actualBlockTime <= 0 || actualBlockTime > 60) {
                actualBlockTime = 1; // Fallback to 1 second
            }
        }
    
        // Calculate current TPS using actual block time
        const currentBlockTPS = actualBlockTime > 0 ? txCount / actualBlockTime : 0;
        setCurrentTPS(currentBlockTPS);
    
        // Calculate average TPS over last few blocks using actual timestamps
        if (tpsHistory.current.length >= 2) {
            const totalTxs = tpsHistory.current.reduce((sum, block) => sum + block.txCount, 0);
            const timeSpan = (tpsHistory.current[tpsHistory.current.length - 1].timestamp - 
                             tpsHistory.current[0].timestamp) / 1000; // Convert to seconds
            
                             const avgBlockTPS = timeSpan > 0 ? totalTxs / timeSpan : 0;
                             setAvgTPS(avgBlockTPS);
                         }
                     };
                     
                     useEffect(() => {
                         fetchTotalTxs();
                     }, []);
                     
                     useEffect(() => {
                         const handleNewBlock = async (blockNumber: number) => {
                             setLatestBlock(blockNumber);
                             try {
                                 const block = await rateLimiter.current.add(() =>
                                     provider.send('eth_getBlockByNumber', [ethers.toBeHex(blockNumber), true])
                                 );
                                 const txs = block?.transactions ?? [];
                                 const txCount = txs.length;
                                 const currentBlockTimestamp = Number(block.timestamp);
                                 
                                 calculateTPS(txCount, currentBlockTimestamp);
                         
                                 // Calculate total fees for this block
                                 const blockTotalFees = txs.reduce((sum: number, tx: { gas?: string; gasPrice?: string }) => {
                                     const gasUsed = tx.gas ? Number(tx.gas) : 0;
                                     const gasPrice = tx.gasPrice ? BigInt(tx.gasPrice) : BigInt(0);
                                     if (gasUsed > 0 && gasPrice > 0) {
                                         const feeInEther = parseFloat(ethers.formatEther(BigInt(gasUsed) * gasPrice));
                                         return sum + feeInEther;
                                     }
                                     return sum;
                                 }, 0);
                         
                                 setChartData(prev => {
                                     const blockNumberStr = blockNumber.toString();
                                     const updated = [...prev, { 
                                         blockNumber: blockNumberStr, 
                                         count: txCount,
                                         totalFees: blockTotalFees 
                                     }];
                                     const last10 = updated.slice(-10);
                                     
                                     // Calculate total fees for last 10 blocks
                                     const totalFees = last10.reduce((sum, block) => sum + (block.totalFees || 0), 0);
                                     setTotalFeesLast10Blocks(totalFees);
                                     
                                     return last10;
                                 });
                                 
                                 const txsForBlock: TxInfo[] = txs.map((tx: TxInfo) => {
                                     const gasUsed = tx.gas ? Number(tx.gas) : undefined;
                                     const gasPrice = tx.gasPrice ? ethers.formatEther(BigInt(tx.gasPrice)) : undefined;
                                     let txFee: string | undefined;
                                     if (gasUsed !== undefined && tx.gasPrice) {
                                         txFee = ethers.formatEther(BigInt(gasUsed) * BigInt(tx.gasPrice));
                                     }
                                     
                                     return {
                                         hash: tx.hash,
                                         from: tx.from,
                                         to: tx.to ?? '0x0',
                                         timestamp: Number(block.timestamp) * 1000,
                                         blockNumber: Number(block.number),
                                         value: tx.value ? ethers.formatEther(BigInt(tx.value)) : "0",
                                         type: detectTransactionType({
                                             hash: tx.hash,
                                             from: tx.from,
                                             to: tx.to ?? '0x0',
                                             value: tx.value ? ethers.formatEther(BigInt(tx.value)) : "0",
                                             timestamp: Number(block.timestamp) * 1000,
                                             blockNumber: Number(block.number),
                                             input: tx.input,
                                             type: 'unknown',
                                         }),
                                         gasUsed,
                                         gasPrice,
                                         txFee,
                                     };
                                 });
                                 
                                 setLatestTxs(prev => {
                                     if (paused) return prev;
                                     const combined = [...txsForBlock, ...prev];
                                     return combined.slice(0, 50);
                                 });
                         
                             } catch (error) {
                                 console.error('Error processing block:', error);
                             }
                         };
                         
                         provider.on('block', handleNewBlock);
                     
                         return () => {
                             provider.removeAllListeners();
                         };
                     }, [paused]);
                     
                     
                     return (
                         <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
                             {/* Background Pattern */}
                             <div 
                                 className="absolute inset-0 opacity-20"
                                 style={{
                                     backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a855f7' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                                 }}
                             ></div>
                             
                             <main className="relative z-10 p-4 sm:p-6 space-y-6 sm:space-y-8">
                                 {/* Header - Responsive */}
                                 <header className="flex items-center justify-between">
                                     {/* Left side - Monad Frens */}
                                     <div className="flex items-center space-x-3">
                                         <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-200 via-purple-100 to-white bg-clip-text text-transparent">
                                             Monad Frens
                                         </h1>
                                     </div>
                                     
                                     <a 
                                         href="https://x.com/WagmiArc" 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className="text-white hover:text-purple-300 transition-colors duration-200 p-2 rounded-lg hover:bg-purple-500/10 backdrop-blur-sm"
                                     >
                                         <FaXTwitter size={20} className="sm:w-6 sm:h-6" />
                                     </a>
                                 </header>
                 
                                 {/* Main Title Section - Responsive */}
                                 <div className="text-center space-y-4">
                                     <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-200 via-purple-100 to-white bg-clip-text text-transparent">
                                         🔥 Monad Testnet Dashboard
                                     </h2>
                                     <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto rounded-full"></div>
                                 </div>
                                 
                                 {/* Stats Cards - Responsive Grid */}
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                     {/* Total Transactions Card */}
                                     <div className="bg-purple-900/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-500/30 shadow-xl shadow-purple-500/10 h-[160px] sm:h-[200px] flex flex-col justify-between">
                                         <div className="flex items-center space-x-3">
                                             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                 <span className="text-xl sm:text-2xl">📊</span>
                                             </div>
                                             <div>
                                                 <h3 className="text-purple-200 text-xs sm:text-sm font-medium">Total Transactions</h3>
                                                 <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{totalTxs}</p>
                                             </div>
                                         </div>
                                         <p className="text-purple-300 text-xs sm:text-sm">
                                             Updated every hour • Block {lastQueriedBlock}
                                         </p>
                                     </div>
                 
                                     {/* Latest Block Card */}
                                     <div className="bg-purple-900/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-500/30 shadow-xl shadow-purple-500/10 h-[160px] sm:h-[200px] flex flex-col justify-between">
                                         <div className="flex items-center space-x-3">
                                             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                 <span className="text-xl sm:text-2xl">⛓️</span>
                                             </div>
                                             <div>
                                                 <h3 className="text-purple-200 text-xs sm:text-sm font-medium">Latest Block</h3>
                                                 <p className="text-2xl sm:text-3xl font-bold text-white font-mono">
                                                     {latestBlock !== null ? latestBlock.toLocaleString() : 'Loading...'}
                                                 </p>
                                             </div>
                                         </div>
                                         <div className="flex items-center">
                                             <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                                             <span className="text-green-300 text-xs sm:text-sm">Live</span>
                                         </div>
                                     </div>
                 
                                     {/* TPS Card */}
                                     <div className="bg-purple-900/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-500/30 shadow-xl shadow-purple-500/10 h-[160px] sm:h-[200px] flex flex-col justify-between">
                                         <div className="flex items-center space-x-3">
                                             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                 <span className="text-xl sm:text-2xl">⚡</span>
                                             </div>
                                             <div>
                                                 <h3 className="text-purple-200 text-xs sm:text-sm font-medium">Current TPS</h3>
                                                 <p className="text-2xl sm:text-3xl font-bold text-white font-mono">
                                                     {currentTPS.toFixed(1)}
                                                 </p>
                                             </div>
                                         </div>
                                         <div className="space-y-1">
                                             <p className="text-green-300 text-xs sm:text-sm">
                                                 Avg: {avgTPS.toFixed(1)} TPS
                                             </p>
                                             <div className="flex items-center">
                                                 <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                                                 <span className="text-green-300 text-xs">Real-time</span>
                                             </div>
                                         </div>
                                     </div>
                 
                                     {/* 7-Day Chart Card */}
                                     <div className="sm:col-span-2 lg:col-span-1 ">
                                         <SevenDayChart />
                                     </div>
                                 </div>
                 
                                 {/* Chart and Pizza Section - Responsive Layout */}
                                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                                     {/* Transaction Activity Chart */}
                                     <section className="bg-purple-900/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-500/30 shadow-xl shadow-purple-500/10">
                                         <div className="flex items-center justify-between mb-4 sm:mb-6">
                                             <div className="flex items-center space-x-3">
                                                 <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                                     <span className="text-sm sm:text-lg">📈</span>
                                                 </div>
                                                 <h2 className="text-lg sm:text-xl font-semibold text-white">Transaction Activity</h2>
                                             </div>
                                         </div>
                                         <div className="w-full overflow-hidden">
                                             <TransactionChart 
                                                 chartData={chartData}
                                                 totalFees={totalFeesLast10Blocks}
                                             />
                                         </div>
                                     </section>
                                     
                                     {/* Transaction Pizza - Enhanced Mobile Support */}
                                     <section className="bg-purple-900/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-500/30 shadow-xl shadow-purple-500/10 relative overflow-visible">
                                         <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                                             <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                                 <span className="text-sm sm:text-lg">🍕</span>
                                             </div>
                                             <h2 className="text-lg sm:text-xl font-semibold text-white">Monad Pizza?</h2>
                                         </div>
                                         
                                         {/* GIF overlays the entire section */}
                                         <TransactionPizzaGif chartData={chartData} latestTxs={latestTxs} />
                                         
                                         {/* Pizza container with proper mobile handling */}
                                         <div className="w-full min-h-[400px] sm:min-h-[500px]">
                                             <TransactionPizza chartData={chartData} latestTxs={latestTxs} />
                                         </div>
                                     </section>
                                 </div>
                 
                                 {/* Transactions Table - Responsive */}
                                 <section className="bg-purple-900/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-500/30 shadow-xl shadow-purple-500/10">
                                     <div className="flex items-center justify-between mb-4 sm:mb-6">
                                         <div className="flex items-center space-x-3">
                                             <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                                 <span className="text-sm sm:text-lg">📋</span>
                                             </div>
                                             <h2 className="text-lg sm:text-xl font-semibold text-white">Recent Transactions</h2>
                                         </div>
                                         {paused && (
                            <div className="flex items-center space-x-2 bg-yellow-500/20 px-2 sm:px-3 py-1 rounded-full border border-yellow-500/30">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <span className="text-yellow-300 text-xs sm:text-sm">Paused</span>
                        </div>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <TransactionTable
                        transactions={latestTxs}
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                    />
                </div>
            </section>
        </main>
    </div>
);
}

                 

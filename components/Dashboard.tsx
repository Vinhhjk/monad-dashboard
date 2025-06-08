'use client';

import { useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import { TransactionTable } from './TransactionTable';
import { TransactionChart } from './TransactionChart';
import { RateLimiter } from '../utils/RateLimiter';
import { detectTransactionType } from '../utils/transactionUtils';
import { TxInfo } from '../types/transaction';
import { TransactionPizza } from './TransactionPizza';
const MONAD_RPC = 'https://monad-testnet.rpc.hypersync.xyz';
const provider = new ethers.JsonRpcProvider(MONAD_RPC);

export function Dashboard() {
    const [latestTxs, setLatestTxs] = useState<TxInfo[]>([]);
    const [pizzaTxs, setPizzaTxs] = useState<TxInfo[]>([]);
    const [pizzaBlockCount, setPizzaBlockCount] = useState(0);
    const [chartData, setChartData] = useState<{ time: string; count: number }[]>([]);
    const [latestBlock, setLatestBlock] = useState<number | null>(null);
    const [paused, setPaused] = useState(false);
    const [totalTxs, setTotalTxs] = useState<string>('Loading...');
    const [lastQueriedBlock, setLastQueriedBlock] = useState<string>('Loading...');

    const rateLimiter = useRef(new RateLimiter(15));
    const pizzaBlockTrigger = 10; // Reset after 10 blocks

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
    
    // Add this new useEffect before the existing one
    useEffect(() => {
        fetchTotalTxs();
    }, []);
    useEffect(() => {
        provider.on('block', async (blockNumber) => {
            setLatestBlock(blockNumber);
            try {
                // Fetch the full block with transactions
                const block =  await rateLimiter.current.add(() =>
                    provider.send('eth_getBlockByNumber', [ethers.toBeHex(blockNumber), true])
                );
                const txs = block?.transactions ?? [];
                const txCount = txs.length;
    
                setChartData(prev => {
                    const now = new Date();
                    const label = now.toLocaleTimeString();
                    const updated = [...prev, { time: label, count: txCount }];
                    return updated.slice(-10);
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
                            input: tx.input, // use tx.input, not tx.inputData
                            type: 'unknown', // placeholder, not used in detection
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
                setPizzaTxs(prev => {
                    const combined = [...txsForBlock, ...prev];
                    return pizzaBlockCount + 1 >= pizzaBlockTrigger ? [] : combined.slice(0, 100);
                });
                setPizzaBlockCount(prev => (prev + 1 >= pizzaBlockTrigger ? 0 : prev + 1));
    
            } catch (error) {
                console.error('Error processing block:', error);
            }
        });
    
        return () => {
            provider.removeAllListeners();
        };
    }, [pizzaBlockCount]);

    return (
        <main className="p-6 space-y-8">
            <h1 className="text-3xl font-bold">🔥 Monad Testnet Dashboard</h1>
            
            <div className="space-y-1">
                <p className="font-semibold text-xl">
                    Total Transactions: <span className="font-mono text-green-600">{totalTxs}</span>
                </p>
                <p className="text-sm text-gray-500">
                    Updated every hour, last update: Block {lastQueriedBlock}
                </p>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p className="font-semibold">
                    Latest Block: <span className="font-mono">{latestBlock !== null ? latestBlock : 'Loading...'}</span>
                </p>
            </div>
            {/* Chart and Pizza side by side at the top */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="lg:col-span-1">
                    <TransactionChart 
                        chartData={chartData} 
                        queueLength={pizzaTxs.length} 
                    />
                </section>
                <section className="lg:col-span-1 flex items-center justify-center">
                    <TransactionPizza chartData={chartData} latestTxs={pizzaTxs} />
                </section>
            </div>

            {/* Transactions Table below */}
            <section>
                <TransactionTable
                    transactions={latestTxs}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                />            
            </section>
        </main>
    );
}
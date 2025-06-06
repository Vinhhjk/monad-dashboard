'use client';

import { useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import { TransactionTable } from './TransactionTable';
import { TransactionChart } from './TransactionChart';
import { RateLimiter } from '../utils/RateLimiter';
import { detectTransactionType } from '../utils/transactionUtils';
import { TxInfo, MonadReceipt } from '../types/transaction';
import { TransactionPizza } from './TransactionPizza';
const MONAD_RPC = 'https://testnet-rpc.monad.xyz';
const provider = new ethers.JsonRpcProvider(MONAD_RPC);

export function Dashboard() {
    const [latestTxs, setLatestTxs] = useState<TxInfo[]>([]);
    const [pizzaTxs, setPizzaTxs] = useState<TxInfo[]>([]);
    const [pizzaBlockCount, setPizzaBlockCount] = useState(0);
    const [chartData, setChartData] = useState<{ time: string; count: number }[]>([]);
    const [latestBlock, setLatestBlock] = useState<number | null>(null);
    const [paused, setPaused] = useState(false);
    const rateLimiter = useRef(new RateLimiter(15));
    const pizzaBlockTrigger = 10; // Reset after 10 blocks

    useEffect(() => {
        provider.on('block', async (blockNumber) => {
            setLatestBlock(blockNumber);
            try {
                const block = await provider.getBlock(blockNumber);
                const txCount = block?.transactions?.length ?? 0;
    
                setChartData(prev => {
                    const now = new Date();
                    const label = now.toLocaleTimeString();
                    const updated = [...prev, { time: label, count: txCount }];
                    return updated.slice(-10);
                });
                const receipts = await rateLimiter.current.add(() =>
                    provider.send('eth_getBlockReceipts', [ethers.toBeHex(blockNumber)])
                );
                // console.log(`Processing block ${blockNumber} with ${receipts.length} transactions`);
                const txsForBlock: TxInfo[] = receipts.map((receipt: MonadReceipt) => {
                    const gasUsed = receipt.gasUsed ? Number(receipt.gasUsed) : undefined;
                    const gasPrice = receipt.effectiveGasPrice
                        ? ethers.formatEther(BigInt(receipt.effectiveGasPrice))
                        : undefined;
                    let txFee: string | undefined;
                    if (gasUsed && receipt.effectiveGasPrice) {
                        const feeInWei = BigInt(gasUsed) * BigInt(receipt.effectiveGasPrice);
                        txFee = ethers.formatEther(feeInWei);
                    }
                    return {
                        hash: receipt.transactionHash,
                        from: receipt.from,
                        to: receipt.to ?? '0x0',
                        timestamp: Date.now(),
                        blockNumber: Number(receipt.blockNumber),
                        type: detectTransactionType(
                            {
                                from: receipt.from,
                                to: receipt.to,
                                value: BigInt(0),
                                data: "0x",
                            } as ethers.TransactionResponse,
                            receipt
                        ),
                        gasUsed: gasUsed,
                        gasPrice: gasPrice,
                        txFee: txFee,
                        inputData: "0x"
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
            <p className="font-semibold">
                Latest Block: <span className="font-mono">{latestBlock !== null ? latestBlock : 'Loading...'}</span>
            </p>
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
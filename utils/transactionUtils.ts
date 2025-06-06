import { ethers } from 'ethers';
import { TxType } from '../types/transaction';
import { MonadReceipt } from '../types/transaction';
export function detectTransactionType(tx: ethers.TransactionResponse, receipt?: MonadReceipt): TxType {
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
      '0x38ed1739', '0x7ff36ab5', '0x18cbafe5', '0x8803dbee', '0x02751cec',
      '0x791ac947', '0xb6f9de95', '0x5c11d795', '0x128acb08', '0xfb3bdb41',
    ];

    // Common mint signatures
    const mintSignatures = [
      '0x40c10f19', '0xa0712d68', '0x1249c58b',
    ];

    // Common burn signatures  
    const burnSignatures = [
      '0x42966c68', '0x9dc29fac', '0x8d1247ba',
    ];

    if (swapSignatures.includes(methodId)) return 'swap';
    if (mintSignatures.includes(methodId)) return 'mint';
    if (burnSignatures.includes(methodId)) return 'burn';
  }

  // High gas usage might indicate complex contract interaction
  if (gasUsed > BigInt(100000)) return 'contract';

  // Has data but doesn't match known patterns
  if (data && data !== '0x' && data.length > 2) return 'contract';

  return 'unknown';
}

export function getTxTypeDisplay(type: TxType): { emoji: string; color: string; label: string } {
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

export const formatTxFee = (fee: string) => {
  const num = parseFloat(fee);
  if (num === 0) return '0';
  if (num < 0.000001) return '<0.000001';
  if (num < 0.001) return num.toFixed(6);
  return num.toFixed(4);
};

export const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

export const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatValue = (value: string) => {
  const num = parseFloat(value);
  if (num === 0) return '0';
  if (num < 0.001) return '<0.001';
  return num.toFixed(4);
};

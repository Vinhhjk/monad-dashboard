export type TxType = 'transfer' | 'swap' | 'burn' | 'mint' | 'contract' | 'unknown';

export interface TxInfo {
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
  input?: string;
  gas?: string;
}


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
  inputData?: string;
}

export type MonadReceipt = {
  transactionHash: string;
  from: string;
  to: string | null;
  gasUsed?:  | number;
  effectiveGasPrice?: string | number;
  blockNumber: string | number;
  // add other fields as needed
};
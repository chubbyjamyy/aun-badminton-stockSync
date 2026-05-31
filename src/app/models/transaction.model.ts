export type TransactionType = 'in' | 'out';

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  type: TransactionType;
  quantity: number;
  note: string;
  date: string;
  stockBefore: number;
  stockAfter: number;
  purchaseCost?: number;
  costBefore?: number;
  costAfter?: number;
  sellPrice?: number;
}

export interface LiquidityPool {
  _id: number;
  tokenPair: string;
  baseQuantity: string;
  baseVolume: string;
  basePrice: string;
  quoteQuantity: string;
  quoteVolume: string;
  quotePrice: string;
  totalShares: string;
  precision: string;
  creator: string;
}

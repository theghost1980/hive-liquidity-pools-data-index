import axios from "axios";
import { Logger } from "./logger.utils";
import { RpcNodeUtils } from "./rpc-node-utils";

/**
 * Fetches the price for a list of token symbols from the 'market.metrics' table.
 * It assumes that 'lastPrice' in 'market.metrics' for a given 'symbol'
 * represents the price of that 'symbol' in SWAP.HIVE.
 * @param symbols Array of token symbols to get prices for.
 * @returns A Promise resolving to an array of objects, each containing the symbol and its lastPrice.
 *          Returns null if no prices could be fetched or an error occurs globally.
 *          Individual token fetch errors result in that token not being included or having lastPrice as null.
 */
const getTokenPriceList = async (
  symbols: string[]
): Promise<Array<{
  symbol: string;
  lastPrice: string | null;
  [key: string]: any;
}> | null> => {
  const results: Array<{
    symbol: string;
    lastPrice: string | null;
    [key: string]: any;
  }> = [];
  for (const symbol of symbols) {
    if (symbol === "SWAP.HIVE") {
      results.push({ symbol: "SWAP.HIVE", lastPrice: "1" }); // Price of SWAP.HIVE in SWAP.HIVE is 1
      continue;
    }
    try {
      const response = await axios.post(
        `${RpcNodeUtils.FASTESTRPCNODE.url}/contracts`,
        {
          jsonrpc: "2.0",
          method: "findOne", // Use findOne to get metrics for a specific symbol
          params: {
            contract: "market",
            table: "metrics",
            query: { symbol: symbol }, // Query for the specific symbol's metrics
          },
          limit: 2,
          id: 1,
        }
      );
      if (
        response.status === 200 &&
        response.data.result &&
        response.data.result.lastPrice
      ) {
        results.push(response.data.result); // The result object should contain symbol, lastPrice, etc.
      } else {
        Logger.warn(
          `Could not fetch valid price metric for ${symbol}. Status: ${
            response.status
          }, Result: ${JSON.stringify(response.data.result)}`
        );
        // Optionally add a placeholder or skip: results.push({ symbol: symbol, lastPrice: null });
      }
    } catch (error: any) {
      Logger.error(
        `Error fetching price metric for ${symbol}: ${error.message}`
      );
      // Optionally add a placeholder or skip: results.push({ symbol: symbol, lastPrice: null });
    }
  }
  return results.length > 0 ? results : null;
};

const getHivePrice = async () => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd&include_24hr_change=true"
    );
    if (response.status === 200) {
      return response.data;
    }
    return null;
  } catch (error: any) {
    Logger.error(`Error fetch hive price ${error.message}`);
    return null;
  }
};

export const PriceUtils = {
  getTokenPriceList,
  getHivePrice,
};

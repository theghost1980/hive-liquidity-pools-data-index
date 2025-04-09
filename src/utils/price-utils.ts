import axios from "axios";
import { Logger } from "./logger.utils";
import { RpcNodeUtils } from "./rpc-node-utils";

const getTokenPriceList = async (symbols: string[]) => {
  try {
    const response = await axios.post(
      `${RpcNodeUtils.FASTESTRPCNODE.url}/contracts`,
      {
        jsonrpc: "2.0",
        method: "find",
        params: {
          contract: "market",
          table: "metrics",
          query: {
            symbol: {
              $in: symbols,
            },
          },
          limit: 2,
        },
        id: 1,
      }
    );
    if (response.status === 200) {
      return response.data.result;
    }
    return null;
  } catch (error: any) {
    Logger.error(`Error fetch tokens info ${error.message}`);
    return null;
  }
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

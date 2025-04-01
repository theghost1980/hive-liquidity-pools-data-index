import axios from "axios";
import { config } from "../config/config";
import { LiquidityPool } from "../interfaces/liquidity-pool.interface";

const fetchPoolData = async (): Promise<LiquidityPool[] | null> => {
  const response = await axios.post<any>(config.apiEndpoint, {
    jsonrpc: "2.0",
    method: "find",
    params: {
      contract: "marketpools",
      table: "pools",
      query: {},
    },
    id: 1,
  });
  if (response.status === 200 && response.data.result) {
    console.log(`Liquidity Pools found: ${response.data.result.length}`);
    return response.data.result;
  }
  return null;
};

export const LiquidityPoolUtils = {
  fetchPoolData,
};

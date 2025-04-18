import axios from "axios";
import { LiquidityPool } from "../interfaces/liquidity-pool.interface";
import { Logger } from "./logger.utils";
import { FastestNode, RpcNodeUtils } from "./rpc-node-utils";

let LASTHERPCNODEWORKING = "";

const getLastHERPCNodeChecked = () => LASTHERPCNODEWORKING;

const fetchPoolData = async (): Promise<LiquidityPool[] | null> => {
  const fastestNodeChecked: FastestNode = await RpcNodeUtils.getFastestNode(
    "l2"
  );
  LASTHERPCNODEWORKING = fastestNodeChecked.node;
  Logger.info(
    `HERPC nodes tested, lastWorking: ${fastestNodeChecked.node}, speed: ${fastestNodeChecked.time}ms`
  );

  const response = await axios.post<any>(
    `${fastestNodeChecked.node}/contracts`,
    {
      jsonrpc: "2.0",
      method: "find",
      params: {
        contract: "marketpools",
        table: "pools",
        query: {},
      },
      id: 1,
    }
  );
  if (response.status === 200 && response.data.result) {
    Logger.info(`Liquidity Pools found: ${response.data.result.length}`);
    return response.data.result;
  }
  return null;
};

export const LiquidityPoolUtils = {
  fetchPoolData,
  getLastHERPCNodeChecked,
};

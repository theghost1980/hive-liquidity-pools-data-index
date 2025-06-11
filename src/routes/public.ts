import axios from "axios";
import { Request, Response, Router } from "express";
import { access, readdir, readFile } from "fs/promises";
import moment from "moment";
import path from "path";
import { MAINDATADIR } from "..";
import { FileUtils } from "../utils/file.utils";
import { JsonUtils } from "../utils/jsonUtils";
import { LiquidityPoolUtils } from "../utils/liquidity-pool.utils";
import { Logger } from "../utils/logger.utils";
import { PriceUtils } from "../utils/price-utils";
import {
  FastestNode,
  RpcNodeType,
  RpcNodeUtils,
} from "../utils/rpc-node-utils";

const publicRouter = Router();

publicRouter.get(
  "/available-data-pool-token-pair",
  async (req: Request, res: Response) => {
    try {
      const entries = await readdir(MAINDATADIR, { withFileTypes: true });
      const folderNames = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name.replace("_", ":")); // Filter out directories + replace _ by : to keep HIVE LP formats
      res.json({ tokenPairs: folderNames, totalPairs: folderNames.length }); // Send the list of folder names as the response
    } catch (error) {
      console.error("Error reading directories:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

publicRouter.get("/data-pool", async (req: any, res: any) => {
  const tokenPair = req.query.tokenPair as string | undefined;

  if (!tokenPair) {
    return res.status(400).send("No token pair specified.");
  }

  const tokenPairDir = path.join(
    MAINDATADIR,
    tokenPair.includes(":") ? tokenPair.replace(":", "_") : tokenPair
  );

  try {
    await access(tokenPairDir); // Check if the tokenPair directory exists
  } catch (error) {
    return res.status(404).send("Token pair directory not found.");
  }

  try {
    const files = await readdir(tokenPairDir);
    const jsonFiles = files.filter(
      (file) => path.extname(file).toLowerCase() === ".json"
    );

    if (jsonFiles.length === 0) {
      return res
        .status(404)
        .send("No JSON files found in the specified token pair directory.");
    }

    const jsonData = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(tokenPairDir, file);
        const data = await readFile(filePath, "utf8");
        const parsedData = JSON.parse(data);
        const snapshotTs = file.split("_")[1].split(".")[0];
        const snapshotISODate = moment(
          parseFloat(snapshotTs) * 1000
        ).toISOString();
        return { ...parsedData, snapshotTs, snapshotISODate };
      })
    );

    res.json(jsonData);
  } catch (error) {
    console.error("Error reading JSON files:", error);
    res.status(500).send("Internal Server Error");
  }
});

publicRouter.get("/pool-fees", async (req: any, res: any) => {
  const tokenPair = req.query.tokenPair as string | undefined;
  let feePercentageBaseToken = req.query.feePercentageBaseToken as
    | number
    | undefined;
  let feePercentageQuoteToken = req.query.feePercentageQuoteToken as
    | number
    | undefined;
  const timeFrameDaysStr = req.query.timeFrameDays as string | undefined;

  const response = await axios.post<any>(
    `${RpcNodeUtils.FASTESTRPCNODE.url}/contracts`,
    {
      jsonrpc: "2.0",
      method: "find",
      params: {
        contract: "marketpools",
        table: "pools",
        query: {
          tokenPair,
        },
        limit: 1,
      },
      id: 1,
    }
  );

  if (!tokenPair) {
    return res.status(400).send("No token pair specified.");
  }
  const tokenSymbols = tokenPair.split(":");

  let feeSourceMessage = "Fees provided by user.";
  if (!feePercentageBaseToken || !feePercentageQuoteToken) {
    Logger.info(
      "Fee percentages not provided by user, using default 0.125% for both."
    );
    feePercentageBaseToken = 0.125;
    feePercentageQuoteToken = 0.125;
    feeSourceMessage = "Default fees (0.125%) used as none were provided.";
  }

  const tokenPairDir = path.join(
    MAINDATADIR,
    tokenPair.includes(":") ? tokenPair.replace(":", "_") : tokenPair
  );

  try {
    await access(tokenPairDir); // Check if the tokenPair directory exists
  } catch (error) {
    return res.status(404).send("Token pair directory not found.");
  }

  try {
    const files = await readdir(tokenPairDir);
    const jsonFiles = files.filter(
      (file) => path.extname(file).toLowerCase() === ".json"
    );

    const allFilesWithTimestamps = jsonFiles
      .map((file) => {
        const match = file.match(/^ts_(\d+)\.json$/);
        if (match) {
          const timestamp = parseInt(match[1], 10);
          return { file, timestamp };
        }
        return null;
      })
      .filter(
        (item): item is { file: string; timestamp: number } => item !== null
      )
      .sort((a, b) => b.timestamp - a.timestamp); // Ordenar por timestamp descendente

    if (allFilesWithTimestamps.length === 0) {
      return res
        .status(404)
        .send("No historical snapshot data found for this token pair.");
    }

    let snapshotToCompareWithRpcData: any;
    let snapshotTimestamp: number;
    let effectiveTimeFrameMessage: string;

    let daysToUse = 1; // Default
    const maxDays = 7;

    if (timeFrameDaysStr) {
      const parsedDays = parseInt(timeFrameDaysStr, 10);
      if (isNaN(parsedDays) || parsedDays <= 0) {
        return res
          .status(400)
          .send("Invalid timeFrameDays parameter. Must be a positive integer.");
      }
      daysToUse = Math.min(parsedDays, maxDays);
    }

    let chosenSnapshotFileMeta: { file: string; timestamp: number } | null =
      null;

    if (daysToUse === 1) {
      chosenSnapshotFileMeta = allFilesWithTimestamps[0]; // Use the most recent snapshot
    } else {
      const targetPastTimestamp = moment().unix() - daysToUse * 24 * 60 * 60;
      for (const fileMeta of allFilesWithTimestamps) {
        if (fileMeta.timestamp <= targetPastTimestamp) {
          chosenSnapshotFileMeta = fileMeta; // This is the most recent snapshot that is old enough
          break;
        }
      }
      if (!chosenSnapshotFileMeta && allFilesWithTimestamps.length > 0) {
        chosenSnapshotFileMeta =
          allFilesWithTimestamps[allFilesWithTimestamps.length - 1]; // Fallback to oldest
        Logger.warn(
          `Could not find a snapshot for ${daysToUse} days ago for ${tokenPair}. Using the oldest available snapshot: ${chosenSnapshotFileMeta.file}`
        );
      }
    }

    if (!chosenSnapshotFileMeta) {
      Logger.error(
        `No snapshot could be chosen for ${tokenPair} with daysToUse: ${daysToUse}. This should not happen if allFilesWithTimestamps is not empty.`
      );
      return res
        .status(500)
        .send(
          "Internal error selecting snapshot data. No snapshots available or logic error."
        );
    }

    snapshotToCompareWithRpcData = JSON.parse(
      await readFile(
        path.join(tokenPairDir, chosenSnapshotFileMeta.file),
        "utf-8"
      )
    );
    snapshotTimestamp = chosenSnapshotFileMeta.timestamp;

    const actualSecondsDifference = moment().unix() - snapshotTimestamp;
    effectiveTimeFrameMessage = `Fees since ${moment
      .unix(snapshotTimestamp)
      .format("YYYY-MM-DD HH:mm:ss")} (approx. ${moment
      .duration(actualSecondsDifference, "seconds")
      .humanize()} ago). Target period: ${daysToUse} day(s).`;

    const hivePriceData = await PriceUtils.getHivePrice();
    if (!hivePriceData?.hive?.usd) {
      Logger.error("Could not fetch HIVE price from CoinGecko.");
      return res.status(500).send("Error fetching HIVE price.");
    }
    const hivePriceInUsd = hivePriceData.hive.usd;

    const tokenPricesUsd: { [key: string]: number } = {};

    // Define tokens que tienen un método especial para obtener su precio en USD
    const specialPriceHandlers: {
      [symbol: string]: () => Promise<number> | number;
    } = {
      "SWAP.HIVE": () => hivePriceInUsd,
      "SWAP.HBD": () => 1.0, // Asumimos 1 USD para SWAP.HBD por ahora
      // Puedes añadir más tokens aquí, ej:
      // "SOME.TOKEN": async () => (await SomeApi.getPrice("SOME.TOKEN")).usd,
    };

    const tokensToFetchFromMarket: string[] = [];

    for (const symbol of tokenSymbols) {
      if (specialPriceHandlers[symbol]) {
        const priceOrPromise = specialPriceHandlers[symbol]();
        tokenPricesUsd[symbol] =
          typeof priceOrPromise === "number"
            ? priceOrPromise
            : await priceOrPromise;
      } else {
        tokensToFetchFromMarket.push(symbol);
      }
    }

    if (tokensToFetchFromMarket.length > 0) {
      const marketPriceList = await PriceUtils.getTokenPriceList(
        tokensToFetchFromMarket
      );
      if (marketPriceList) {
        for (const marketTokenData of marketPriceList) {
          // Asumimos que lastPrice es el precio del token en SWAP.HIVE
          if (marketTokenData.lastPrice) {
            // Check if lastPrice is not null
            tokenPricesUsd[marketTokenData.symbol] =
              parseFloat(marketTokenData.lastPrice) * hivePriceInUsd;
          } else {
            Logger.warn(
              `lastPrice for ${marketTokenData.symbol} is null. Cannot calculate USD price.`
            );
          }
        }
      }
    }

    // Validar que se obtuvieron los precios para ambos tokens
    if (
      tokenPricesUsd[tokenSymbols[0]] === undefined ||
      tokenPricesUsd[tokenSymbols[1]] === undefined
    ) {
      const missing = tokenSymbols.filter(
        (ts) => tokenPricesUsd[ts] === undefined
      );
      Logger.error(
        `Could not determine USD price for: ${missing.join(
          " and "
        )} in pair ${tokenPair}`
      );
      return res
        .status(500)
        .send(`Could not determine USD price for: ${missing.join(" and ")}.`);
    }

    // Calculate fees acording to user's fee input made on request
    const volumeDeltaBaseToken =
      parseFloat(response.data.result[0].baseVolume) -
      parseFloat(snapshotToCompareWithRpcData.baseVolume);
    const volumeDeltaQuoteToken =
      parseFloat(response.data.result[0].quoteVolume) -
      parseFloat(snapshotToCompareWithRpcData.quoteVolume);
    const totalFeesBaseToken =
      volumeDeltaBaseToken * (feePercentageBaseToken / 100);
    const totalFeesQuoteToken =
      volumeDeltaQuoteToken * (feePercentageQuoteToken / 100);
    const totalFeesBaseTokenUSD =
      totalFeesBaseToken * tokenPricesUsd[tokenSymbols[0]];
    const totalFeesQuoteTokenUSD =
      totalFeesQuoteToken * tokenPricesUsd[tokenSymbols[1]];
    const totalFeesUSD = totalFeesBaseTokenUSD + totalFeesQuoteTokenUSD;

    res.json({
      tokenPair,
      volumeDeltaBaseToken: `${volumeDeltaBaseToken} ${tokenSymbols[0]}`,
      volumeDeltaQuoteToken: `${volumeDeltaQuoteToken} ${tokenSymbols[1]}`,
      totalFeesBaseToken: `${totalFeesBaseToken} ${tokenSymbols[0]}`,
      totalFeesQuoteToken: `${totalFeesQuoteToken} ${tokenSymbols[1]}`,
      totalFeesBaseTokenUSD: totalFeesBaseTokenUSD.toFixed(5),
      totalFeesQuoteTokenUSD: totalFeesQuoteTokenUSD.toFixed(5),
      totalFeesPoolUSD: totalFeesUSD,
      feePercentageBaseTokenUsed: feePercentageBaseToken,
      feePercentageQuoteTokenUsed: feePercentageQuoteToken,
      feeSourceMessage: feeSourceMessage,
      baseTokenPrice: `${tokenPricesUsd[tokenSymbols[0]].toFixed(5)}$`,
      quoteTokenPrice: `${tokenPricesUsd[tokenSymbols[1]].toFixed(5)}$`,
      hivePriceGeckoUSD: `${hivePriceInUsd.toFixed(5)}$`,
      calculationPeriodMessage: effectiveTimeFrameMessage,
    });
  } catch (error: any) {
    console.error("Error reading JSON files:", error.message);
    Logger.error("Error /pool-fees", error.message);
    res.status(500).send("Internal Server Error");
  }
});

publicRouter.get("/fastest-hive-rpc-node", async (req: any, res: any) => {
  try {
    const mode = req.query.mode as RpcNodeType | undefined;
    if (!mode) {
      res
        .status(400)
        .send(
          'Must provide mode: "l1" | "l2"<br>"l1": accounts, hive db, etc.<br>"l2": Hive Engine, tokens, liquidity pools, etc.'
        );
    }
    const fastestNodeChecked: FastestNode = await RpcNodeUtils.getFastestNode(
      mode as RpcNodeType
    );
    res.status(200).send({
      typeNode: mode,
      note: mode === "l1" ? "Hive RPC" : "Hive Engine RPC",
      fastestNodeChecked,
    });
  } catch (error: any) {
    Logger.error("Error /fastest-hive-rpc-node", error.message);
    res.status(500).send("Internal Server Error");
  }
});

publicRouter.get("/status", async (req, res) => {
  let mainFolderSize: any;
  try {
    mainFolderSize = await FileUtils.getFolderSize(MAINDATADIR);
  } catch (error) {
    mainFolderSize = 0;
  } finally {
    const serverData = await JsonUtils.readJsonFile(
      "./public/server-data.json"
    );

    res.status(200).send({
      status: "OK",
      overall_index: "In Progress!",
      mainFolderSizeBytes: `${mainFolderSize} Bytes`,
      mainFolderSizeMB: `${(mainFolderSize / 1024 ** 2).toFixed(3)} MB`,
      mainFolderSizeGB: `${(mainFolderSize / 1024 ** 3).toFixed(3)} GB`,
      lastHERPCNodeTested: LiquidityPoolUtils.getLastHERPCNodeChecked(),
      ...serverData,
    });
  }
});

export default publicRouter;

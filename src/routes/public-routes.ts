import axios from "axios";
import { Request, Response, Router } from "express";
import { access, readdir, readFile } from "fs/promises";
import moment from "moment";
import path from "path";
import { RpcNodeUtils } from "../utils/rpc-node-utils";

const router = Router();

router.get(
  "/available-data-pool-token-pair",
  async (req: Request, res: Response) => {
    try {
      const projectRoot = path.join(__dirname, "..");
      const mainDir = path.join(projectRoot, "public", "data");
      const entries = await readdir(mainDir, { withFileTypes: true });
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

router.get("/data-pool", async (req: any, res: any) => {
  const tokenPair = req.query.tokenPair as string | undefined;

  if (!tokenPair) {
    return res.status(400).send("No token pair specified.");
  }

  const projectRoot = path.resolve(__dirname, "..");
  const tokenPairDir = path.join(
    projectRoot,
    "public",
    "data",
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

router.get("/pool-fees", async (req: any, res: any) => {
  const tokenPair = req.query.tokenPair as string | undefined;
  const timeFrame = req.query.timeFrame as string | undefined;

  //TODO check in engine chat:
  //  - what is the server time when saves the trading data daily? GMT-0?
  //  - see if the tribaldex match what you have when:
  //    -> you use the last file.json and use as current the real time ask

  //TODO REM testing to get data realtime to check
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
  //UNTIL HERE

  if (!tokenPair) {
    return res.status(400).send("No token pair specified.");
  }
  //unless specified, returns pool-fees last 24h
  const projectRoot = path.resolve(__dirname, "..");
  const tokenPairDir = path.join(
    projectRoot,
    "public",
    "data",
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

    const recentFiles = jsonFiles
      .map((file) => {
        // Extraemos el timestamp del nombre del archivo, que tiene la forma ts_[timestamp].json
        const match = file.match(/^ts_(\d+)\.json$/);
        if (match) {
          const timestamp = parseInt(match[1], 10); // Convertir el timestamp a número
          return { file, timestamp };
        }
        return null;
      })
      .filter(
        (item): item is { file: string; timestamp: number } => item !== null
      )
      .sort((a, b) => b.timestamp - a.timestamp) // Ordenar por timestamp descendente
      .slice(0, 2); // Tomar los dos primeros (más recientes)

    // Leer contenido de los archivos seleccionados
    const jsonData = await Promise.all(
      recentFiles.map(async ({ file }) => {
        const filePath = path.join(tokenPairDir, file);
        const content = await readFile(filePath, "utf-8");
        return JSON.parse(content);
      })
    );

    // Calculate fees (0.2% of trading volume)
    const volumeDelta =
      parseFloat(jsonData[0].baseVolume) - parseFloat(jsonData[1].baseVolume);
    const totalFees = volumeDelta * 0.002;

    //TODO check alternative calculations
    //Note: volumeDelta2 is correct but fee is not.
    //  -> keep checking other values
    const volumeDelta2 =
      parseFloat(response.data.result[0].baseVolume) -
      parseFloat(jsonData[0].baseVolume);
    const totalFees2 = volumeDelta2 * 0.002;

    res.json({
      tokenPair,
      volumeDelta,
      timeFrameAsTs: `${moment
        .unix(recentFiles[0].timestamp)
        .format("YYYY-MM-DD")} / ${moment
        .unix(recentFiles[1].timestamp)
        .format("YYYY-MM-DD")}`,
      totalFees,
      resCurrent: response.data.result,
      volumeDelta2,
      totalFees2,
    });
  } catch (error) {
    console.error("Error reading JSON files:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;

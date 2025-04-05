import dotenv from "dotenv";
import express from "express";
import path from "path";
import { initScripts } from "./init-scripts/init";
import publicRoutes from "./routes/public-routes";
import { FileUtils } from "./utils/file.utils";
import { LiquidityPoolUtils } from "./utils/liquidity-pool.utils";
import { Logger } from "./utils/logger.utils";

const serveIndex = require("serve-index");

export const SERVERCOUNTSTATUS = {
  daysCounted: 0,
};

dotenv.config();

//TODO important
// Ok, well so far I will change to 24 h to keep testing and
//  - open an Endpoint to get data as the user wants, for example ask for a pair and get all data, etc.
//  - Also an Endpoint to get the user earnings of a token pair.

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public"))); // Serve static files from the 'public' directory
app.use(
  "/data",
  serveIndex(path.join(__dirname, "public", "data"), { icons: true })
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use("/public", publicRoutes);

app.use(express.json());

const initialize = () => {
  Logger.info("Init Scripts!!");
  initScripts();
};

app.get("/status", async (req, res) => {
  const mainDir = path.join(__dirname, "public", "data");
  let mainFolderSize: any;
  try {
    mainFolderSize = await FileUtils.getFolderSize(mainDir);
  } catch (error) {
    mainFolderSize = 0;
  } finally {
    res.send({
      status: "OK",
      overall_index: "In Progress!",
      mainFolderSizeBytes: `${mainFolderSize} Bytes`,
      mainFolderSizeMB: `${(mainFolderSize / 1024 ** 2).toFixed(3)} MB`,
      mainFolderSizeGB: `${(mainFolderSize / 1024 ** 3).toFixed(3)} GB`,
      lastHERPCNodeTested: LiquidityPoolUtils.getLastHERPCNodeChecked(),
      count: SERVERCOUNTSTATUS.daysCounted.toString(),
    });
  }
});

app.listen(port, () => {
  initialize();
  Logger.info(`Server is running at PORT:${port}`);
});

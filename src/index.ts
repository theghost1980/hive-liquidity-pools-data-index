import dotenv from "dotenv";
import express from "express";
import moment from "moment";
import path from "path";
import { initScripts } from "./init-scripts/init";
import router from "./routes/public";
import swaggerDocs from "./swagger/swagger";
import { JsonUtils } from "./utils/jsonUtils";
import { Logger } from "./utils/logger.utils";

//TODO cleanup
//TODO create a .sh script to automate the process to clear/copy/ check and serve(using pm2) in the VPS.

const serveIndex = require("serve-index");

dotenv.config();

//TODO important
//  - check results running each 24h
//  - code the function to calculate 24h earning fees per user
//  - somehow get the top 10 positions of each pools
//    -> can open a route to get those 10 positions by pool + fees earned!
//  - Also an Endpoint to get the user earnings of a token pair.

const app = express();
const port = (process.env.PORT ? parseFloat(process.env.PORT) : 0) || 3000;

const publicDir = path.join(__dirname, "public");
const dataDir = path.join(publicDir, "data");

app.use("/data", express.static(dataDir), serveIndex(dataDir, { icons: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/index-es.html", (req, res) =>
  res.sendFile(path.join(__dirname, "index-es.html"))
);

const initialize = () => {
  try {
    JsonUtils.readJsonFile("/public/server-data.json").then((data: any) => {
      if (data) {
        if (data.genesis_up_date_ts === 0) {
          const newData = { ...data, genesis_up_date_ts: moment().unix() };
          JsonUtils.writeJsonFile("/public/server-data.json", newData);
          Logger.info("Initialize server data json!");
        }
      }
    });
  } catch (error: any) {
    Logger.error(
      `Error trying to write first date as genesis ${error.message}`
    );
  }
  Logger.info("Init Scripts!!");
  initScripts();

  // //TODO below move to a maintenance route + protection method
  // //Important while we test, we get the data from the main source which is the backend running in render.com

  // const sourceUrl = "https://hivelpindex.sytes.net/data/"; // Last server running getting snapshots.
  // const destDir = path.join(__dirname, "public", "data"); // Where you want to scan/copy the files to

  // // Call the main function with the source URL and destination directory
  // downloadFiles(sourceUrl, destDir)
  //   .then(() => {
  //     console.log("Download process completed!");
  //   })
  //   .catch((error) => {
  //     console.error("Error during download:", error);
  //   });
  // //end testing
};

// app.get("/status", async (req, res) => {
//   const mainDir = path.join(__dirname, "public", "data");
//   let mainFolderSize: any;
//   try {
//     mainFolderSize = await FileUtils.getFolderSize(mainDir);
//   } catch (error) {
//     mainFolderSize = 0;
//   } finally {
//     // const nextSnapshotDate = MainCronJob.getNextDate();
//     const serverData = await JsonUtils.readJsonFile("/public/server-data.json");

//     res.send({
//       status: "OK",
//       overall_index: "In Progress!",
//       mainFolderSizeBytes: `${mainFolderSize} Bytes`,
//       mainFolderSizeMB: `${(mainFolderSize / 1024 ** 2).toFixed(3)} MB`,
//       mainFolderSizeGB: `${(mainFolderSize / 1024 ** 3).toFixed(3)} GB`,
//       lastHERPCNodeTested: LiquidityPoolUtils.getLastHERPCNodeChecked(),
//       // count: `${ControlVarsUtils.SERVERCOUNT.daysCount.toString()} days`,
//       // nextSnapshotDate,
//       ...serverData,
//     });
//   }
// });

app.listen(port, () => {
  initialize();
  Logger.info(`Server is running at PORT:${port}`);
  app.use(router);
  swaggerDocs(app);
});

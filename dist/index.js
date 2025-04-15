"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const moment_1 = __importDefault(require("moment"));
const path_1 = __importDefault(require("path"));
const init_1 = require("./init-scripts/init");
const public_1 = __importDefault(require("./routes/public"));
const swagger_1 = __importDefault(require("./swagger/swagger"));
const jsonUtils_1 = require("./utils/jsonUtils");
const logger_utils_1 = require("./utils/logger.utils");
//TODO cleanup
const serveIndex = require("serve-index");
dotenv_1.default.config();
//TODO important
//  - check results running each 24h
//  - code the function to calculate 24h earning fees per user
//  - somehow get the top 10 positions of each pools
//    -> can open a route to get those 10 positions by pool + fees earned!
//  - Also an Endpoint to get the user earnings of a token pair.
const app = (0, express_1.default)();
const port = (process.env.PORT ? parseFloat(process.env.PORT) : 0) || 3000;
const publicDir = path_1.default.join(__dirname, "public");
const dataDir = path_1.default.join(publicDir, "data");
const favicon = require("serve-favicon");
app.use("/data", express_1.default.static(dataDir), serveIndex(dataDir, { icons: true }));
app.use(favicon(path_1.default.join(publicDir, "circle-logo-final.ico")));
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "index.html"));
});
app.get("/index-es.html", (req, res) => res.sendFile(path_1.default.join(__dirname, "index-es.html")));
// app.use("/public", publicRoutes);
const initialize = () => {
    try {
        jsonUtils_1.JsonUtils.readJsonFile("/public/server-data.json").then((data) => {
            if (data) {
                if (data.genesis_up_date_ts === 0) {
                    const newData = { ...data, genesis_up_date_ts: (0, moment_1.default)().unix() };
                    jsonUtils_1.JsonUtils.writeJsonFile("/public/server-data.json", newData);
                    logger_utils_1.Logger.info("Initialize server data json!");
                }
            }
        });
    }
    catch (error) {
        logger_utils_1.Logger.error(`Error trying to write first date as genesis ${error.message}`);
    }
    logger_utils_1.Logger.info("Init Scripts!!");
    (0, init_1.initScripts)();
    // //TODO below move to a maintenance route.
    // //Important while we test, we get the data from the main source which is the backend running in render.com
    //Below routine to get new data from the initial testing server.
    // const sourceUrl = "http://localhost:3000/data"; // Replace with your source URL
    // const sourceUrl =
    //   "https://hive-liquidity-pools-data-index.onrender.com/data/";
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
    logger_utils_1.Logger.info(`Server is running at PORT:${port}`);
    app.use(public_1.default);
    (0, swagger_1.default)(app);
});

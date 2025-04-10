"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const main_cron_job_1 = require("./cron/main-cron-job");
const init_1 = require("./init-scripts/init");
const public_routes_1 = __importDefault(require("./routes/public-routes"));
const control_vars_1 = require("./utils/control-vars");
const file_utils_1 = require("./utils/file.utils");
const jsonUtils_1 = require("./utils/jsonUtils");
const liquidity_pool_utils_1 = require("./utils/liquidity-pool.utils");
const logger_utils_1 = require("./utils/logger.utils");
const serveIndex = require("serve-index");
dotenv_1.default.config();
//TODO important
//  - check results running each 24h
//  - code the function to calculate 24h earning fees per user
//  - somehow get the top 10 positions of each pools
//    -> can open a route to get those 10 positions by pool + fees earned!
//  - Also an Endpoint to get the user earnings of a token pair.
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const publicDir = path_1.default.join(__dirname, "public");
const dataDir = path_1.default.join(publicDir, "data");
app.use("/data", express_1.default.static(dataDir), serveIndex(dataDir, { icons: true }));
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "index.html"));
});
app.use("/public", public_routes_1.default);
const initialize = () => {
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
app.get("/status", async (req, res) => {
    const mainDir = path_1.default.join(__dirname, "public", "data");
    let mainFolderSize;
    try {
        mainFolderSize = await file_utils_1.FileUtils.getFolderSize(mainDir);
    }
    catch (error) {
        mainFolderSize = 0;
    }
    finally {
        const nextSnapshotDate = main_cron_job_1.MainCronJob.getNextDate();
        const serverData = await jsonUtils_1.JsonUtils.readJsonFile("/public/server-data.json");
        res.send({
            status: "OK",
            overall_index: "In Progress!",
            mainFolderSizeBytes: `${mainFolderSize} Bytes`,
            mainFolderSizeMB: `${(mainFolderSize / 1024 ** 2).toFixed(3)} MB`,
            mainFolderSizeGB: `${(mainFolderSize / 1024 ** 3).toFixed(3)} GB`,
            lastHERPCNodeTested: liquidity_pool_utils_1.LiquidityPoolUtils.getLastHERPCNodeChecked(),
            count: `${control_vars_1.ControlVarsUtils.SERVERCOUNT.daysCount.toString()} days`,
            nextSnapshotDate,
            ...serverData,
        });
    }
});
app.listen(port, () => {
    initialize();
    logger_utils_1.Logger.info(`Server is running at PORT:${port}`);
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const init_1 = require("./init-scripts/init");
const file_utils_1 = require("./utils/file.utils");
const liquidity_pool_utils_1 = require("./utils/liquidity-pool.utils");
const logger_utils_1 = require("./utils/logger.utils");
const serveIndex = require("serve-index");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(express_1.default.static(path_1.default.join(__dirname, "public"))); // Serve static files from the 'public' directory
app.use("/data", serveIndex(path_1.default.join(__dirname, "public", "data"), { icons: true })); //// Serve directory listings for the 'downloads' folder
app.use(express_1.default.json());
const initialize = () => {
    logger_utils_1.Logger.info("Init Scripts!!");
    (0, init_1.initScripts)();
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
        res.send({
            status: "OK",
            overall_index: "In Progress!",
            mainFolderSizeBytes: `${mainFolderSize} Bytes`,
            mainFolderSizeMB: `${(mainFolderSize / 1024 ** 2).toFixed(3)} MB`,
            mainFolderSizeGB: `${(mainFolderSize / 1024 ** 3).toFixed(3)} GB`,
            lastHERPCNodeTested: liquidity_pool_utils_1.LiquidityPoolUtils.getLastHERPCNodeChecked(),
        });
    }
});
app.listen(port, () => {
    initialize();
    logger_utils_1.Logger.info(`Server is running at http://localhost:${port}`);
});

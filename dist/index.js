"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const init_1 = require("./init-scripts/init");
const liquidity_pool_utils_1 = require("./utils/liquidity-pool.utils");
const serveIndex = require("serve-index");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const publicDirectory = path_1.default.join(__dirname, "public");
app.use("/files", express_1.default.static(publicDirectory), serveIndex(publicDirectory, { icons: true }));
app.use(express_1.default.json());
const initialize = () => {
    console.log("Init Scripts!!");
    (0, init_1.initScripts)();
};
app.get("/", async (req, res) => {
    //testing fetching data
    const liquidityPoolsDataList = await liquidity_pool_utils_1.LiquidityPoolUtils.fetchPoolData();
    console.log({ liquidityPoolsDataList });
    res.send("Hello, TypeScript with Express!");
});
app.listen(port, () => {
    initialize();
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`24h Liquidity Pools Snapshots served at http://localhost:${port}/files`);
});

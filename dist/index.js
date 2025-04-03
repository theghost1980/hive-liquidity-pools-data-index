"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const init_1 = require("./init-scripts/init");
const serveIndex = require("serve-index");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(express_1.default.static(path_1.default.join(__dirname, "public"))); // Serve static files from the 'public' directory
app.use("/downloads", serveIndex(path_1.default.join(__dirname, "public", "downloads"), { icons: true })); //// Serve directory listings for the 'downloads' folder
app.use(express_1.default.json());
const initialize = () => {
    console.log("Init Scripts!!");
    (0, init_1.initScripts)();
};
// app.get("/", async (req: Request, res: Response) => {
//   //testing fetching data
//   const liquidityPoolsDataList = await LiquidityPoolUtils.fetchPoolData();
//   console.log({ liquidityPoolsDataList });
//   res.send("Hello, TypeScript with Express!");
// });
app.listen(port, () => {
    initialize();
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`24h Liquidity Pools Snapshots served at http://localhost:${port}/files`);
});

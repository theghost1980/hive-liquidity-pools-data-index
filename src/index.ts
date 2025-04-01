import dotenv from "dotenv";
import express, { Request, Response } from "express";
import path from "path";
import { initScripts } from "./init-scripts/init";
import { LiquidityPoolUtils } from "./utils/liquidity-pool.utils";
const serveIndex = require("serve-index");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, "public");

app.use(
  "/files",
  express.static(publicDirectory),
  serveIndex(publicDirectory, { icons: true })
);

app.use(express.json());

const initialize = () => {
  console.log("Init Scripts!!");
  initScripts();
};

app.get("/", async (req: Request, res: Response) => {
  //testing fetching data
  const liquidityPoolsDataList = await LiquidityPoolUtils.fetchPoolData();
  console.log({ liquidityPoolsDataList });
  res.send("Hello, TypeScript with Express!");
});

app.listen(port, () => {
  initialize();
  console.log(`Server is running at http://localhost:${port}`);
  console.log(
    `24h Liquidity Pools Snapshots served at http://localhost:${port}/files`
  );
});

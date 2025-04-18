import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import moment from "moment";
import path from "path";
import { initScripts } from "./init-scripts/init";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import publicRouter from "./routes/public";
import swaggerDocs from "./swagger/swagger";
import { JsonUtils } from "./utils/jsonUtils";
import { Logger } from "./utils/logger.utils";

const serveIndex = require("serve-index");

dotenv.config();

const app = express();
const port = (process.env.PORT ? parseFloat(process.env.PORT) : 0) || 3000;

export const MAINDATADIR = path.join(__dirname, "../data");

app.use(cors());

app.use(
  "/data",
  express.static(MAINDATADIR),
  serveIndex(MAINDATADIR, { icons: true })
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/index-es.html", (req, res) =>
  res.sendFile(path.join(__dirname, "index-es.html"))
);

app.use(express.json());
app.use("/auth", authRouter);
app.use("/public", publicRouter);
app.use("/admin", adminRouter);

swaggerDocs(app);

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
};

app.listen(port, () => {
  initialize();
  Logger.info(`Server is running at PORT:${port}`);
});

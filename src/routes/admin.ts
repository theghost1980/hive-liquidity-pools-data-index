import { Router } from "express";
import { MAINDATADIR } from "..";
import { requireAdmin } from "../middleware/authMiddleware";
import { Logger } from "../utils/logger.utils";
import downloadFiles, { downloadStatus } from "../utils/snapshot";

const adminRouter = Router();

adminRouter.post("/run-download", requireAdmin, async (req, res) => {
  try {
    const sourceUrl = "https://hivelpindex.sytes.net/data/";
    Logger.info(
      `Iniciando descarga por comando remoto admin. Dest: ${MAINDATADIR}`
    );
    const results = await downloadFiles(sourceUrl, MAINDATADIR);
    Logger.info(`Remote Download successful`, JSON.stringify(results));

    return res.status(200).json({
      success: true,
      message: "Descarga completada exitosamente.",
      results,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error ejecutando la descarga",
    });
  }
});

adminRouter.get("/download-status", requireAdmin, (req, res) => {
  res.json(downloadStatus);
});

export default adminRouter;

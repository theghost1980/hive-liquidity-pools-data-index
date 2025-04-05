import { Request, Response, Router } from "express";
import { access, readdir, readFile } from "fs/promises";
import moment from "moment";
import path from "path";

const router = Router();

router.get(
  "/available-data-pool-token-pair",
  async (req: Request, res: Response) => {
    try {
      const projectRoot = path.join(__dirname, "..");
      const mainDir = path.join(projectRoot, "public", "data");
      const entries = await readdir(mainDir, { withFileTypes: true });
      const folderNames = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name.replace("_", ":")); // Filter out directories + replace _ by : to keep HIVE LP formats
      res.json({ tokenPairs: folderNames, totalPairs: folderNames.length }); // Send the list of folder names as the response
    } catch (error) {
      console.error("Error reading directories:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.get("/data-pool", async (req: any, res: any) => {
  const tokenPair = req.query.tokenPair as string | undefined;

  if (!tokenPair) {
    return res.status(400).send("No token pair specified.");
  }

  const projectRoot = path.resolve(__dirname, "..");
  const tokenPairDir = path.join(
    projectRoot,
    "public",
    "data",
    tokenPair.includes(":") ? tokenPair.replace(":", "_") : tokenPair
  );

  try {
    await access(tokenPairDir); // Check if the tokenPair directory exists
  } catch (error) {
    return res.status(404).send("Token pair directory not found.");
  }

  try {
    const files = await readdir(tokenPairDir);
    const jsonFiles = files.filter(
      (file) => path.extname(file).toLowerCase() === ".json"
    );

    if (jsonFiles.length === 0) {
      return res
        .status(404)
        .send("No JSON files found in the specified token pair directory.");
    }

    const jsonData = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(tokenPairDir, file);
        const data = await readFile(filePath, "utf8");
        const parsedData = JSON.parse(data);
        const snapshotTs = file.split("_")[1].split(".")[0];
        const snapshotISODate = moment(
          parseFloat(snapshotTs) * 1000
        ).toISOString();
        return { ...parsedData, snapshotTs, snapshotISODate };
      })
    );

    res.json(jsonData);
  } catch (error) {
    console.error("Error reading JSON files:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;

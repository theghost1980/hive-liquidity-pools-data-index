import axios from "axios";
import fs from "fs";
import path from "path";
import { JsonUtils } from "./jsonUtils";
import { Logger } from "./logger.utils";

const fetchFilesFromServer = async (url: string) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching data from server:", error);
    throw error;
  }
};

const downloadFile = async (fileUrl: string, destPath: string) => {
  try {
    const response = await axios.get(fileUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);
    return new Promise<void>((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Error downloading ${fileUrl}`, error);
    throw error;
  }
};

const downloadFiles = async (sourceUrl: string, destDir: string) => {
  let skippedFiles = 0;
  let downloadedFiles = 0;
  let skippedFolders = 0;
  const newIndices: string[] = [];

  try {
    const folderNames = await fetchFilesFromServer(sourceUrl);

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const existingFolders = fs
      .readdirSync(destDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((dir) => dir.name);

    for (const folder of folderNames) {
      const folderUrl = `${sourceUrl}/${folder}`;
      const folderPath = path.join(destDir, folder);

      const isNewIndex = !existingFolders.includes(folder);
      if (isNewIndex) {
        newIndices.push(folder);
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const folderContent = await fetchFilesFromServer(folderUrl);
      let folderHadNewFiles = false;

      for (const file of folderContent) {
        if (file.endsWith(".json")) {
          const fileUrl = `${folderUrl}/${file}`;
          const destFilePath = path.join(folderPath, file);

          if (fs.existsSync(destFilePath)) {
            console.log(
              `⏭️ Skipped file ${file} as present in folder ${folder}`
            );
            skippedFiles++;
          } else {
            await downloadFile(fileUrl, destFilePath);
            console.log(`✅ Downloaded ${file} to ${folder}`);
            downloadedFiles++;
            folderHadNewFiles = true;
          }
        }
      }

      if (!folderHadNewFiles && !isNewIndex) {
        skippedFolders++;
      }
    }

    Logger.info("\n✅ Download completed successfully!");
    Logger.info(`📁 Skipped folders (no new files): ${skippedFolders}`);
    Logger.info(`📄 Skipped files: ${skippedFiles}`);
    Logger.info(`⬇️ Downloaded files: ${downloadedFiles}`);
    if (newIndices.length > 0) {
      //TODO later on find a way to add show, maybe from logs or another files.
      Logger.info(`🆕 New indices detected: ${newIndices.join(", ")}`);
    }

    if (downloadedFiles > 0) {
      JsonUtils.readJsonFile("./public/server-data.json")
        .then((v) => {
          if (v && v.snapshots_24h_days_taken) {
            let count = v.snapshots_24h_days_taken;
            count++;
            JsonUtils.writeJsonFile(`./public/server-data.json`, {
              ...v,
              snapshots_24h_days_taken: count,
            });
          }
        })
        .catch((e) =>
          Logger.error(`Error reading Json file server data! ${e.message}`)
        );
    }
  } catch (error) {
    Logger.error("❌ Error during file download:", error);
  }
};

export default downloadFiles;

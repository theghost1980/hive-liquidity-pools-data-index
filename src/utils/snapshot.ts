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

  try {
    const folderNames = await fetchFilesFromServer(sourceUrl);

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    for (const folder of folderNames) {
      const folderUrl = `${sourceUrl}/${folder}`;
      const folderPath = path.join(destDir, folder);

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
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

      if (!folderHadNewFiles) {
        skippedFolders++;
      }
    }

    Logger.info("\n✅ Download completed successfully!");
    Logger.info(`📁 Skipped folders (no new files): ${skippedFolders}`);
    Logger.info(`📄 Skipped files: ${skippedFiles}`);
    Logger.info(`⬇️ Downloaded files: ${downloadedFiles}`);
    if (downloadedFiles > 0) {
      JsonUtils.readJsonFile("./public/server-data.json") //inc day count
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

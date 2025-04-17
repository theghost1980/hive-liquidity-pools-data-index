import axios from "axios";
import fs from "fs";
import path from "path";
import { DownloadStatus } from "../interfaces/snapshots";
import { Logger } from "./logger.utils";

export const downloadStatus: DownloadStatus = {
  state: "idle",
};

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

  downloadStatus.state = "in_progress";
  downloadStatus.startedAt = new Date().toISOString();
  downloadStatus.lastFolderChecked = undefined;
  downloadStatus.lastFileDownloaded = undefined;
  downloadStatus.error = undefined;
  downloadStatus.results = undefined;

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
      downloadStatus.lastFolderChecked = folder;

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

            downloadStatus.lastFileDownloaded = file;
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
      Logger.info(`🆕 New indices detected: ${newIndices.join(", ")}`);
    }

    downloadStatus.state = "completed";
    downloadStatus.finishedAt = new Date().toISOString();

    const results = {
      result: "Download completed successfully!",
      skippedFolders,
      skippedFiles,
      downloadedFiles,
      newIndices,
      downloadStatus,
    };

    return results;
  } catch (error: any) {
    Logger.error("❌ Error during file download:", error);
    downloadStatus.state = "failed";
    downloadStatus.finishedAt = new Date().toISOString();
    downloadStatus.error = error.message;
  }
};

export default downloadFiles;

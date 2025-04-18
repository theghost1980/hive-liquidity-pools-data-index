import fastFolderSize from "fast-folder-size";
import fs from "fs";
import path from "path";
import { MAINDATADIR } from "..";
import { Logger } from "./logger.utils";

function ensureDataDirectoryExists(subDirName: string, showLog?: boolean) {
  const subDir = path.join(MAINDATADIR, subDirName);

  try {
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
      if (showLog)
        Logger.info(`Directories created successfully at: ${subDir}`);
    }
  } catch (err: any) {
    Logger.error(`Error creating directories: ${err.message}`);
  }
}

function writeDataToFile(
  fileName: string,
  subDir: string,
  data: any,
  showLog?: boolean
) {
  const fixedSubDirName = subDir.replace(":", "_"); // Ensure the sub folder's name do not contains ":"
  ensureDataDirectoryExists(fixedSubDirName);

  const dirPath = path.join(MAINDATADIR, fixedSubDirName);
  const filePath = path.join(dirPath, fileName);

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), {
      encoding: "utf8",
    });
    if (showLog) Logger.info(`Data written to ${filePath}`);
  } catch (error) {
    Logger.error("Error writing file:", error); //TODO somehow emit an alert to email
  }
}

const getFolderSize = (mainDir: string) => {
  return new Promise((resolve, reject) => {
    fastFolderSize(mainDir, (err, bytes) => {
      if (err) {
        reject(err);
      } else {
        resolve(bytes);
      }
    });
  });
};

export const FileUtils = {
  ensureDataDirectoryExists,
  writeDataToFile,
  getFolderSize,
};

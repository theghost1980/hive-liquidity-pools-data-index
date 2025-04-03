import fastFolderSize from "fast-folder-size";
import fs from "fs";
import path from "path";
import { Logger } from "./logger.utils";

// Function to ensure the data_tracker directory exists
function ensureDataDirectoryExists(subDirName: string, showLog?: boolean) {
  const projectRoot = path.join(__dirname, ".."); // Navigate up two levels from the current file to reach the project root
  const mainDir = path.join(projectRoot, "public", "data");
  const subDir = path.join(mainDir, subDirName);

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

// Function to write data to a file within the data_tracker directory
function writeDataToFile(
  fileName: string,
  subDir: string,
  data: any,
  showLog?: boolean
) {
  const fixedSubDirName = subDir.replace(":", "_"); // Ensure the sub folder's name do not contains ":"
  ensureDataDirectoryExists(fixedSubDirName); // Ensure the directory exists

  const projectRoot = path.join(__dirname, "..");
  const mainDir = path.join(projectRoot, "public", "data");
  const dirPath = path.join(mainDir, fixedSubDirName);
  const filePath = path.join(dirPath, fileName);

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), {
      encoding: "utf8",
    });
    //TODO add a log file result: success_written_data
    if (showLog) Logger.info(`Data written to ${filePath}`);
  } catch (error) {
    //TODO add a log file result: error_saving_data and somehow emit an alert to email
    Logger.error("Error writing file:", error);
  }
}

// Function to read data from a file within the data_tracker directory
// function readDataFromFile(
//   fileName: string,
//   enc: BufferEncoding
// ): string | null {
//   ensureDataDirectoryExists(); // Ensure the directory exists
//   const filePath = path.join(dataDir, fileName);
//   try {
//     const data = fs.readFileSync(filePath, { encoding: enc });
//     console.log(`Data read from ${filePath}`);
//     return data;
//   } catch (error) {
//     console.error("Error reading file:", error);
//     return null;
//   }
// }

// function renameFile(oldFileName: string, newFileName: string): void {
//   ensureDataDirectoryExists(); // Ensure the directory exists
//   const oldFilePath = path.join(dataDir, oldFileName);
//   const newFilePath = path.join(dataDir, newFileName);

//   try {
//     fs.renameSync(oldFilePath, newFilePath);
//     console.log(`Renamed ${oldFileName} to ${newFileName}`);
//   } catch (error) {
//     console.error(
//       `Error renaming file ${oldFileName} to ${newFileName}:`,
//       error
//     );
//   }
// }

// const getFolderSize = () => {
//   const projectRoot = path.join(__dirname, ".."); // Navigate up two levels from the current file to reach the project root
//   const mainDir = path.join(projectRoot, "public", "data");
//   let size: { bytes: number; err: any } = {
//     bytes: 0,
//     err: "",
//   };
//   fastFolderSize(mainDir, (err, bytes) => {
//     if (err) {
//       size.bytes = 0;
//       size.err = err;
//     }
//     console.log({ bytes }); //TODO REM
//     size.bytes = bytes!;
//     size.err = err;
//   });
//   return size;
// };

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
  //   readDataFromFile,
  //   renameFile,
};

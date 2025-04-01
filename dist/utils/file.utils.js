"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUtils = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Function to ensure the data_tracker directory exists
function ensureDataDirectoryExists(subDirName) {
    const mainDir = path_1.default.join(__dirname, "data");
    const subDir = path_1.default.join(mainDir, subDirName);
    try {
        if (!fs_1.default.existsSync(subDir)) {
            fs_1.default.mkdirSync(subDir, { recursive: true });
            console.log(`Directories created successfully at: ${subDir}`);
        }
    }
    catch (err) {
        console.error(`Error creating directories: ${err.message}`);
    }
}
// Function to write data to a file within the data_tracker directory
function writeDataToFile(fileName, subDir, data) {
    const fixedSubDirName = subDir.replace(":", "_"); // Ensure the sub folder's name do not contains ":"
    ensureDataDirectoryExists(fixedSubDirName); // Ensure the directory exists
    const dirPath = path_1.default.join(__dirname, "data", fixedSubDirName);
    const filePath = path_1.default.join(dirPath, fileName);
    console.log("About to save into ", { fixedSubDirName, filePath, fileName });
    try {
        fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2), {
            encoding: "utf8",
        });
        console.log(`Data written to ${filePath}`);
    }
    catch (error) {
        console.error("Error writing file:", error);
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
exports.FileUtils = {
    ensureDataDirectoryExists,
    writeDataToFile,
    //   readDataFromFile,
    //   renameFile,
};

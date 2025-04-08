"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUtils = void 0;
const fast_folder_size_1 = __importDefault(require("fast-folder-size"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_utils_1 = require("./logger.utils");
function ensureDataDirectoryExists(subDirName, showLog) {
    const projectRoot = path_1.default.join(__dirname, ".."); // Navigate up two levels from the current file to reach the project root
    const mainDir = path_1.default.join(projectRoot, "public", "data");
    const subDir = path_1.default.join(mainDir, subDirName);
    try {
        if (!fs_1.default.existsSync(subDir)) {
            fs_1.default.mkdirSync(subDir, { recursive: true });
            if (showLog)
                logger_utils_1.Logger.info(`Directories created successfully at: ${subDir}`);
        }
    }
    catch (err) {
        logger_utils_1.Logger.error(`Error creating directories: ${err.message}`);
    }
}
function writeDataToFile(fileName, subDir, data, showLog) {
    const fixedSubDirName = subDir.replace(":", "_"); // Ensure the sub folder's name do not contains ":"
    ensureDataDirectoryExists(fixedSubDirName); // Ensure the directory exists
    const projectRoot = path_1.default.join(__dirname, "..");
    const mainDir = path_1.default.join(projectRoot, "public", "data");
    const dirPath = path_1.default.join(mainDir, fixedSubDirName);
    const filePath = path_1.default.join(dirPath, fileName);
    try {
        fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2), {
            encoding: "utf8",
        });
        if (showLog)
            logger_utils_1.Logger.info(`Data written to ${filePath}`);
    }
    catch (error) {
        logger_utils_1.Logger.error("Error writing file:", error); //TODO somehow emit an alert to email
    }
}
const getFolderSize = (mainDir) => {
    return new Promise((resolve, reject) => {
        (0, fast_folder_size_1.default)(mainDir, (err, bytes) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(bytes);
            }
        });
    });
};
exports.FileUtils = {
    ensureDataDirectoryExists,
    writeDataToFile,
    getFolderSize,
};

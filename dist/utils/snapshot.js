"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadStatus = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_utils_1 = require("./logger.utils");
exports.downloadStatus = {
    state: "idle",
};
const fetchFilesFromServer = async (url) => {
    try {
        const response = await axios_1.default.get(url);
        return response.data;
    }
    catch (error) {
        console.error("Error fetching data from server:", error);
        throw error;
    }
};
const downloadFile = async (fileUrl, destPath) => {
    try {
        const response = await axios_1.default.get(fileUrl, { responseType: "stream" });
        const writer = fs_1.default.createWriteStream(destPath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
    }
    catch (error) {
        console.error(`Error downloading ${fileUrl}`, error);
        throw error;
    }
};
const downloadFiles = async (sourceUrl, destDir) => {
    let skippedFiles = 0;
    let downloadedFiles = 0;
    let skippedFolders = 0;
    const newIndices = [];
    exports.downloadStatus.state = "in_progress";
    exports.downloadStatus.startedAt = new Date().toISOString();
    exports.downloadStatus.lastFolderChecked = undefined;
    exports.downloadStatus.lastFileDownloaded = undefined;
    exports.downloadStatus.error = undefined;
    exports.downloadStatus.results = undefined;
    try {
        const folderNames = await fetchFilesFromServer(sourceUrl);
        if (!fs_1.default.existsSync(destDir)) {
            fs_1.default.mkdirSync(destDir, { recursive: true });
        }
        const existingFolders = fs_1.default
            .readdirSync(destDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((dir) => dir.name);
        for (const folder of folderNames) {
            exports.downloadStatus.lastFolderChecked = folder;
            const folderUrl = `${sourceUrl}/${folder}`;
            const folderPath = path_1.default.join(destDir, folder);
            const isNewIndex = !existingFolders.includes(folder);
            if (isNewIndex) {
                newIndices.push(folder);
                fs_1.default.mkdirSync(folderPath, { recursive: true });
            }
            const folderContent = await fetchFilesFromServer(folderUrl);
            let folderHadNewFiles = false;
            for (const file of folderContent) {
                if (file.endsWith(".json")) {
                    const fileUrl = `${folderUrl}/${file}`;
                    const destFilePath = path_1.default.join(folderPath, file);
                    if (fs_1.default.existsSync(destFilePath)) {
                        console.log(`⏭️ Skipped file ${file} as present in folder ${folder}`);
                        skippedFiles++;
                    }
                    else {
                        await downloadFile(fileUrl, destFilePath);
                        console.log(`✅ Downloaded ${file} to ${folder}`);
                        downloadedFiles++;
                        folderHadNewFiles = true;
                        exports.downloadStatus.lastFileDownloaded = file;
                    }
                }
            }
            if (!folderHadNewFiles && !isNewIndex) {
                skippedFolders++;
            }
        }
        logger_utils_1.Logger.info("\n✅ Download completed successfully!");
        logger_utils_1.Logger.info(`📁 Skipped folders (no new files): ${skippedFolders}`);
        logger_utils_1.Logger.info(`📄 Skipped files: ${skippedFiles}`);
        logger_utils_1.Logger.info(`⬇️ Downloaded files: ${downloadedFiles}`);
        if (newIndices.length > 0) {
            logger_utils_1.Logger.info(`🆕 New indices detected: ${newIndices.join(", ")}`);
        }
        exports.downloadStatus.state = "completed";
        exports.downloadStatus.finishedAt = new Date().toISOString();
        const results = {
            result: "Download completed successfully!",
            skippedFolders,
            skippedFiles,
            downloadedFiles,
            newIndices,
            downloadStatus: exports.downloadStatus,
        };
        return results;
    }
    catch (error) {
        logger_utils_1.Logger.error("❌ Error during file download:", error);
        exports.downloadStatus.state = "failed";
        exports.downloadStatus.finishedAt = new Date().toISOString();
        exports.downloadStatus.error = error.message;
    }
};
exports.default = downloadFiles;

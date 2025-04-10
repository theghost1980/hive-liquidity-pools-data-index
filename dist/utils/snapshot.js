"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsonUtils_1 = require("./jsonUtils");
const logger_utils_1 = require("./logger.utils");
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
    try {
        const folderNames = await fetchFilesFromServer(sourceUrl);
        if (!fs_1.default.existsSync(destDir)) {
            fs_1.default.mkdirSync(destDir, { recursive: true });
        }
        for (const folder of folderNames) {
            const folderUrl = `${sourceUrl}/${folder}`;
            const folderPath = path_1.default.join(destDir, folder);
            if (!fs_1.default.existsSync(folderPath)) {
                fs_1.default.mkdirSync(folderPath);
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
                    }
                }
            }
            if (!folderHadNewFiles) {
                skippedFolders++;
            }
        }
        logger_utils_1.Logger.info("\n✅ Download completed successfully!");
        logger_utils_1.Logger.info(`📁 Skipped folders (no new files): ${skippedFolders}`);
        logger_utils_1.Logger.info(`📄 Skipped files: ${skippedFiles}`);
        logger_utils_1.Logger.info(`⬇️ Downloaded files: ${downloadedFiles}`);
        if (downloadedFiles > 0) {
            jsonUtils_1.JsonUtils.readJsonFile("./public/server-data.json") //inc day count
                .then((v) => {
                if (v && v.snapshots_24h_days_taken) {
                    let count = v.snapshots_24h_days_taken;
                    count++;
                    jsonUtils_1.JsonUtils.writeJsonFile(`./public/server-data.json`, {
                        ...v,
                        snapshots_24h_days_taken: count,
                    });
                }
            })
                .catch((e) => logger_utils_1.Logger.error(`Error reading Json file server data! ${e.message}`));
        }
    }
    catch (error) {
        logger_utils_1.Logger.error("❌ Error during file download:", error);
    }
};
exports.default = downloadFiles;

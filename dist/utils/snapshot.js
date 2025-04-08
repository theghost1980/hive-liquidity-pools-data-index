"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
// Fetch file data from the server
const fetchFilesFromServer = async (url) => {
    try {
        const response = await axios_1.default.get(url);
        return response.data; // Assuming the server responds with a list of files/folders
    }
    catch (error) {
        console.error("Error fetching data from server:", error);
        throw error;
    }
};
// Helper function to download a file
const downloadFile = async (fileUrl, dest) => {
    const writer = fs_extra_1.default.createWriteStream(dest);
    const client = fileUrl.startsWith("https") ? https_1.default : http_1.default;
    client.get(fileUrl, (response) => {
        response.pipe(writer);
        writer.on("finish", () => {
            console.log(`File downloaded: ${dest}`);
        });
    });
};
// Recursively create folders and download .json files
const downloadFiles = async (sourceUrl, destDir) => {
    try {
        const data = await fetchFilesFromServer(sourceUrl);
        // Ensure destination directory exists
        if (!fs_extra_1.default.existsSync(destDir)) {
            fs_extra_1.default.mkdirSync(destDir, { recursive: true });
        }
        for (const folder of data.folders) {
            // Assuming the server returns a list of folders
            const folderUrl = `${sourceUrl}/${folder}`;
            const folderPath = path_1.default.join(destDir, folder);
            // Ensure the folder exists in the destination
            if (!fs_extra_1.default.existsSync(folderPath)) {
                fs_extra_1.default.mkdirSync(folderPath);
            }
            const files = await fetchFilesFromServer(folderUrl); // Fetch files in the folder
            for (const file of files) {
                if (file.endsWith(".json")) {
                    const fileUrl = `${sourceUrl}/${folder}/${file}`;
                    const destFilePath = path_1.default.join(folderPath, file);
                    // Download the .json file
                    await downloadFile(fileUrl, destFilePath);
                }
            }
            // Recursively handle subfolders if any
            await downloadFiles(folderUrl, folderPath);
        }
    }
    catch (error) {
        console.error("Error during file download:", error);
    }
};
// Export the main function so it can be used from another module
const main = async (sourceUrl, destDir) => {
    await downloadFiles(sourceUrl, destDir);
    console.log("All files have been downloaded successfully!");
};
exports.main = main;

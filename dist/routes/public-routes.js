"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promises_1 = require("fs/promises");
const moment_1 = __importDefault(require("moment"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
router.get("/available-data-pool-token-pair", async (req, res) => {
    try {
        const projectRoot = path_1.default.join(__dirname, "..");
        const mainDir = path_1.default.join(projectRoot, "public", "data");
        const entries = await (0, promises_1.readdir)(mainDir, { withFileTypes: true });
        const folderNames = entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name.replace("_", ":")); // Filter out directories + replace _ by : to keep HIVE LP formats
        res.json({ tokenPairs: folderNames, totalPairs: folderNames.length }); // Send the list of folder names as the response
    }
    catch (error) {
        console.error("Error reading directories:", error);
        res.status(500).send("Internal Server Error");
    }
});
router.get("/data-pool", async (req, res) => {
    const tokenPair = req.query.tokenPair;
    if (!tokenPair) {
        return res.status(400).send("No token pair specified.");
    }
    const projectRoot = path_1.default.resolve(__dirname, "..");
    const tokenPairDir = path_1.default.join(projectRoot, "public", "data", tokenPair.includes(":") ? tokenPair.replace(":", "_") : tokenPair);
    try {
        await (0, promises_1.access)(tokenPairDir); // Check if the tokenPair directory exists
    }
    catch (error) {
        return res.status(404).send("Token pair directory not found.");
    }
    try {
        const files = await (0, promises_1.readdir)(tokenPairDir);
        const jsonFiles = files.filter((file) => path_1.default.extname(file).toLowerCase() === ".json");
        if (jsonFiles.length === 0) {
            return res
                .status(404)
                .send("No JSON files found in the specified token pair directory.");
        }
        const jsonData = await Promise.all(jsonFiles.map(async (file) => {
            const filePath = path_1.default.join(tokenPairDir, file);
            const data = await (0, promises_1.readFile)(filePath, "utf8");
            const parsedData = JSON.parse(data);
            const snapshotTs = file.split("_")[1].split(".")[0];
            const snapshotISODate = (0, moment_1.default)(parseFloat(snapshotTs) * 1000).toISOString();
            return { ...parsedData, snapshotTs, snapshotISODate };
        }));
        res.json(jsonData);
    }
    catch (error) {
        console.error("Error reading JSON files:", error);
        res.status(500).send("Internal Server Error");
    }
});
exports.default = router;

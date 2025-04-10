"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const express_1 = require("express");
const promises_1 = require("fs/promises");
const moment_1 = __importDefault(require("moment"));
const path_1 = __importDefault(require("path"));
const logger_utils_1 = require("../utils/logger.utils");
const price_utils_1 = require("../utils/price-utils");
const rpc_node_utils_1 = require("../utils/rpc-node-utils");
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
router.get("/pool-fees", async (req, res) => {
    const tokenPair = req.query.tokenPair;
    const feePercentageBaseToken = req.query.feePercentageBaseToken;
    const feePercentageQuoteToken = req.query.feePercentageQuoteToken;
    const timeFrame = req.query.timeFrame; //TODO for the future if needed
    const response = await axios_1.default.post(`${rpc_node_utils_1.RpcNodeUtils.FASTESTRPCNODE.url}/contracts`, {
        jsonrpc: "2.0",
        method: "find",
        params: {
            contract: "marketpools",
            table: "pools",
            query: {
                tokenPair,
            },
            limit: 1,
        },
        id: 1,
    });
    //UNTIL HERE
    if (!tokenPair) {
        return res.status(400).send("No token pair specified.");
    }
    const tokenSymbols = tokenPair.split(":");
    if (!feePercentageBaseToken || !feePercentageQuoteToken) {
        return res
            .status(400)
            .send("Right now there is no source of truth for the fees currently in HIVE, so you must provide them for calculations.<br>Please use query params as:<br>feePercentageBaseToken=0.1 & feePercentageQuoteToken=0.15");
    }
    //unless specified, returns pool-fees last 24h
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
        const recentFiles = jsonFiles
            .map((file) => {
            // Extraemos el timestamp del nombre del archivo, que tiene la forma ts_[timestamp].json
            const match = file.match(/^ts_(\d+)\.json$/);
            if (match) {
                const timestamp = parseInt(match[1], 10); // Convertir el timestamp a número
                return { file, timestamp };
            }
            return null;
        })
            .filter((item) => item !== null)
            .sort((a, b) => b.timestamp - a.timestamp) // Ordenar por timestamp descendente
            .slice(0, 2); // Tomar los dos primeros (más recientes)
        // Leer contenido de los archivos seleccionados
        const jsonData = await Promise.all(recentFiles.map(async ({ file }) => {
            const filePath = path_1.default.join(tokenPairDir, file);
            const content = await (0, promises_1.readFile)(filePath, "utf-8");
            return JSON.parse(content);
        }));
        const priceTokenList = await price_utils_1.PriceUtils.getTokenPriceList(tokenSymbols);
        const hivePrice = await price_utils_1.PriceUtils.getHivePrice();
        const usdPriceTokenList = priceTokenList.map((p) => {
            const usdPriceToken = Number(hivePrice.hive.usd * p.lastPrice).toFixed(5);
            return { symbol: p.symbol, usdPriceToken };
        });
        // Calculate fees acording to user's fee input made on request
        const volumeDeltaBaseToken = parseFloat(response.data.result[0].baseVolume) -
            parseFloat(jsonData[0].baseVolume);
        const volumeDeltaQuoteToken = parseFloat(response.data.result[0].quoteVolume) -
            parseFloat(jsonData[0].quoteVolume);
        const totalFeesBaseToken = volumeDeltaBaseToken * (feePercentageBaseToken / 100);
        const totalFeesQuoteToken = volumeDeltaQuoteToken * (feePercentageQuoteToken / 100);
        const totalFeesBaseTokenUSD = totalFeesBaseToken * parseFloat(usdPriceTokenList[0].usdPriceToken);
        const totalFeesQuoteTokenUSD = totalFeesQuoteToken * parseFloat(usdPriceTokenList[1].usdPriceToken);
        const totalFeesUSD = totalFeesBaseTokenUSD + totalFeesQuoteTokenUSD;
        res.json({
            tokenPair,
            volumeDeltaBaseToken: `${volumeDeltaBaseToken} ${tokenSymbols[0]}`,
            volumeDeltaQuoteToken: `${volumeDeltaQuoteToken} ${tokenSymbols[1]}`,
            totalFeesBaseToken: `${totalFeesBaseToken} ${tokenSymbols[0]}`,
            totalFeesQuoteToken: `${totalFeesQuoteToken} ${tokenSymbols[1]}`,
            totalFeesBaseTokenUSD: totalFeesBaseTokenUSD.toFixed(5),
            totalFeesQuoteTokenUSD: totalFeesQuoteTokenUSD.toFixed(5),
            totalFeesPoolUSD: totalFeesUSD,
            baseTokenPrice: `${usdPriceTokenList[0].usdPriceToken}$`,
            quoteTokenPrice: `${usdPriceTokenList[1].usdPriceToken}$`,
            hivePriceGeckoUSD: `${parseFloat(hivePrice.hive.usd)}$`,
            timeFrameAsTs: `${moment_1.default
                .unix(recentFiles[0].timestamp)
                .format("YYYY-MM-DD")} / ${moment_1.default
                .unix(recentFiles[1].timestamp)
                .format("YYYY-MM-DD")}`,
        });
    }
    catch (error) {
        console.error("Error reading JSON files:", error.message);
        logger_utils_1.Logger.error("Error /pool-fees", error.message);
        res.status(500).send("Internal Server Error");
    }
});
router.get("/fastest-hive-rpc-node", async (req, res) => {
    try {
        const mode = req.query.mode;
        if (!mode) {
            res
                .status(400)
                .send('Must provide mode: "layer-1" | "layer-2"<br>"later-1": accounts, hive db, etc.<br>"layer-2": Hive Engine, tokens, liquidity pools, etc.');
        }
        const fastestNodeChecked = await rpc_node_utils_1.RpcNodeUtils.getFastestNode(mode);
        res.status(200).send({
            typeNode: mode,
            note: mode === "l1" ? "Hive RPC" : "Hive Engine RPC",
            fastestNodeChecked,
        });
    }
    catch (error) {
        logger_utils_1.Logger.error("Error /fastest-hive-rpc-node", error.message);
        res.status(500).send("Internal Server Error");
    }
});
exports.default = router;

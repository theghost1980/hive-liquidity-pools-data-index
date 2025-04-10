"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
//TODO update this as used
exports.config = {
    account: "theghost1980",
    tokenPair: "SWAP.HIVE:BEE",
    snapshotIntervals: {
        "1m": 1 * 60 * 1000, // 1 minute in milliseconds
        "5m": 5 * 60 * 1000, // 5 minutes in milliseconds
        "1h": 1 * 60 * 60 * 1000, // 1 hour in milliseconds
        "2h": 2 * 60 * 60 * 1000, // 2 hours in milliseconds
        "4h": 4 * 60 * 60 * 1000, // 4 hours in milliseconds
        "12h": 12 * 60 * 60 * 1000, // 12 hours in milliseconds
        "24h": 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    },
    apiEndpoint: "https://enginerpc.com/contracts",
    feeRate: 0.002, // 0.2% fee rate,
    jsonServerData: {
        relativePath_: "/reference-data/server-data.json",
        fileName: "server-data.json",
    },
};

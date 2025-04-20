"use strict";
// src/config/config.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAndValidateConfig = loadAndValidateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const process_1 = __importDefault(require("process"));
const SERVER_MAPPING = {
    local: {
        port: "local",
        url: `http://localhost:${process_1.default.env.PORT || 3000}`, // Uses PORT from .env or 3000
        description: "Local Dev Server",
    },
    production: {
        port: 3000,
        url: "https://hivelpindex.sytes.net",
        description: "Prod Server",
    },
    test: {
        port: 3001,
        url: "https://testhivelpindex.duckdns.org",
        description: "Test Server",
    },
};
let _validatedConfig;
function validatePort(variableName, envValue) {
    if (!envValue) {
        console.error(`FATAL ERROR: Env var ${variableName} not defined.`);
        process_1.default.exit(1);
    }
    const parsedPort = parseInt(envValue, 10);
    if (isNaN(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
        console.error(`FATAL ERROR: Value of ${variableName} "${envValue}" is not a valid port.`);
        process_1.default.exit(1);
    }
    return parsedPort;
}
function validateRequiredString(variableName, envValue) {
    if (!envValue || envValue.length === 0) {
        console.error(`FATAL ERROR: Env var ${variableName} not defined or empty.`);
        process_1.default.exit(1);
    }
    return envValue;
}
/**
 * Loads, validates, and determines application configuration based on environment variables.
 * Exits process on fatal validation errors.
 * Requires PORT, PORT_TEST, SECRET, and RUN_ENV environment variables.
 * @returns The validated AppConfig object.
 */
function loadAndValidateConfig() {
    if (_validatedConfig) {
        return _validatedConfig;
    }
    dotenv_1.default.config(); // Load .env vars into process.env
    const port = validatePort("PORT", process_1.default.env.PORT);
    const portTest = validatePort("PORT_TEST", process_1.default.env.PORT_TEST);
    const secret = validateRequiredString("SECRET", process_1.default.env.SECRET);
    const runEnvKey = validateRequiredString("RUN_ENV", process_1.default.env.RUN_ENV);
    const currentServer = SERVER_MAPPING[runEnvKey];
    if (!currentServer) {
        console.error(`FATAL ERROR: RUN_ENV "${runEnvKey}" does not match any server key (${Object.keys(SERVER_MAPPING).join(", ")}).`);
        process_1.default.exit(1);
    }
    let listeningPort;
    if (runEnvKey === "production") {
        listeningPort = port;
    }
    else if (runEnvKey === "test") {
        listeningPort = portTest;
    }
    else if (runEnvKey === "local") {
        listeningPort = port; // Local typically uses PORT
        SERVER_MAPPING.local.url = `http://localhost:${listeningPort}`; // Adjust local URL
    }
    else {
        // Should not be reached if validation above works
        console.error(`FATAL ERROR: Unexpected RUN_ENV value "${runEnvKey}" after validation.`);
        process_1.default.exit(1);
    }
    // Warning if .env port doesn't match mapped port (except 'local')
    if (runEnvKey !== "local" &&
        currentServer.port !== "local" &&
        currentServer.port !== listeningPort) {
        console.warn(`⚠️ WARNING: Mapped port (${currentServer.port}) for RUN_ENV="${runEnvKey}" does not match actual listening port from .env (${listeningPort}). Using ${listeningPort}.`);
    }
    _validatedConfig = {
        port: port,
        portTest: portTest,
        secret: secret,
        serverMapping: SERVER_MAPPING,
        currentServer: currentServer,
        listeningPort: listeningPort,
    };
    console.log(`✅ Config loaded. RUN_ENV="${runEnvKey}", Listening Port: ${listeningPort}, Server URL: ${currentServer.url}`);
    return _validatedConfig;
}

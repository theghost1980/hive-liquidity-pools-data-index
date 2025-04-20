"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcNodeUtils = void 0;
const axios_1 = __importDefault(require("axios"));
const moment_1 = __importDefault(require("moment"));
const perf_hooks_1 = require("perf_hooks"); // Para medir el tiempo de respuesta
const FASTESTRPCNODE = {
    url: "",
    last_ts_tested: 0,
    time: 0,
};
const herpcNodes = [
    "https://enginerpc.com",
    "https://herpc.dtools.dev",
    "https://api.primersion.com",
    "https://herpc.kanibot.com",
    "https://herpc.actifit.io",
    "https://api.hive-engine.com/rpc",
    "https://he.c0ff33a.uk",
];
const hiverpcNodes = [
    "https://api.hive.blog",
    "https://api.deathwing.me",
    "https://hive-api.arcange.eu",
    "https://api.openhive.network",
    "https://techcoderx.com",
    "https://api.c0ff33a.uk",
    "https://hive-api.3speak.tv",
    "https://hiveapi.actifit.io",
    "https://rpc.mahdiyari.info",
    "https://hive-api.dlux.io",
    "https://api.syncad.com",
];
const setFastestNode = (fastestNode) => {
    FASTESTRPCNODE.url = fastestNode.node;
    FASTESTRPCNODE.last_ts_tested = (0, moment_1.default)().unix();
    FASTESTRPCNODE.time = fastestNode.time;
};
const testRpcNode = async (url, mode) => {
    const startTime = perf_hooks_1.performance.now();
    try {
        let response;
        if (mode === "l1") {
            response = await axios_1.default.post(`${url}`, {
                jsonrpc: "2.0",
                method: "condenser_api.get_version",
                params: [],
                id: 1,
            });
        }
        else {
            response = await axios_1.default.post(`${url}/contracts`, {
                jsonrpc: "2.0",
                method: "find",
                params: {
                    contract: "marketpools",
                    table: "pools",
                    query: {},
                    limit: 1,
                },
                id: 1,
            });
        }
        const endTime = perf_hooks_1.performance.now();
        if (response && response.status === 200) {
            return endTime - startTime; // Devuelve el tiempo en milisegundos
        }
        else {
            throw new Error(`Error con el nodo: ${url}`);
        }
    }
    catch (error) {
        console.error(`Error al probar el nodo ${url}: ${error.message}`);
        return Infinity; // Si hay un error, devuelve un valor muy alto para que sea descartado
    }
};
// Función para testear todos los nodos RPC y encontrar el más rápido
const findFastestNode = async (nodes, mode) => {
    const nodeTimes = await Promise.all(nodes.map(async (node) => {
        const time = await testRpcNode(node, mode);
        return { node, time };
    }));
    // Ordenar por tiempo de respuesta
    nodeTimes.sort((a, b) => a.time - b.time);
    // Retornar el nodo más rápido
    const fastestNode = nodeTimes[0];
    console.log(`El nodo más rápido es: ${fastestNode.node} con un tiempo de respuesta de: ${fastestNode.time}ms`);
    return fastestNode;
};
const getFastestNode = async (toCheck) => {
    const fastestNode = await findFastestNode(toCheck === "l2" ? herpcNodes : hiverpcNodes, toCheck);
    return fastestNode;
};
exports.RpcNodeUtils = {
    getFastestNode,
    FASTESTRPCNODE,
    setFastestNode,
};

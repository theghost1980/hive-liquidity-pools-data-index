import axios from "axios";
import moment from "moment";
import { performance } from "perf_hooks"; // Para medir el tiempo de respuesta

export type RpcNodeType = "l1" | "l2";

export interface FastestNode {
  node: string;
  time: number;
}
export interface FastestRPCNode {
  url: string;
  last_ts_tested: number;
  time: number;
}

const FASTESTRPCNODE: FastestRPCNode = {
  url: "",
  last_ts_tested: 0,
  time: 0,
};

// Lista de nodos RPC que quieres probar
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

const setFastestNode = (fastestNode: FastestNode) => {
  // Aquí puedes hacer lo que necesites con el nodo más rápido, por ejemplo guardarlo en una constante
  FASTESTRPCNODE.url = fastestNode.node;
  FASTESTRPCNODE.last_ts_tested = moment().unix();
  FASTESTRPCNODE.time = fastestNode.time;
};

// Función para hacer una solicitud RPC y medir el tiempo de respuesta
const testRpcNode = async (url: string, mode: RpcNodeType): Promise<number> => {
  const startTime = performance.now();
  try {
    let response;
    if (mode === "l1") {
      response = await axios.post(`${url}`, {
        jsonrpc: "2.0",
        method: "condenser_api.get_version",
        params: [],
        id: 1,
      });
    } else {
      response = await axios.post(`${url}/contracts`, {
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
    const endTime = performance.now();
    if (response && response.status === 200) {
      return endTime - startTime; // Devuelve el tiempo en milisegundos
    } else {
      throw new Error(`Error con el nodo: ${url}`);
    }
  } catch (error: any) {
    console.error(`Error al probar el nodo ${url}: ${error.message}`);
    return Infinity; // Si hay un error, devuelve un valor muy alto para que sea descartado
  }
};

// Función para testear todos los nodos RPC y encontrar el más rápido
const findFastestNode = async (nodes: string[], mode: RpcNodeType) => {
  const nodeTimes: FastestNode[] = await Promise.all(
    nodes.map(async (node) => {
      const time = await testRpcNode(node, mode);
      return { node, time };
    })
  );

  // Ordenar por tiempo de respuesta
  nodeTimes.sort((a, b) => a.time - b.time);

  // Retornar el nodo más rápido
  const fastestNode = nodeTimes[0];
  console.log(
    `El nodo más rápido es: ${fastestNode.node} con un tiempo de respuesta de: ${fastestNode.time}ms`
  );

  return fastestNode;
};

// Ejecución
const getFastestNode = async (toCheck: RpcNodeType) => {
  const fastestNode = await findFastestNode(
    toCheck === "l2" ? herpcNodes : hiverpcNodes,
    toCheck
  );
  return fastestNode;
};

export const RpcNodeUtils = {
  getFastestNode,
  FASTESTRPCNODE,
  setFastestNode,
};

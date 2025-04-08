import axios from "axios";
import moment from "moment";
import { performance } from "perf_hooks"; // Para medir el tiempo de respuesta

const FASTESTRPCNODE = {
  url: "",
  last_ts_tested: 0,
  time: 0,
};

// Lista de nodos RPC que quieres probar
const rpcNodes = [
  "https://enginerpc.com",
  "https://herpc.dtools.dev",
  "https://api.primersion.com",
  "https://herpc.kanibot.com",
  "https://herpc.actifit.io",
];

// Función para hacer una solicitud RPC y medir el tiempo de respuesta
const testRpcNode = async (url: string): Promise<number> => {
  const startTime = performance.now();
  try {
    const response = await axios.post(`${url}/contracts`, {
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
    const endTime = performance.now();
    if (response.status === 200) {
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
const findFastestNode = async (nodes: string[]) => {
  const nodeTimes = await Promise.all(
    nodes.map(async (node) => {
      const time = await testRpcNode(node);
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
const getFastestNode = async () => {
  const fastestNode = await findFastestNode(rpcNodes);
  // Aquí puedes hacer lo que necesites con el nodo más rápido, por ejemplo guardarlo en una constante
  FASTESTRPCNODE.url = fastestNode.node;
  FASTESTRPCNODE.last_ts_tested = moment().unix();
  FASTESTRPCNODE.time = fastestNode.time;
  return FASTESTRPCNODE;
};

export const RpcNodeUtils = {
  getFastestNode,
  FASTESTRPCNODE,
};

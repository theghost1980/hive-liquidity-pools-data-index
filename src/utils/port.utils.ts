import { AppConfig } from "../config/config";
import { Logger } from "./logger.utils";

function determineListenPort(config: AppConfig): number {
  const listenVar = process.env.APP_LISTEN_PORT_VAR;
  const defaultPort = config.port;

  if (listenVar === "PORT_TEST") {
    Logger.info(
      `ℹ️ Usando puerto de prueba según especificado por APP_LISTEN_PORT_VAR=PORT_TEST`
    );
    return config.portTest;
  } else if (listenVar === "PORT" || !listenVar) {
    if (listenVar === "PORT") {
      Logger.info(
        `ℹ️ Usando puerto principal según especificado por APP_LISTEN_PORT_VAR=PORT`
      );
    } else {
      Logger.info(
        `ℹ️ APP_LISTEN_PORT_VAR no definida, por defecto usando puerto principal.`
      );
    }
    return defaultPort;
  } else {
    Logger.warn(
      `⚠️ Valor inválido "${listenVar}" para APP_LISTEN_PORT_VAR. Usando puerto principal por defecto ${defaultPort}.`
    );
    return defaultPort;
  }
}

export const PortUtils = {
  determineListenPort,
};

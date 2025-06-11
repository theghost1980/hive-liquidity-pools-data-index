import fs from "fs";
import path from "path";
import { configServer, MAINDATADIR } from "..";
import { Logger } from "./logger.utils";
import downloadFiles from "./snapshot";

export const checkIndexData = async (): Promise<void> => {
  if (!fs.existsSync(MAINDATADIR)) {
    Logger.error(`Data directory ${MAINDATADIR} does not exist. Creating...`);
    fs.mkdirSync(MAINDATADIR, { recursive: true });
    console.log("- Data index not found.");
    Logger.warn(
      `El directorio de datos principal ${MAINDATADIR} no fue encontrado. Se intentará:\n
        1. Crear carpeta de datos ${MAINDATADIR}.\n
        2. Cargar o descargar respaldo segun actual env.
      `
    );
    try {
      fs.mkdirSync(MAINDATADIR, { recursive: true });
      Logger.info(`Directorio de datos ${MAINDATADIR} creado exitosamente.`);
      if (configServer.currentServer.description === "Local Dev Server") {
        //try download
        const sourceUrl = "https://hivelpindex.sytes.net/data/";
        Logger.info(
          `Iniciando descarga por comando remoto admin. Dest: ${MAINDATADIR}`
        );
        const results = await downloadFiles(sourceUrl, MAINDATADIR);
        if (results?.result === "Download completed successfully!") {
          Logger.info(`Remote Download successful`, JSON.stringify(results));
        }
      } else {
        //try to copy file from vps db index location.
        //TODO in future! if needed
        console.log("Error as no Data found and no case coded yet! Exiting!");
        process.exit(1);
      }
    } catch (error) {
      Logger.error(
        `Fallo al crear el directorio de datos ${MAINDATADIR}:`,
        error
      );
      process.exit(1);
    }
  } else {
    Logger.info(`Data directory ${MAINDATADIR} already exists.`);
    Logger.info(`Directorio de datos encontrado en: ${MAINDATADIR}`);
    // Verificación sencilla: revisar la primera subcarpeta y si tiene al menos 1 archivo .json
    try {
      const entries = fs.readdirSync(MAINDATADIR, { withFileTypes: true });
      const firstSubdirectory = entries.find((entry) => entry.isDirectory());

      if (firstSubdirectory) {
        const subDirPath = path.join(MAINDATADIR, firstSubdirectory.name);
        Logger.info(
          `Verificando contenido en la primera subcarpeta: ${subDirPath}`
        );
        const subDirEntries = fs.readdirSync(subDirPath);
        const hasJsonFile = subDirEntries.some((file) =>
          file.toLowerCase().endsWith(".json")
        );

        if (hasJsonFile) {
          Logger.info(
            `Verificación básica exitosa: Se encontró al menos un archivo .json en ${firstSubdirectory.name}.`
          );
        } else {
          Logger.warn(
            `Advertencia: La subcarpeta ${firstSubdirectory.name} no contiene archivos .json.`
          );
        }
      } else {
        Logger.warn(
          `Advertencia: El directorio de datos ${MAINDATADIR} está vacío (no contiene subcarpetas).`
        );
      }
    } catch (error: any) {
      Logger.error(
        `Error durante la verificación básica del contenido de datos: ${error.message}`
      );
    }
  }
};

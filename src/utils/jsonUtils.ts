import * as fs from "fs/promises";
import * as path from "path";

async function readJsonFile<T = any>(relativePath: string): Promise<T | null> {
  const filePath = path.join(__dirname, "..", relativePath);

  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent) as T;
  } catch (err) {
    console.error("❌ Error al leer el archivo JSON:", err);
    return null;
  }
}

async function writeJsonFile<T = any>(
  relativePath: string,
  data: T
): Promise<boolean> {
  const filePath = path.join(__dirname, "..", relativePath);

  try {
    const json = JSON.stringify(data, null, 2); // formato bonito
    await fs.writeFile(filePath, json, "utf-8");
    return true;
  } catch (err) {
    console.error("❌ Error al escribir el archivo JSON:", err);
    return false;
  }
}

export const JsonUtils = {
  readJsonFile,
  writeJsonFile,
};

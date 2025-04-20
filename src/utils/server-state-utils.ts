import { access, readFile, writeFile } from "fs/promises";
import moment from "moment"; // Used for timestamp generation
import path from "path";
import { Logger } from "./logger.utils";

/**
 * Important: All the logic within this server uses ts = moment().unix(). Take this into account for proper calculations.
 */
export interface ServerData {
  genesis_up_date_ts: number;
  snapshots_24h_days_taken: number;
  last_snapshot_timestamp: number;
  // Add other expected fields here
}

const DEFAULT_SERVER_DATA: ServerData = {
  genesis_up_date_ts: 0, // Initialize to 0, will be updated on first run
  snapshots_24h_days_taken: 0,
  last_snapshot_timestamp: 0,
};

const SERVER_DATA_FILE_PATH = path.join(
  __dirname,
  "../public",
  "server-data.json"
);

/**
 * Initializes server data: reads file, creates if absent, updates genesis timestamp if 0.
 * Should be called during application startup.
 * @returns A Promise resolving with the ServerData object.
 * @throws Error if file exists but cannot be read/parsed, or if writing fails during init.
 */
async function initializeServerData(): Promise<ServerData> {
  Logger.info(`Initializing server data from ${SERVER_DATA_FILE_PATH}`);
  let currentData: ServerData;

  try {
    await access(SERVER_DATA_FILE_PATH);
    const fileContent = await readFile(SERVER_DATA_FILE_PATH, "utf8");
    currentData = JSON.parse(fileContent);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      Logger.warn(`Server data file not found. Creating default.`);
      currentData = { ...DEFAULT_SERVER_DATA };

      try {
        await writeFile(
          SERVER_DATA_FILE_PATH,
          JSON.stringify(currentData, null, 2),
          "utf8"
        );
        Logger.info("Default server data file created.");
      } catch (writeError: any) {
        Logger.error(
          `FATAL ERROR: Failed to write default server data file`,
          writeError
        );
        throw new Error(
          `Failed to create server data file: ${writeError.message}`
        );
      }
    } else {
      Logger.error(
        `FATAL ERROR: Failed to read or parse server data file`,
        error
      );
      throw new Error(`Failed to read or parse server data: ${error.message}`);
    }
  }

  if (
    currentData &&
    typeof currentData.genesis_up_date_ts === "number" &&
    currentData.genesis_up_date_ts === 0
  ) {
    Logger.info("Genesis timestamp is 0. Initializing with current timestamp.");
    const newTimestamp = moment().unix();
    const updatedData = { ...currentData, genesis_up_date_ts: newTimestamp };

    try {
      await writeFile(
        SERVER_DATA_FILE_PATH,
        JSON.stringify(updatedData, null, 2),
        "utf8"
      );
      Logger.info(
        `Genesis timestamp updated to ${newTimestamp}. File written.`
      );
      currentData = updatedData;
    } catch (writeError: any) {
      Logger.error(
        `FATAL ERROR: Failed to write updated server data file`,
        writeError
      );
      throw new Error(
        `Failed to write updated server data: ${writeError.message}`
      );
    }
  } else {
    const currentGenesisTs =
      currentData && typeof currentData.genesis_up_date_ts === "number"
        ? currentData.genesis_up_date_ts
        : "N/A";
    Logger.info(
      `Server data loaded. Genesis timestamp is ${currentGenesisTs}. No update needed.`
    );
  }

  return currentData;
}

/**
 * Reads the current server data from file, applies an update function, and writes the data back.
 * This is a basic read-modify-write operation; it does NOT handle concurrency/race conditions
 * if multiple processes or requests try to update the same file simultaneously.
 * @param updateFn A function that takes the current ServerData object and returns the updated ServerData object.
 * @returns A Promise resolving with the updated ServerData object.
 * @throws Error if the file cannot be read/parsed, the updateFn throws, or writing fails.
 */
async function updateServerData(
  updateFn: (data: ServerData) => ServerData
): Promise<ServerData> {
  Logger.info(
    `Attempting to update server data file: ${SERVER_DATA_FILE_PATH}`
  );
  let currentData: ServerData;

  try {
    const fileContent = await readFile(SERVER_DATA_FILE_PATH, "utf8");
    currentData = JSON.parse(fileContent);

    const updatedData = updateFn(currentData); // Execute the update logic

    await writeFile(
      SERVER_DATA_FILE_PATH,
      JSON.stringify(updatedData, null, 2),
      "utf8"
    );
    Logger.info("Server data file updated successfully.");

    return updatedData;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      Logger.error(
        `FATAL ERROR: Update failed. Server data file not found at ${SERVER_DATA_FILE_PATH}. It should be initialized first.`,
        error
      );
      throw new Error(
        `Update failed: server data file not found. Initialize it first.`
      );
    } else {
      Logger.error(
        `FATAL ERROR: Failed to update server data file at ${SERVER_DATA_FILE_PATH}`,
        error
      );
      throw new Error(`Failed to update server data: ${error.message}`);
    }
  }
}

async function tryIncrementServerDataDaysTaken() {
  let current_snapshots_24h_days_taken = 0;
  try {
    const updatedServerData: ServerData = await updateServerData(
      (currentData) => {
        current_snapshots_24h_days_taken = currentData.snapshots_24h_days_taken;
        return {
          ...currentData,
          snapshots_24h_days_taken:
            (currentData.snapshots_24h_days_taken || 0) + 1,
          last_snapshot_timestamp: moment().unix(),
          // Puedes añadir o modificar otros campos aquí si es necesario
        };
      }
    );
    Logger.info(
      `Successfully updated snapshots_24h_days_taken counter. prevCount: ${current_snapshots_24h_days_taken} saved:${updatedServerData.snapshots_24h_days_taken}`
    );
    return updatedServerData;
  } catch (error: any) {
    Logger.error(
      "FATAL: Failed to increment snapshots_24h_days_taken counter.",
      error
    );
    //in case of any error return default data
    return DEFAULT_SERVER_DATA;
  }
}

export const ServerStateUtils = {
  initializeServerData,
  updateServerData,
  DEFAULT_SERVER_DATA,
  tryIncrementServerDataDaysTaken,
};

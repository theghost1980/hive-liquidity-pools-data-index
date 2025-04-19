// src/config/config.ts

import dotenv from "dotenv";
import process from "process";
// No importamos Logger aquí para evitar dependencias circulares o problemas de inicialización temprana.
// Usaremos console.error para los errores críticos de configuración.

export interface ServerOption {
  port: number | "local"; // Puerto asociado a este entorno, 'local' para desarrollo
  url: string; // URL pública (o local) para acceder a este servidor/entorno
  description: string; // Descripción
}

export interface ServerOptionsMap {
  [key: string]: ServerOption; // Mapeo de clave (como 'production', 'test') a ServerOption
  local: ServerOption;
  production: ServerOption; // Usar 'production' como clave
  test: ServerOption; // Usar 'test' como clave
}

// Mapeo de las opciones de servidor con sus puertos esperados y URLs
const SERVER_MAPPING: ServerOptionsMap = {
  local: {
    port: "local", // Indicador de entorno local
    // La URL local se construirá con el puerto real de .env
    url: `http://localhost:${process.env.PORT || 3000}`, // Placeholder inicial
    description: "Local Development Server",
  },
  production: {
    port: 3000, // Puerto esperado para producción
    url: "https://hivelpindex.sytes.net",
    description: "Production Server",
  },
  test: {
    port: 3001, // Puerto esperado para test
    url: "https://testhivelpindex.duckdns.org",
    description: "Test Server",
  },
};

// Configuración final de la aplicación, validada
export interface AppConfig {
  port: number; // Puerto de producción (de .env)
  portTest: number; // Puerto de test (de .env)
  secret: string; // Secreto JWT (de .env)
  serverMapping: ServerOptionsMap; // Mapeo completo de servidores
  currentServer: ServerOption; // La opción de servidor para ESTA instancia (determinada por RUN_ENV)
}

// Cache interno
let _validatedConfig: AppConfig | undefined;

// Validar que sea un puerto válido
function validatePort(
  variableName: string,
  envValue: string | undefined
): number {
  if (!envValue) {
    console.error(
      `FATAL ERROR: Environment variable ${variableName} is not defined.`
    );
    process.exit(1);
  }
  const parsedPort = parseInt(envValue, 10);
  if (isNaN(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
    console.error(
      `FATAL ERROR: Value of ${variableName} "${envValue}" is not a valid port (1-65535).`
    );
    process.exit(1);
  }
  return parsedPort;
}

// Validar que no esté vacío
function validateRequiredString(
  variableName: string,
  envValue: string | undefined
): string {
  if (!envValue || envValue.length === 0) {
    console.error(
      `FATAL ERROR: Environment variable ${variableName} is not defined or empty.`
    );
    process.exit(1);
  }
  return envValue;
}

// Cargar, validar y determinar la configuración del servidor actual
export function loadAndValidateConfig(): AppConfig {
  if (_validatedConfig) {
    return _validatedConfig;
  }

  // Cargar .env (no sale si falla, las variables pueden venir del entorno)
  dotenv.config();

  // Validar variables requeridas
  const port = validatePort("PORT", process.env.PORT);
  const portTest = validatePort("PORT_TEST", process.env.PORT_TEST);
  const secret = validateRequiredString("SECRET", process.env.SECRET);
  // Validar la nueva variable que indica el entorno actual
  const runEnvKey = validateRequiredString("RUN_ENV", process.env.RUN_ENV);

  // Determinar la opción de servidor actual usando la clave RUN_ENV
  const currentServer = SERVER_MAPPING[runEnvKey];

  // Validar que RUN_ENV sea una clave válida en nuestro mapeo
  if (!currentServer) {
    console.error(
      `FATAL ERROR: Environment variable RUN_ENV "${runEnvKey}" does not match any key in the server mapping (${Object.keys(
        SERVER_MAPPING
      ).join(", ")}).`
    );
    process.exit(1);
  }

  if (runEnvKey === "local") {
    SERVER_MAPPING.local.url = `http://localhost:${port}`;
  }

  // Construir el objeto de configuración final
  _validatedConfig = {
    port: port,
    portTest: portTest,
    secret: secret,
    serverMapping: SERVER_MAPPING,
    currentServer: currentServer,
  };

  console.log(
    `✅ Config loaded for RUN_ENV="${runEnvKey}". Server URL: ${currentServer.url}`
  );

  return _validatedConfig;
}

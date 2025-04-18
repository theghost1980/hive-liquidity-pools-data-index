import dotenv from "dotenv";
import process from "process";

export interface AppConfig {
  port: number;
  secret: string;
  portTest: number;
}

let _validatedConfig: AppConfig | undefined;

/**
 * Valida que una variable de entorno sea un número de puerto válido (1-65535).
 * Si la validación falla, el proceso se detiene con un error.
 * @param variableName El nombre de la variable de entorno (ej. 'PORT', 'PORT_TEST').
 * @param envValue El valor de la variable de entorno (generalmente process.env[variableName]).
 * @returns El número de puerto validado (como number).
 */
function validatePort(
  variableName: string,
  envValue: string | undefined
): number {
  if (!envValue) {
    console.error(
      `❌ FATAL ERROR: La variable de entorno ${variableName} no está definida en el archivo .env`
    );
    process.exit(1);
  }

  const parsedPort = parseInt(envValue, 10);

  if (isNaN(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
    console.error(
      `❌ FATAL ERROR: El valor de ${variableName} en .env no es un número de puerto válido: "${envValue}"`
    );
    console.error(
      `ℹ️ ${variableName} debe ser un número entero positivo entre 1 y 65535.`
    );
    process.exit(1);
  }

  return parsedPort;
}

/**
 * Carga las variables de entorno desde .env y las valida.
 * Si la validación falla, el proceso se detiene.
 * @returns La configuración validada.
 */
export function loadAndValidateConfig(): AppConfig {
  if (_validatedConfig) {
    return _validatedConfig;
  }

  const dotenvResult = dotenv.config();
  if (dotenvResult.error) {
    console.error(
      "❌ FATAL ERROR: No se pudo cargar el archivo .env. Asegúrate de que exista en el directorio raíz."
    );
    console.error("Detalle del error:", dotenvResult.error);
    process.exit(1);
  }

  const port = validatePort("PORT", process.env.PORT);
  const portTest = validatePort("PORT_TEST", process.env.PORT_TEST);
  const secret = process.env.SECRET;
  if (!secret || secret.length === 0) {
    console.error(
      "❌ FATAL ERROR: La variable de entorno SECRET no está definida o está vacía en el archivo .env"
    );
    process.exit(1);
  }

  console.log(
    "✅ Variables de entorno PORT, PORT_TEST y SECRET cargadas y validadas."
  ); // Actualizar mensaje

  _validatedConfig = {
    port: port,
    portTest: portTest,
    secret: secret,
  };

  return _validatedConfig;
}

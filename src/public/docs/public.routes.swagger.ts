/**
 * @swagger
 * /public/available-data-pool-token-pair:
 *   get:
 *     summary: Obtiene la lista de pares de tokens disponibles.
 *     tags:
 *       - Public
 *     responses:
 *       200:
 *         description: Lista de pares de tokens obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokenPairs:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["HIVE:SWAP.HBD", "HIVE:SWAP.BTC"]
 *                 totalPairs:
 *                   type: integer
 *                   example: 2
 *       500:
 *         description: Error interno del servidor. Contactar a soporte técnico.
 */

/**
 * @swagger
 * /public/data-pool:
 *   get:
 *     summary: Obtiene los datos en formato JSON de un par de tokens específico.
 *     tags:
 *       - Public
 *     parameters:
 *       - in: query
 *         name: tokenPair
 *         schema:
 *           type: string
 *         required: true
 *         description: El par de tokens, por ejemplo `AFIT:AFITX`
 *     responses:
 *       200:
 *         description: Datos JSON obtenidos exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: integer
 *                     example: 112
 *                   tokenPair:
 *                     type: string
 *                     example: "AFIT:AFITX"
 *                   baseQuantity:
 *                     type: string
 *                     example: "2607741.27953468"
 *                   baseVolume:
 *                     type: string
 *                     example: "41787903.87460025"
 *                   basePrice:
 *                     type: string
 *                     example: "0.00052130"
 *                   quoteQuantity:
 *                     type: string
 *                     example: "1359.43294101"
 *                   quoteVolume:
 *                     type: string
 *                     example: "11687.23635820"
 *                   quotePrice:
 *                     type: string
 *                     example: "1918.25665015"
 *                   totalShares:
 *                     type: string
 *                     example: "58727.31265509210142249948"
 *                   precision:
 *                     type: integer
 *                     example: 8
 *                   creator:
 *                     type: string
 *                     example: "actifit"
 *                   isoDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-04-10T00:00:01.000Z"
 *       400:
 *         description: No se especificó el parámetro tokenPair.
 *       404:
 *         description: Directorio o archivos no encontrados para el tokenPair dado.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /public/pool-fees:
 *   get:
 *     summary: Calcula las comisiones estimadas del pool.
 *     description: >
 *       Calcula las comisiones estimadas del pool basadas en las diferencias de volumen.
 *       Los porcentajes de comisión (`feePercentageBaseToken` y `feePercentageQuoteToken`) son opcionales.
 *       Si no se proveen, se utilizará un valor por defecto de 0.125% para ambos tokens.
 *     tags:
 *       - Public
 *     parameters:
 *       - in: query
 *         name: tokenPair
 *         schema:
 *           type: string
 *         required: true
 *         description: "El par de tokens (ejemplo: 'AFIT:AFITX')"
 *       - in: query
 *         name: feePercentageBaseToken
 *         schema:
 *           type: number
 *           format: float
 *         required: false
 *         description: "Porcentaje de comisión aplicado al token base (ej: '0.1'). Si no se provee, se usa 0.125."
 *       - in: query
 *         name: feePercentageQuoteToken
 *         schema:
 *           type: number
 *           format: float
 *         required: false
 *         description: "Porcentaje de comisión aplicado al token de referencia (ej: '0.15'). Si no se provee, se usa 0.125."
 *       - in: query
 *         name: timeFrameDays
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 7
 *         required: false
 *         description: "Número de días para el cálculo de comisiones (ej: 1 para ~24h, 7 para ~7 días). Máximo 7. Si no se provee, se usa 1."
 *     responses:
 *       200:
 *         description: Comisiones calculadas exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokenPair:
 *                   type: string
 *                   example: "AFIT:AFITX"
 *                 volumeDeltaBaseToken:
 *                   type: string
 *                   example: "1000 AFIT"
 *                 volumeDeltaQuoteToken:
 *                   type: string
 *                   example: "12 AFITX"
 *                 totalFeesBaseToken:
 *                   type: string
 *                   example: "1 AFIT"
 *                 totalFeesQuoteToken:
 *                   type: string
 *                   example: "0.018 AFITX"
 *                 totalFeesBaseTokenUSD:
 *                   type: string
 *                   example: "0.52340"
 *                 totalFeesQuoteTokenUSD:
 *                   type: string
 *                   example: "1.14210"
 *                 totalFeesPoolUSD:
 *                   type: number
 *                   example: 1.6655
 *                 feePercentageBaseTokenUsed:
 *                   type: number
 *                   format: float
 *                   example: 0.125
 *                 feePercentageQuoteTokenUsed:
 *                   type: number
 *                   format: float
 *                   example: 0.125
 *                 feeSourceMessage:
 *                   type: string
 *                   example: "Default fees (0.125%) used as none were provided."
 *                 baseTokenPrice:
 *                   type: string
 *                   example: "0.52340$"
 *                 quoteTokenPrice:
 *                   type: string
 *                   example: "63.45000$"
 *                 calculationPeriodMessage:
 *                   type: string
 *                   example: "Fees since 2025-06-10 12:00:00 (approx. 24 hours ago). Target period: 1 day(s)."
 *                 hivePriceGeckoUSD:
 *                   type: string
 *                   example: "0.2945$"
 *       400:
 *         description: Parámetros requeridos faltantes (tokenPair, fees).
 *       404:
 *         description: Directorio o archivos no encontrados.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /public/fastest-hive-rpc-node:
 *   get:
 *     summary: Retorna el nodo RPC más rápido disponible para el tipo solicitado (L1 o L2).
 *     description: |
 *       Obtiene dinámicamente el nodo RPC más rápido según el tipo de red especificado.
 *       - `l1`: Nodo de la capa principal de Hive (cuentas, bloques, transacciones).
 *       - `l2`: Nodo de Hive Engine (tokens, contratos, piscinas de liquidez).
 *
 *       **Nota:**
 *       1. El tiempo que retorna la respuesta está dado en milisegundos (ms). Ej: `120.0004 ms`.
 *       2. Actualmente tenemos estas listas de nodos RPC disponibles:
 *
 *          **Lista de nodos RPC para Hive Engine (L2):**
 *          - https://enginerpc.com
 *          - https://herpc.dtools.dev
 *          - https://api.primersion.com
 *          - https://herpc.kanibot.com
 *          - https://herpc.actifit.io
 *          - https://api.hive-engine.com/rpc
 *          - https://he.c0ff33a.uk
 *
 *          **Lista de nodos RPC para Hive (L1):**
 *          - https://api.hive.blog
 *          - https://api.deathwing.me
 *          - https://hive-api.arcange.eu
 *          - https://api.openhive.network
 *          - https://techcoderx.com
 *          - https://api.c0ff33a.uk
 *          - https://hive-api.3speak.tv
 *          - https://hiveapi.actifit.io
 *          - https://rpc.mahdiyari.info
 *          - https://hive-api.dlux.io
 *          - https://api.syncad.com
 *
 *       Si deseas agregar más nodos o darnos sugerencias, por favor contactanos en Discord o emite una PR directamente al código fuente del servidor en [GitHub](https://github.com/theghost1980/hive-liquidity-pools-data-index).
 *     tags:
 *       - Public
 *     parameters:
 *       - in: query
 *         name: mode
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - l1
 *             - l2
 *         description: |
 *           Tipo de nodo a buscar:
 *           - `l1`: Hive RPC (capa base).
 *           - `l2`: Hive Engine RPC (tokens, smart contracts).
 *     responses:
 *       200:
 *         description: Nodo RPC más rápido obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 typeNode:
 *                   type: string
 *                   example: "l2"
 *                 note:
 *                   type: string
 *                   example: "Hive Engine RPC"
 *                 fastestNodeChecked:
 *                   type: object
 *                   properties:
 *                     node:
 *                       type: string
 *                       example: "https://api.hive-engine.com/rpc"
 *                     time:
 *                       type: number
 *                       example: 120.0009
 *       400:
 *         description: No se proporcionó el parámetro `mode`.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /public/status:
 *   get:
 *     summary: Retorna el estado general del servidor y el tamaño de los datos principales.
 *     description: |
 *       Obtiene información sobre el estado actual del servidor, incluyendo:
 *       - Tamaño total de la carpeta principal en bytes, MB y GB.
 *       - El último nodo HERPC probado.
 *       - Información adicional del servidor desde un archivo JSON de configuración.
 *
 *       Nota: Dentro de la propiedad `serverData`, `genesis_up_date_ts` es un timestamp UNIX de la primera toma de snapshots.
 *     tags:
 *       - Public
 *     responses:
 *       200:
 *         description: Estado del servidor y detalles de tamaño de datos obtenidos exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 overall_index:
 *                   type: string
 *                   example: "In Progress!"
 *                 mainFolderSizeBytes:
 *                   type: string
 *                   example: "123456789 Bytes"
 *                 mainFolderSizeMB:
 *                   type: string
 *                   example: "123.456 MB"
 *                 mainFolderSizeGB:
 *                   type: string
 *                   example: "0.123 GB"
 *                 lastHERPCNodeTested:
 *                   type: string
 *                   example: "https://herpc.actifit.io"
 *                 serverData:
 *                   type: object
 *                   properties:
 *                     genesis_up_date_ts:
 *                       type: integer
 *                       example: 1744721463
 *                       description: "Timestamp UNIX de la primera toma de snapshots."
 *                     snapshots_24h_days_taken:
 *                       type: integer
 *                       example: 0
 *                       description: "Número entero que se incrementa con cada registro de datos por día (cada 24h)."
 *       500:
 *         description: Error interno del servidor.
 */

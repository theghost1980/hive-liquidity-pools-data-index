---

## Pasos para Implementar el Web Scraping de TribalDex (TODO en la App)

Aquí tienes los pasos detallados para integrar el scraping de datos de Tribaldex en tu aplicación Node.js/TypeScript, diseñado como una lista de tareas:

---

### **1. Instalación de Dependencias**

Asegúrate de instalar las librerías necesarias en tu proyecto:

- **`axios`**: Para realizar las solicitudes HTTP.
- **`cheerio`**: Para parsear el HTML y extraer los datos.
- **`@types/axios` y `@types/cheerio`**: Para el soporte de TypeScript.

<!-- end list -->

```bash
npm install axios cheerio @types/axios @types/cheerio
# o
yarn add axios cheerio @types/axios @types/cheerio
```

---

### **2. Creación de la Función de Scraping**

Crea un archivo (por ejemplo, `src/utils/tribalDexScraper.ts`) que contendrá la lógica de extracción de datos.

```typescript
import axios from "axios";
import * as cheerio from "cheerio";

// Define la interfaz para los datos de cada pool para un mejor tipado
interface PoolData {
  pair: string;
  price: string; // Inicialmente como string, necesitará limpieza
  totalLiquidity: string; // Inicialmente como string, necesitará limpieza
  feeEarned: string; // Inicialmente como string, necesitará limpieza
  volume: string; // Inicialmente como string, necesitará limpieza
}

/**
 * Función para scrapear los datos de los pools de liquidez de TribalDex.
 * @returns {Promise<PoolData[]>} Un array de objetos con los datos de los pools.
 */
export async function scrapeTribalDexPools(): Promise<PoolData[]> {
  const url = "https://tribaldex.com/pools";
  const pools: PoolData[] = [];

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Iterar sobre cada fila de pool.
    // Basado en la inspección actual de la página (Mayo de 2024),
    // cada fila es un div con la clase 'body-row active'.
    $("div.body-row.active").each((_index, element) => {
      const $row = $(element);

      // Extraer el texto de cada 'columna' según su posición.
      // ¡ADVERTENCIA!: Los selectores pueden cambiar si el sitio web actualiza su estructura.
      // Siempre verifica manualmente en el navegador si el scraper deja de funcionar.
      const pairText = $row
        .find("div.col-md-3:nth-child(1) span.text-white")
        .text()
        .trim();
      const priceText = $row.find("div.col-md-3:nth-child(2)").text().trim();
      const liquidityText = $row
        .find("div.col-md-2:nth-child(3)")
        .text()
        .trim();
      const feeText = $row.find("div.col-md-2:nth-child(4)").text().trim();
      const volumeText = $row.find("div.col-md-2:nth-child(5)").text().trim();

      pools.push({
        pair: pairText,
        price: priceText, // TODO: Implementar limpieza y conversión a número
        totalLiquidity: liquidityText, // TODO: Implementar limpieza y conversión a número
        feeEarned: feeText, // TODO: Implementar limpieza y conversión a número
        volume: volumeText, // TODO: Implementar limpieza y conversión a número
      });
    });

    console.log(`Scraped ${pools.length} pools from TribalDex.`);
    return pools;
  } catch (error) {
    console.error(
      `Error scraping TribalDex pools: ${
        error instanceof Error ? error.message : error
      }`
    );
    return []; // Retorna un array vacío en caso de error
  }
}
```

---

### **3. Implementación de la Lógica de Limpieza de Datos (TODO crucial)**

Los datos extraídos (`priceText`, `liquidityText`, `feeText`, `volumeText`) son cadenas de texto crudas con múltiples valores, unidades y símbolos. **Necesitarás funciones de limpieza** para convertirlos en números o valores utilizables.

**Ejemplo para `priceText` (simplemente una idea, la implementación real puede ser compleja):**

```typescript
// Dentro de tu función scrapeTribalDexPools, después de extraer priceText:
// const priceMatch = priceText.match(/SWAP\.HIVE: \$([\d,\.]+)/); // Busca el patrón para SWAP.HIVE: $X.XX
// const hivePrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
// price: hivePrice.toString(), // Almacena el valor limpio
```

**Tareas de limpieza:**

- **Identificar patrones**: Usa expresiones regulares (`RegExp`) para extraer solo los valores numéricos y las unidades relevantes (USD, HIVE, GEC, etc.).
- **Eliminar caracteres no numéricos**: Quita comas, símbolos de dólar, espacios extra.
- **Convertir a número**: Usa `parseFloat()` o `parseInt()` para convertir las cadenas limpias en tipos `number`.
- **Manejo de múltiples valores**: Algunas columnas como "Price" y "Total Liquidity" muestran varios valores (ej., en diferentes tokens y USD). Decide cuál es el valor que realmente necesitas para tus cálculos.

---

### **4. Integración en el Backend y Caché**

Para evitar abusar del servidor de TribalDex y optimizar tu rendimiento, **NO** hagas scraping en cada solicitud de usuario. Implementa un sistema de caché.

1.  **Crea un Endpoint API en tu Backend:**

    - Este endpoint (`/api/tribaldex-pools`, por ejemplo) será el que tu frontend o tus procesos internos llamarán para obtener los datos de los pools.

2.  **Implementa la Lógica de Caché en tu Backend:**

    - **Almacena los datos:** Usa una variable en memoria (para aplicaciones pequeñas), Redis, o una base de datos liviana para almacenar los datos de los pools.
    - **Define una caducidad:** Decide cada cuánto tiempo quieres que los datos se actualicen (ej., cada 5 o 10 minutos).

    <!-- end list -->

    ```typescript
    // src/server.ts (o tu archivo de entrada de API)
    import express from "express";
    import { scrapeTribalDexPools } from "./utils/tribalDexScraper";

    const app = express();
    const PORT = process.env.PORT || 3001;

    let cachedPools: PoolData[] = [];
    let lastScrapeTime: number = 0;
    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos en milisegundos

    // Función para actualizar los datos en caché
    async function updatePoolsCache() {
      console.log("Updating TribalDex pools cache...");
      const newPools = await scrapeTribalDexPools();
      if (newPools.length > 0) {
        // Solo actualiza si el scrape fue exitoso
        cachedPools = newPools;
        lastScrapeTime = Date.now();
        console.log("TribalDex pools cache updated.");
      } else {
        console.warn("Failed to update TribalDex pools cache, using old data.");
      }
    }

    // Inicializa la caché al iniciar el servidor
    updatePoolsCache();
    // Programa la actualización de la caché a intervalos regulares
    setInterval(updatePoolsCache, CACHE_DURATION);

    app.get("/api/tribaldex-pools", async (req, res) => {
      // Si la caché es vieja, intenta actualizarla inmediatamente (pero la llamada al scraper es asíncrona)
      if (Date.now() - lastScrapeTime > CACHE_DURATION) {
        // En un sistema de producción, podrías querer un mecanismo de bloqueo
        // para evitar múltiples scrapes simultáneos si muchas peticiones llegan a la vez.
        // Por ahora, solo lanzamos la actualización.
        updatePoolsCache();
      }
      res.json(cachedPools);
    });

    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
    ```

---

### **5. Monitoreo y Mantenimiento**

- **Monitorea los logs**: Asegúrate de que tu scraper esté funcionando correctamente y no esté arrojando errores.
- **Atribución**: Si vas a mostrar estos datos públicamente, considera cómo dar crédito a TribalDex como la fuente de los datos, si sus términos de uso lo requieren.
- **Adaptación a cambios**: Prepárate para ajustar los selectores CSS (`div.body-row.active`, `div.col-md-X`, etc.) si TribalDex.com actualiza su interfaz, ya que esto romperá tu scraper.

Al seguir estos pasos, podrás integrar de manera robusta la extracción de datos de Tribaldex en tu aplicación Node.js/TypeScript.

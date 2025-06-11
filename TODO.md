## Critical //TODO

- Actualizar desde el sitio de producción (sytes o test).
- Agregar 2 fuentes más para los precios de HBD y HIVE (ej. CoinMarketCap, etc.).
- **Tareas para el entorno de TEST:**
  - Subir cambios y archivo `.env` al VPS de test.
  - Mover la ubicación de la data a `/BD-central/data` en el directorio padre del proyecto de test.
  - Probar los puertos y modificar la configuración del servidor (ej. Nginx, Caddy) según sea necesario para el entorno de test.
  - Probar la integración con el frontend.
  - Si todo va bien, ¡publicar un post anunciando las mejoras!
- Plug & Pray :D

## DB backups, restoration, validation related

1. **Implementar función `validateExistingData(dataDir)`**:
   - Iterar por carpetas de `tokenPair` en `MAINDATADIR`.
   - Iterar por archivos JSON de snapshots (ej: `ts_[timestamp].json`) en cada carpeta de `tokenPair`.
2. **Validar cada archivo JSON**:
   - Intentar leer y parsear el contenido JSON.
   - Implementar una función `validateRecord(record, expectedTokenPair, filePath)` para validar la estructura y contenido de cada registro.
     - Verificar campos requeridos (`_id`, `tokenPair`, `baseQuantity`, etc.).
     - Validar tipos de datos (números, strings, strings numéricos, fechas ISO).
     - Asegurar consistencia: `tokenPair` en JSON debe coincidir con el nombre de la carpeta contenedora.
3. **Definir estructura para reporte de validación**: Crear interfaces (ej: `ValidationError`, `ValidationReport`) para acumular y devolver errores.
4. **Integrar la validación en `checkIndexData`**: Llamar a `validateExistingData` si `MAINDATADIR` ya existe.
5. **Definir acciones post-validación**:
   - Si hay errores:
     - Loguear detalladamente los problemas.
     - Para desarrollo (`Local Dev Server`): Intentar reparar (ej: eliminar archivos corruptos y re-descargar usando `downloadFiles`).
     - Para producción: Loguear como error crítico y considerar si se debe detener la aplicación o alertar.
   - Si la validación es exitosa: Loguear confirmación.
6. **Considerar optimizaciones de rendimiento** para la validación si el volumen de datos es muy grande.
7. **Mejorar `downloadFiles`**: Añadir opción para forzar la re-descarga de archivos específicos o todos, para facilitar la reparación.

import { Application, Request, Response } from "express";
import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

export default (
  app: Application,
  port: number | string,
  swaggerServerUrl: string
) => {
  const swaggerOptions: swaggerJSDoc.Options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Hive LP Indice",
        version: "1.0.0",
        description:
          "La siguiente API pretende servir los datos de almacenados de 24h para cada piscina de liquidez de HIVE. Ademas contamos con varias rutas útiles y disponibles para facilitar cálculos y acceso a datos especificos, relacionados con las piscinas de liquidez de HIVE.",
      },
      servers: [
        {
          url: swaggerServerUrl,
        },
      ],
    },
    apis: [
      path.join(__dirname, "../routes/*.ts"),
      path.join(__dirname, "../public/docs/*.ts"),
    ],
  };

  const swaggerSpec = swaggerJSDoc(swaggerOptions);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Swagger page

  app.get("/docs.json", (req: Request, res: Response) => {
    // Docs in JSON format
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(
    `✅ Documentación de Swagger configurada en /api-docs, usando puerto: ${port}`
  );
};

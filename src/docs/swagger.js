import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Diretório dos assets estáticos do Swagger UI, resolvido a partir do pacote instalado
const swaggerUiDistPath = require("swagger-ui-dist").getAbsoluteFSPath();

// Lista branca de arquivos estáticos que podem ser servidos em /api/docs/:asset
const ASSET_CONTENT_TYPES = {
  "swagger-ui.css": "text/css",
  "swagger-ui-bundle.js": "application/javascript",
  "swagger-ui-standalone-preset.js": "application/javascript",
  "favicon-32x32.png": "image/png",
  "favicon-16x16.png": "image/png",
};

// Monta a página HTML do Swagger UI apontando para o JSON da especificação
export function renderSwaggerHtml() {
  return `<!DOCTYPE html>
<html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <title>Rocketseat Blog IA API - Docs</title>
    <link rel="stylesheet" href="/api/docs/swagger-ui.css" />
    <link rel="icon" href="/api/docs/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" href="/api/docs/favicon-16x16.png" sizes="16x16" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api/docs/swagger-ui-bundle.js"></script>
    <script src="/api/docs/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/api/docs/json",
          dom_id: "#swagger-ui",
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: "StandaloneLayout",
        });
      };
    </script>
  </body>
</html>`;
}

// Lê um asset estático do swagger-ui-dist, rejeitando qualquer nome fora da lista branca
export async function readSwaggerAsset(fileName) {
  const contentType = ASSET_CONTENT_TYPES[fileName];
  if (!contentType) return null;

  const content = await readFile(`${swaggerUiDistPath}/${fileName}`);
  return { content, contentType };
}

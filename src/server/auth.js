// Verifica se a requisição trouxe a API key válida via "Authorization: Bearer <token>"
export function hasValidApiKey(req, apiKey) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  return scheme === "Bearer" && !!token && token === apiKey;
}

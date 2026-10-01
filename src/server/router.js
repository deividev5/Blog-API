// Converte um path tipo "/posts/:id" em uma regex e a lista de nomes de parâmetros
function compilePath(path) {
  const paramNames = [];

  const pattern = path
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      if (segment.startsWith(":")) {
        paramNames.push(segment.slice(1));
        return "([^/]+)";
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");

  return { regex: new RegExp(`^/${pattern}/?$`), paramNames };
}

// Roteador minimalista inspirado no Fastify: registra rotas por método e despacha para o handler correspondente
export function createRouter() {
  const routes = [];

  function addRoute(method, path, handler) {
    const { regex, paramNames } = compilePath(path);
    routes.push({ method, regex, paramNames, handler });
  }

  return {
    get: (path, handler) => addRoute("GET", path, handler),
    post: (path, handler) => addRoute("POST", path, handler),
    put: (path, handler) => addRoute("PUT", path, handler),
    delete: (path, handler) => addRoute("DELETE", path, handler),

    async handle(req, res) {
      const path = req.url.split("?").at(0) || "/";

      const route = routes.find((route) => route.method === req.method && route.regex.test(path));

      if (!route) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Not Found" }));
      }

      const match = path.match(route.regex);
      req.params = Object.fromEntries(
        route.paramNames.map((name, index) => [name, match[index + 1]]),
      );

      return route.handler(req, res);
    },
  };
}

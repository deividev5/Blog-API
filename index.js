import http from 'node:http' 

// Criando o servidor HTTP que responde com "Hello world"
const server = http.createServer((req, res) => {
  
  // Extraindo informações da requisição HTTP
  const {url, method, headers} = req
  // Separando o caminho e os parâmetros da URL
  const path = url.split('?')[0]
  // Extraindo os parâmetros da URL
  // Cada parâmetro é um par chave-valor separado por '='
  const params = url.split('?')[1]?.split('&').map(param => param.split('='))
  console.log("Method:", method)
  console.log("Path:", path)
  console.log("Params:", params)

  // Roteamento básico de get e post para /products
  if (path == '/products' && method == 'GET'){
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({data: [{id: 1, name: 'Product 1'}]}))
  }

  if (path == '/products' && method == 'POST'){
    const bodyBuffer = []
    let body = null

    // Lendo o corpo da requisição HTTP
    req.on('data', chunk => bodyBuffer.push(chunk))

    // Tratando o fim da leitura do corpo da requisição HTTP
    req.on('end', () => {
      // Convertendo o buffer em string e parseando como JSON
      const bodyString = Buffer.concat(bodyBuffer).toString() 
      body = JSON.parse(bodyString)

      res.writeHead(201, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({message: 'Product created successfully', body}))
    })
    return
  }

  // Retornando 404 para rotas não encontradas
  res.writeHead(404, { 'Content-Type': 'application/json' })
  return res.end(JSON.stringify({message: 'Not Found'}))


})

// Iniciando o servidor na porta 8080
server.listen(8080, () => {
  console.log('Server running on port 8080')
})

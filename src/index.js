import http from 'node:http' 

// Extraindo as variáveis de ambiente para configuração do servidor HTTP
const {API_HOST, API_PORT, API_PROTOCOL} = process.env

const posts = []

// Criando o servidor HTTP que responde com "Hello world"
const server = http.createServer((req, res) => {
  
  // Extraindo informações da requisição HTTP
  const {url, method} = req
  // Separando o caminho e os parâmetros da URL
  const paths = url.split('?').filter(Boolean)
  const path = paths.at(0) || '/'
  // Extraindo os parâmetros da URL
  // Cada parâmetro é um par chave-valor separado por '='
  const params = url.split('?')[1]?.split('&').map(param => param.split('='))


  // Roteamento básico de get e post para /products
  if (path == '/posts' && method == 'GET'){
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({data: posts}))
  }

  if (path == '/posts' && method == 'POST'){
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
      return res.end(JSON.stringify({message: 'Post created successfully', body}))
    })
    return
  }

  // Retornando 404 para rotas não encontradas
  res.writeHead(404, { 'Content-Type': 'application/json' })
  return res.end(JSON.stringify({message: 'Not Found'}))


})

// Iniciando o servidor na porta definida nas variáveis de ambiente
server.listen(API_PORT, () => {
  console.log(`Server running on ${API_PROTOCOL}://${API_HOST}:${API_PORT}`)
  console.log('Press Ctrl+C to stop the server')
})

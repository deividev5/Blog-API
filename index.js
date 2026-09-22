import http from 'node:http' 

// Criando o servidor HTTP que responde com "Hello world"
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ message: 'Hello world' }))
})

// Iniciando o servidor na porta 8080
server.listen(8080, () => {
  console.log('Server running on port 8080')
})

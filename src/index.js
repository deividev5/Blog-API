import http from 'node:http' 
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { mastra } from './mastra/index.js'

// Extraindo as variáveis de ambiente para configuração do servidor HTTP
const {API_HOST, API_PORT, API_PROTOCOL} = process.env

// Schema do post gerado pelo agente de IA
const postSchema = z.object({
  titulo: z.string(),
  content: z.string(),
})

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

  if (path == '/posts/draft' && method == 'POST'){
    const bodyBuffer = []
    let body = null

    // Lendo o corpo da requisição HTTP
    req.on('data', chunk => bodyBuffer.push(chunk))

    // Tratando o fim da leitura do corpo da requisição HTTP
    req.on('end', async () => {
      // Convertendo o buffer em string e parseando como JSON
      const bodyString = Buffer.concat(bodyBuffer).toString() 
      body = JSON.parse(bodyString)

      try {
        const postAgent = mastra.getAgentById('post-agent')

        // Gera título e conteúdo (markdown) a partir da ideia usando o agente de IA
        const { object } = await postAgent.generate(
          `Crie um post de blog a partir da seguinte ideia: ${body.ideia}`,
          { structuredOutput: { schema: postSchema } }
        )

        const post = {
          id: nanoid(),
          titulo: object.titulo,
          content: object.content,
          published_at: null,
          created_at: new Date(),
          approved_at: null,
          rejected_at: null,
        }

        posts.push(post)

        res.writeHead(201, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({message: 'Post created successfully', post}))
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({message: 'Failed to generate post', error: error.message}))
      }
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

import pg from 'pg'
import Postgrator from 'postgrator'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const { Pool, Client } = pg

const __dirname = dirname(fileURLToPath(import.meta.url))

const { DATABASE_URL } = process.env

// Configuração da conexão com o banco de dados PostgreSQL usando a URL definida nas variáveis de ambiente
export const pool = new Pool({
  connectionString: DATABASE_URL,
})

// Aplica as migrations pendentes em src/db/migrations para manter o schema do banco atualizado
export async function runMigrations() {
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()

  try {
    const postgrator = new Postgrator({
      migrationPattern: join(__dirname, 'migrations', '*'),
      driver: 'pg',
      database: new URL(DATABASE_URL).pathname.slice(1),
      schemaTable: 'schemaversion',
      execQuery: (query) => client.query(query),
    })

    return await postgrator.migrate()
  } finally {
    await client.end()
  }
}

const { DATABASE_URL } = process.env

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL não definida. Rode `npm run env:setup` e configure o .env.local')
}

const { hostname, port, pathname, username, password } = new URL(DATABASE_URL)

// Config do postgrator-cli lida a partir da DATABASE_URL usada pelo resto da aplicação
module.exports = {
  migrationPattern: 'src/db/migrations/*',
  driver: 'pg',
  host: hostname,
  port: Number(port) || 5432,
  database: pathname.slice(1),
  username: decodeURIComponent(username),
  password: decodeURIComponent(password),
  schemaTable: 'schemaversion',
}

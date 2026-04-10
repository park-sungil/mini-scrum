const oracledb = require('oracledb')

// Use Thick mode (requires Oracle Instant Client)
oracledb.initOracleClient()

let pool

async function initialize() {
  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
  })
  console.log('Oracle DB pool created')
}

async function close() {
  if (pool) {
    await pool.close(0)
    console.log('Oracle DB pool closed')
  }
}

async function execute(sql, binds = [], opts = {}) {
  const conn = await pool.getConnection()
  try {
    const result = await conn.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...opts,
    })
    return result
  } finally {
    await conn.close()
  }
}

module.exports = { initialize, close, execute }

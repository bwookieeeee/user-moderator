const { user, host, database, password, port } =
  require("./config.json").database;

const Pool = require("pg").Pool;

const pool = new Pool({
  host: host,
  port: port,
  user: user,
  password: password,
  database: database
});

/**
 * @typedef DbUser
 * @property {string} id
 * @property {string} username
 * @property {string[]} ips
 * @property {boolean} banned
 */

/**
 * @typedef DbIp
 * @property {string} ip
 * @property {boolean} banned
 */

/**
 * get a user from the database by username
 * @param {string} username
 * @returns {DbUser | undefined | Error} user object if found, undefined if not found, err otherwise
 */
module.exports.getUser = async username => {
  try {
    const res = await pool.query("SELECT * FROM users WHERE username=$1", [
      username
    ]);
    return res.rows[0];
  } catch (e) {
    console.error(e);
    return { err: e };
  }
};

/**
 * Gets an ip from the database by ip address
 * @param {string} addr ip address
 * @returns {DbIp | undefined | Error} ip object if found, undefined if not found, err otherwise
 */
module.exports.getIp = async addr => {
  try {
    const res = await pool.query("SELECT * FROM ips WHERE ip=$1", [addr]);
    return res.rows[0];
  } catch (e) {
    console.error(e);
    return { err: e };
  }
};

/**
 *
 * @param {DbUser} user
 * @returns
 */
module.exports.createUser = async user => {
  const { id, username, ips, banned } = user;
  try {
    await pool.query(
      "INSERT INTO users (id, username, ips, banned) VALUES ($1,$2,$3,$4)",
      [id, username, ips, banned]
    );
    return { status: "created" };
  } catch (e) {
    console.error(e);
    return { err: e };
  }
};

module.exports.createIp = async ip => {
  const { addr, banned } = ip;
  try {
    await pool.query("INSERT INTO ips (ip, banned) VALUES ($1,$2)", [
      addr,
      banned
    ]);
    return { status: "created" };
  } catch (e) {
    console.error(e);
    return { err: e };
  }
};

module.exports.updateUser = async user => {
  const existingUser = await this.getUser(user.username);
  const banned = user.banned || existingUser.banned;
  const ips = user.ips || existingUser.ips;

  try {
    await pool.query(
      "UPDATE TABLE users SET (ips, banned) VALUES ($1,$2) WHERE username=$3",
      [ips, banned, user.username]
    );
    return {
      id: existingUser.id,
      username: existingUser.username,
      ips: ips,
      banned: banned
    };
  } catch (e) {
    console.error(e);
    return { err: e };
  }
};

module.exports.updateIp = async ip => {
  try {
    await pool.query("UPDATE TABLE ips SET banned=$1 WHERE ip=$2", [
      ip.banned,
      ip.addr
    ]);
    return ip;
  } catch (e) {
    console.error(e);
    return { err: e };
  }
};

module.exports.queryAlts = async addr => {
  try {
    const res = await pool.query("SELCT * FROM users WHERE $1=ANY(ips)", [
      addr
    ]);
    return res.rows;
  } catch (e) {
    console.error(e);
    return { err: e };
  }
};

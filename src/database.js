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
 * @property {string} username
 * @property {string[]} ips
 * @property {boolean} banned
 * @property {boolean} prejudiced
 */

/**
 * @typedef DbIp
 * @property {string} ip
 * @property {boolean} banned
 * @property {boolean} prejudiced
 */

/**
 * get a user from the database by username
 * @param {string} username
 * @returns {DbUser | undefined | Error} user object if found, undefined if not found, err otherwise
 */
module.exports.getUser = async username => {
  console.log(`get user ${username} from db`);
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
  console.log(`get ip ${addr} from db`);
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
  const { username, ips, banned, prejudiced } = user;
  console.log(
    `create user ${username} w opts {${ips}, ${banned}, ${prejudiced} }`
  );
  try {
    await pool.query(
      "INSERT INTO users (username, ips, banned, prejudiced) VALUES ($1,$2,$3,$4)",
      [username, ips, banned, prejudiced]
    );
    return { status: "created" };
  } catch (e) {
    console.error(e);
    return { err: e };
  }
};

module.exports.createIp = async ip => {
  const { addr, banned, prejudiced } = ip;
  console.log(`create ip ${addr} w opts { ${banned}, ${prejudiced} }`);
  try {
    await pool.query(
      "INSERT INTO ips (ip, banned, prejudiced) VALUES ($1,$2,$3)",
      [addr, banned, prejudiced]
    );
    return { status: "created" };
  } catch (e) {
    console.error(e);
    return { err: e };
  }
};

module.exports.updateUser = async user => {
  const existingUser = await this.getUser(user.username);
  const banned = user.banned !== undefined ? user.banned : existingUser.banned;
  const ips = user.ips || existingUser.ips;
  const prejudiced =
    user.prejudiced !== undefined ? user.prejudiced : existingUser.prejudiced;
  console.log(
    `update user ${user.username} w opts { ${banned}, ${prejudiced}, ${ips} }`
  );

  try {
    await pool.query(
      "UPDATE users SET ips=$1, banned=$2, prejudiced=$3 WHERE username=$4",
      [ips, banned, prejudiced, user.username]
    );
    return {
      username: existingUser.username,
      ips: ips,
      banned: banned,
      prejudiced: prejudiced
    };
  } catch (e) {
    console.error(e);
    return { err: e };
  }
};

module.exports.updateIp = async ip => {
  console.log(`update ip ${ip.addr} w opts { ${ip.banned}, ${ip.prejudiced} }`);
  try {
    await pool.query("UPDATE ips SET banned=$1, prejudiced=$2 WHERE ip=$3", [
      ip.banned,
      ip.prejudiced,
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
    const res = await pool.query("SELECT * FROM users WHERE $1=ANY(ips)", [
      addr
    ]);
    return res.rows;
  } catch (e) {
    console.error(e);
    return { err: e };
  }
};

module.exports.getAllBannedUsers = async () => {
  try {
    const res = await pool.query(
      "SELECT username FROM users WHERE banned=true"
    );
    return res.rows;
  } catch (e) {
    console.error(e);
    return { err: e };
  }
};

module.exports.getAllBannedIps = async () => {
  try {
    const res = await pool.query("SELECT ip FROM ips WHERE banned=true");
    return res.rows;
  } catch (e) {
    console.error(e);
    return { err: e };
  }
};

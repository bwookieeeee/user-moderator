const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, guildId, token } = require("./config.json").discord;

const cmds = [];
const cmdFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of cmdFiles) {
  const cmd = require(`./commands/${file}`);
  cmds.push(cmd.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: cmds })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
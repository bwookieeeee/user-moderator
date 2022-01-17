console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
REMO.TV USER MODERATION
copyright (R) 2022 Brooke Morrison ALL RIGHTS RESERVED
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);

const fs = require("fs");
const { Client, Collection, Intents } = require('discord.js');
const { token, eventChannel, logChannel } = require('./config.json').discord;
const { key, url } = require("./config.json").remo;

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();
const cmdFiles = fs.readdirSync('./commands').filter(file => file.endsWith(".js"));

for (const file of cmdFiles) {
  const cmd = require(`./commands/${file}`);
  // Set a new item in the Collection with the key as the command name and the
  // value as the exported module.
  client.commands.set(cmd.data.name, cmd);
}

client.once('ready', () => {
  console.log('Ready');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  // console.log(interaction);

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  }
  catch (err) {
    console.error(err);
    await interaction.reply({ content: "There was an error while executing this command", ephemeral: true });
  }
});
client.login(token);
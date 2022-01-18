console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
REMO.TV USER MODERATION
copyright (R) 2022 Brooke Morrison ALL RIGHTS RESERVED
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);

const fs = require("fs");
const { Client, Collection, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { token, eventChannelId, logChannelId, testChannelId } = require('./config.json').discord;
const { ws, remoevts } = require("./remo");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();
const cmdFiles = fs.readdirSync('./commands').filter(file => file.endsWith(".js"));

for (const file of cmdFiles) {
  const cmd = require(`./commands/${file}`);
  // Set a new item in the Collection with the key as the command name and the
  // value as the exported module.
  client.commands.set(cmd.data.name, cmd);
}

let state;

let eventChannel;
let logChannel;
let testChannel;

try {
  state = JSON.parse(fs.readFileSync("state.json"));
}
catch (e) {
  state = { users: {} };
}

client.once('ready', async () => {
  console.log('Ready');
  ws.login();
  eventChannel = await client.channels.fetch(eventChannelId);
  logChannel = await client.channels.fetch(logChannelId);
  testChannel = await client.channels.fetch(testChannelId);
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

// Report when a user logs in
remoevts.on("NEW_LOGIN", data => {
  const { username, cores, gpu, userAgent, ip, countryCode, isp, proxy, usernameBanned, ipBanned, width, height, id } = data;
  updateState(data);
  const embed = new MessageEmbed()
    .setColor("#9DFF00")
    .setTitle(username)
    .setURL("https://remo.tv")
    .setDescription(`**Cores:** ${cores}\n**GPU:** ${gpu}`
      + `\n**IP Address:** ${ip}\n**User-Agent:** ${userAgent}\n**Country Code:** ${countryCode}`
      + `\n**ISP:** ${isp}\n**Proxy:** ${proxy}\n**Username Banned:** ${usernameBanned}`
      + `\n**IP Banned:** ${ipBanned}\n**Width:** ${width}\n**Height:** ${height}`)
    .setTimestamp();

  const btns = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId(`${id}_uban`)
        .setLabel("Ban Username")
        .setStyle("PRIMARY"),
      new MessageButton()
        .setCustomId(`${id}_iban`)
        .setLabel("Ban IP Address")
        .setStyle("PRIMARY"),
      new MessageButton()
        .setCustomId(`${id}_pban`)
        .setLabel("Ban user & IP with prejudice")
        .setStyle("PRIMARY"),
      new MessageButton()
        .setCustomId(`${id}_nuke`)
        .setLabel("Nuke")
        .setStyle("DANGER")
        .setDisabled(true)
    );

  testChannel.send({ embeds: [embed], components: [btns] });
});

const updateState = data => {
  const { id, username, ip } = data;
  state.users[id] = {
    userId: id,
    username: username,
    ip: ip
  };

  fs.writeFileSync("state.json", JSON.stringify(state));
};

client.login(token);
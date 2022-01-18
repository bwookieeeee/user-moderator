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
  if (interaction.isCommand()) {
    // console.log(interaction);
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
    try {
      const response = await cmd.execute(interaction);
      switch (response.action) {
        case "ban": 
          await sendBannedMessage(response.actioner, response.target, true);
      }
    }
    catch (err) {
      console.error(err);
      await interaction.reply({ content: "There was an error while executing this command", ephemeral: true });
    }
  }
  else if (interaction.isButton()) {
    const cmd = interaction.customId.split('_');
    switch (cmd[1]) {
      case "uban":
        // Username ban

        break;
      case "iban":
        // IP ban
        break;
      case "pban":
        // Prejudiced ban
        break;
      case "nuke":
        // Nuke
        break;
      default:
        await interaction.reply("Unknown button command...");
    }
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
        .setDisabled(true) // These will be enabled when they are implemented.
        .setStyle("PRIMARY"),
      new MessageButton()
        .setCustomId(`${id}_iban`)
        .setLabel("Ban IP Address")
        .setDisabled(true) // These will be enabled when they are implemented.
        .setStyle("PRIMARY"),
      new MessageButton()
        .setCustomId(`${id}_pban`)
        .setLabel("Ban user & IP with prejudice")
        .setDisabled(true) // These will be enabled when they are implemented.
        .setStyle("PRIMARY"),
      new MessageButton()
        .setCustomId(`${id}_nuke`)
        .setLabel("Nuke")
        .setStyle("DANGER")
        .setDisabled(true) // These will be enabled when they are implemented.
    );

  testChannel.send({ embeds: [embed], components: [btns] });
});

const sendBannedMessage = async (actioner, target, banned = true, prejudiced = false) => {
  const isIp = target.indexOf(".") >= 0;
  const title = `${isIp ? "IP Address" : "Username"} ${banned ? "Banned" : "Unbanned"} ${prejudiced ? "with prejudice" : ""}`;
  const color = banned ? "#c93006" : "#06c0c9";

  const embed = new MessageEmbed()
    .setTitle(title)
    .setColor(color)
    .setDescription(`${target} ${banned ? "" : "un"}banned by ${actioner}`)
    .setTimestamp();

  await testChannel.send({ embeds: [embed]});


}

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
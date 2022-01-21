console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
REMO.TV USER MODERATION
copyright (R) 2022 Brooke Morrison ALL RIGHTS RESERVED
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);

const fs = require("fs");
const {
  Client,
  Collection,
  Intents,
  MessageEmbed,
  MessageActionRow,
  MessageButton
} = require("discord.js");
const { token, eventChannelId, logChannelId } =
  require("./config.json").discord;
const { ws, remoevts } = require("./remo");
const database = require("./database");

// Discord branded colors, see https://discord.com/branding
const colors = {
  blurple: "#5865f2",
  green: "#57f287",
  yellow: "#fee75c",
  fuchsia: "#eb459e",
  red: "#ed4245",
  white: "#ffffff",
  black: "#000000"
};

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();
const cmdFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of cmdFiles) {
  const cmd = require(`./commands/${file}`);
  // Set a new item in the Collection with the key as the command name and the
  // value as the exported module.
  client.commands.set(cmd.data.name, cmd);
}

let state;

let eventChannel;
let logChannel;

try {
  state = JSON.parse(fs.readFileSync("state.json"));
} catch (e) {
  state = { users: {} };
}

client.once("ready", async () => {
  console.log("Ready");
  ws.login();
  eventChannel = await client.channels.fetch(eventChannelId);
  logChannel = await client.channels.fetch(logChannelId);
});

client.on("interactionCreate", async interaction => {
  if (interaction.isCommand()) {
    // console.log(interaction);
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
    try {
      const response = await cmd.execute(interaction);
      switch (response.action) {
        case "ban":
          await banViaDiscord(
            response.target,
            response.actioner,
            true,
            response.prejudiced
          );
          break;
        case "unban":
          await banViaDiscord(response.target, response.actioner, false, false);
          break;
        case "massban":
          await sendMassBanMessage(
            response.actioner,
            response.target,
            response.count
          );
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: "There was an error while executing this command",
        ephemeral: true
      });
    }
  } else if (interaction.isButton()) {
    const cmd = interaction.customId.split("_");
    switch (cmd[1]) {
      case "uban":
        // Username ban
        await banViaDiscord(state.users[cmd[0]].username, interaction.user);
        await interaction.reply({
          content: `Banned ${state.users[cmd[0]].username}`,
          ephemeral: true
        });
        break;
      case "iban":
        // IP ban
        await banViaDiscord(state.users[cmd[0]].ip, interaction.user);
        await interaction.reply({
          content: `Banned ${state.users[cmd[0]].ip}`,
          ephemeral: true
        });
        break;
      case "pban":
        // Prejudiced ban
        await banViaDiscord(
          state.users[cmd[0]].username,
          interaction.user,
          true,
          true
        );
        await banViaDiscord(
          state.users[cmd[0]].ip,
          interaction.user,
          true,
          true
        );
        await interaction.reply({
          content: `Banned ${state.users[cmd[0]].username} & IP with prejudice`,
          ephemeral: true
        });
        break;
      case "nuke":
        // Nuke
        break;
      default:
        await interaction.reply("Unknown button command...");
    }
  }
});

const reportBannedAlts = async target => {
  // do 3 rounds of nested IP searches
  let foundUsers = [];
  let newUsers = [];
  let bannedIps = [];

  const mainUser = await database.getUser(target);
  for (let ip of mainUser.ips) {
    let alts = await database.queryAlts(ip);

    foundUsers.push(...alts);

    for (let foundUser of foundUsers) {
      for (let tmpIp of foundUser.ips) {
        const ip = await database.getIp(tmpIp);
        if (ip.banned) bannedIps.push(ip.ip);
        newUsers.push(...(await database.queryAlts(tmpIp)));
      }
    }
  }
  // foundUsers = newUsers.map(e => e.username);
  foundUsers = [...new Set(foundUsers)];
  foundUsers.splice(foundUsers.indexOf(mainUser), 1);

  if (foundUsers.length > 0) {
    let desc = "";
    for (let usr of foundUsers) {
      desc += `${usr.banned ? "**" : ""}${usr.prejudiced ? "*" : ""}${
        usr.username
      }${usr.banned ? "**" : ""}${usr.prejudiced ? "*" : ""}\n`;
    }

    if (bannedIps > 0) {
      bannedIps = [...new Set(bannedIps)];
      desc += `And these banned IP addresses:\n${bannedIps.toString()}`;
    }
    const embed = new MessageEmbed()
      .setTitle("Alternate Accounts Discovered")
      .setColor(colors.blurple)
      .setDescription(desc)
      .setTimestamp();

    await eventChannel.send({ embeds: [embed] });
  }
  console.log(
    `${foundUsers.length} alternate accounts discovered for ${target}`
  );
};

// Report when a user logs in
remoevts.on("NEW_LOGIN", async data => {
  const {
    username,
    cores,
    gpu,
    userAgent,
    ip,
    countryCode,
    isp,
    proxy,
    usernameBanned,
    ipBanned,
    width,
    height,
    id,
    isTor
  } = data;
  let embeds = [];
  updateState(data);
  const dbUser = await database.getUser(username);
  embeds.push(
    new MessageEmbed()
      .setColor(colors.green)
      .setTitle(username)
      .setURL("https://remo.tv")
      .setDescription(
        `**Cores:** ${cores}\n**GPU:** ${gpu}` +
          `\n**IP Address:** ${ip}\n**User-Agent:** ${userAgent}\n**Country Code:** ${countryCode}` +
          `\n**ISP:** ${isp}\n**Proxy:** ${proxy}\n**Username Banned:** ${usernameBanned}` +
          `\n**IP Banned:** ${ipBanned}\n**Width:** ${width}\n**Height:** ${height}`
      )
      .setTimestamp()
  );

  const btns = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId(`${id}_uban`)
      .setLabel("Ban Username")
      // .setDisabled(true) // These will be enabled when they are implemented.
      .setStyle("PRIMARY"),
    new MessageButton()
      .setCustomId(`${id}_iban`)
      .setLabel("Ban IP Address")
      // .setDisabled(true) // These will be enabled when they are implemented.
      .setStyle("PRIMARY"),
    new MessageButton()
      .setCustomId(`${id}_pban`)
      .setLabel("Ban user & IP with prejudice")
      // .setDisabled(true) // These will be enabled when they are implemented.
      .setStyle("PRIMARY"),
    new MessageButton()
      .setCustomId(`${id}_nuke`)
      .setLabel("Nuke")
      .setStyle("DANGER")
      .setDisabled(true) // These will be enabled when they are implemented.
  );

  if (isTor) {
    embeds.push(
      new MessageEmbed()
        .setTitle(`Tor Address Discovered`)
        .setDescription("Banning IP address only.")
        .setColor(colors.red)
    )
    await banViaDiscord(ip, client.user);
  }


  if (dbUser === undefined) {
    embeds.push(
      new MessageEmbed()
        .setTitle(`**${username}** is a New Account.`)
        // .setDescription(`**${username}** is a new account.`)
        .setColor(colors.yellow)
    );
    embeds[0].setColor(colors.fuchsia);
    await database.createUser({
      username: username,
      ips: [ip],
      banned: usernameBanned,
      prejudiced: false
    });
  }
  eventChannel.send({ embeds: embeds, components: [btns] });
  // await reportBannedAlts(username);
});

const sendMassBanMessage = async (actioner, target, count) => {
  let targetMessage;
  if (target === "all") targetMessage = "usernames and IP Addresses";
  else if (target === "users") targetMessage = "usernames";
  else targetMessage = "IP Addresses";
  const title = `${target === "all" ? "" : "Special"} Mass Ban Triggered`;
  const message = `${actioner} mass banned ${count} ${targetMessage}`;
  const embed = new MessageEmbed()
    .setTitle(title)
    .setColor(colors.red)
    .setDescription(message)
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
};

const sendBannedMessage = async (
  actioner,
  target,
  banned = true,
  prejudiced = false
) => {
  const isIp = target.indexOf(".") >= 0;
  const title = `${isIp ? "IP Address" : "Username"} ${
    banned ? "Banned" : "Unbanned"
  } ${prejudiced ? "w/ Prejudice" : ""}`;
  const color = banned ? "#c93006" : "#06c0c9";

  const embed = new MessageEmbed()
    .setTitle(title)
    .setColor(colors.red)
    .setDescription(`${target} ${banned ? "" : "un"}banned by ${actioner}`)
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
};

const updateState = data => {
  const { id, username, ip } = data;
  state.users[id] = {
    userId: id,
    username: username,
    ip: ip
  };

  fs.writeFileSync("state.json", JSON.stringify(state));
};

const banViaDiscord = async (
  target,
  actioner,
  banned = true,
  prejudiced = false
) => {
  ws.issueWSBan(target, banned);
  await sendBannedMessage(actioner, target, banned, prejudiced);
  if (target.indexOf(".") >= 0) {
    await database.updateIp({
      addr: target,
      banned: banned,
      prejudiced: prejudiced
    });
  } else {
    await database.updateUser({
      username: target,
      banned: banned,
      prejudiced: prejudiced
    });
  }
};

client.login(token);

/*  Massban - Sends a ban request for every banned username and/or IP address
 *  tracked in the user mod database. This is particularly useful for when remo
 *  falls out of sync, like if it were to restart.
 */

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("massban")
    .setDescription(
      "Sends a ban request to remo for every known banned username and IP address"
    )
    .addStringOption(option =>
      option
        .setName("target")
        .setDescription("Select users or IPs or all to ban. Default all.")
        .setRequired(false)
        .addChoice("users", "users")
        .addChoice("ips", "ips")
        .addChoice("all", "all")
    )
    .setDefaultPermission(false),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getString("target", false)
      ? interaction.options.getString("target")
      : "all";
    console.log(
      `mass ban initiated by ${interaction.user.username} w opts { ${target} }`
    );

    let toBan = [];
    if (target === "users" || target === "all") {
      const bannedUsers = await require("../database").getAllBannedUsers();
      for (let bannedUser of bannedUsers) {
        toBan.push(bannedUser.username);
      }
    }
    if (target === "ips" || target === "all") {
      const bannedIps = await require("../database").getAllBannedIps();
      for (let bannedIp of bannedIps) {
        toBan.push(bannedIp.ip);
      }
    }

    try {
      await interaction.editReply(
        `Banning ${toBan.length} usernames and IP addresses...`
      );
      const ws = require("../remo").ws;
      for (let i = 0; i < toBan.length; i++) {
        ws.issueWSBan(toBan[i]);
      }
      await interaction.followUp({
        content: "Mass ban complete.",
        ephemeral: true
      });
      return { 
        action: "massban",
        actioner: interaction.user,
        target: target,
        count: toBan.length
      }
    } catch (e) {
      await interaction.editReply(
        "Couldn't complete request, please check logs."
      );
    }
  }
};

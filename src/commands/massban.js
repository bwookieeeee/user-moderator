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
    ),
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
      // Pull all banned users from db
      toBan.push();
    }
    if (target === "ips" || target === "all") {
      // Pull all banned IPs from db.
      toBan.push();
    }

    try {
      await interaction.editReply(
        `This isn't implemented yet; but if it were, ${toBan.length} bans would've been sent.`
      );
      // this is where you'd do the banning if that were implemented yet.
    } catch (e) {
      await interaction.editReply(
        "Couldn't complete request, please check logs."
      );
    }
  }
};

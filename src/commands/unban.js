/*  Unban - Sends an unban request for a username or IP and updates its entry in
 *  the user mod database. This will likely call back to an internal command due
 *  to its use with button commands as well.
 */

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Sends an unban request for a user or IP address.")
    .addStringOption(option =>
      option
        .setName("target")
        .setDescription("User or IP to unban")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getString("target");
    console.log(
      `Unban initiated by ${interaction.user.username} w opts { ${target} }`
    );
    await interaction.editReply({
      content: `Unbanned ${target}`,
      ephemeral: true
    });
    return {
      action: "unban",
      actioner: interaction.user,
      target
    };
  }
};

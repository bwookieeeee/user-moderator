/*  Ban - sends a ban request for a username or IP address and tracks it in
 *  the user mod database. An optional flag for prejudiced banning is included.
 *  This will likely call back to an internal command due to its use with
 *  button commands as well.
 */

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription(
      "Sends a ban request for a user or IP address with optional prejudiced flag"
    )
    .addStringOption(option =>
      option
        .setName("target")
        .setDescription("User or IP to ban")
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName("prejudiced")
        .setDescription("To ban with prejudice")
        .setRequired(false)
    )
    .setDefaultPermission(false),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getString("target");
    let prejudiced = interaction.options.getBoolean("prejudiced");
    console.log(
      `Ban initiated by ${interaction.user.username} w opts { ${target}, ${prejudiced} }`
    );
    if (prejudiced == null) prejudiced = false;
    await interaction.editReply({
      content: `Banned ${target} ${prejudiced ? "with prejudice" : ""}`,
      ephemeral: true
    });
    return {
      action: "ban",
      actioner: interaction.user,
      target,
      prejudiced
    };
  }
};

/*  Ban - sends a ban request for a username or IP address and tracks it in
 *  the user mod database. An optional flag for prejudiced banning is included.
 *  This will likely call back to an internal command due to its use with
 *  button commands as well.
 */

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Sends a ban request for a user or IP address with optional prejudiced flag")
    .addStringOption(option => option.setName("target").setDescription("User or IP to ban").setRequired(true))
    .addBooleanOption(option => option.setName("prejudiced").setDescription("To ban with prejudice").setRequired(false)),
  async execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getString("target");
    const prejudiced = interaction.options.getBoolean("prejudiced");
    console.log(`Ban initiated by ${interaction.user.username} w opts { ${target}, ${prejudiced} }`);
    // This is where you would call to the ban handler.
    await interaction.followUp(`This isn't implemented yet.`);
  },
};
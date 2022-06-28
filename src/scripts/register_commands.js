const settings = require("../settings/static.json");

const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const commands = [
	new SlashCommandBuilder().setName("ping").setDescription("Test the bot"),
    new SlashCommandBuilder().setName("debug").setDescription("(Admin) Outputs diagnostic information about the current state of the bot")
        .addNumberOption(option => option
            .setName("start")
            .setDescription("Starting line number")
            .setRequired(false))
        .addNumberOption(option => option
            .setName("end")
            .setDescription("Ending line number")
            .setRequired(false)),
    new SlashCommandBuilder().setName("info").setDescription("Get your 00:00 info or another member's 00:00 info")
        .addMentionableOption(option => option
            .setName("member")
            .setDescription("Member to lookup")
            .setRequired(false)),
    new SlashCommandBuilder().setName("leaderboard").setDescription("Displays the top 5 of 00:00"),
    new SlashCommandBuilder().setName("challenge").setDescription("Initiates a dispute between the last winner of 00:00 and yourself"),
    new SlashCommandBuilder().setName("register").setDescription("Registers the current guild as a player of 00:00")

].map(command => command.toJSON());

const rest = new REST({ version: "9" }).setToken(settings.bot_token);

rest.put(Routes.applicationGuildCommands(settings.client_id, "955906549971296266"), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
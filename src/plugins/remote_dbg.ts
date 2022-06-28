/**
 * Remote Debug (DBG) by Querty OSS
 * (C) a4004 2022
 * https://github.com/a4004/querty
 */

import { Client, CommandInteraction } from "discord.js";
import { DebugHelper, LogLevel } from "../modules/debug_helper";
import { DiscordDAL } from "../modules/discord_dal";
import { QuertyPluginBase } from "../template/component_base";
import settings from "../settings/static.json";

const COLOUR_INTERACT       = '#00ff33';
const COLOUR_ERROR          = '#ff0000';

/**
 * Provides remote debugging ability over Discord.
 */
export class RemoteDBG extends QuertyPluginBase {
    debug: DebugHelper;
    dclient: Client;
    ddal: DiscordDAL;

    constructor(helper: DebugHelper, client: Client, dal: DiscordDAL) {
        super("RemoteDBG", "Beta");
        this.debug = helper;
        this.dclient = client;
        this.ddal = dal;
    }

    /** 
     * Command handler for `debug` command. 
     */
    async debugCommand(interaction: CommandInteraction): Promise<void> {
        if (interaction.commandName != "debug") {
            return;
        }

        this.debug.Log(this.pluginName, "Interaction is command: debugCommand", LogLevel.Info);

        try {              
            let end: number = interaction.options.getNumber("end", false) ?? this.debug.debugHistory.length;
            let start: number = interaction.options.getNumber("start", false) ?? Math.max(end - 10, 0);
            
            if (settings.admins.findIndex(id => id == interaction.user.id) === -1) {
                throw "You are not authorised to receive diagnostic information.";
            } if (end <= start) {
                throw "Ending line number must be greater than starting line number.";
            }

            let output: string = "```" + this.debug.debugHistory.slice(start, end).join('\n') + "```";
            await interaction.reply( { ephemeral: true, embeds: [this.ddal.createEmbed(COLOUR_INTERACT, `Debug Console: Lines ${start}-${end}`, output, "RemoteDBG by Querty OSS")] });
        } catch (e) {
            this.debug.Log(this.pluginName, `Failed to send debug content: ${e}`, LogLevel.Critical);
            await interaction.reply( { embeds: [this.ddal.createEmbed(COLOUR_ERROR, ":x: Failed to send diagnostic info", `The error message reads: \`${e}\``, "RemoteDBG by Querty OSS")] });
        }
    }

    /**
     * Command handler for `ping` command.
     */
    async pingCommand(interaction: CommandInteraction): Promise<void> {
        if (interaction.commandName != "ping") {
            return;
        }

        this.debug.Log(this.pluginName, "Interaction is command: pingCommand", LogLevel.Info);

        await interaction.reply({embeds: [this.ddal.createEmbed(COLOUR_INTERACT, ":wave: Hello!", `:globe_with_meridians: Discord API Latency: **${this.dclient.ws.ping}**ms`)]});
    }

    init(): void {
        this.dclient.on("interactionCreate", async (interaction) => {
            if (!interaction.isCommand()) {
                this.debug.Log(this.pluginName, "Interaction is not a command, exiting...", LogLevel.None);
                return;
            }

            this.debugCommand(interaction);
            this.pingCommand(interaction);
        });
    }
}
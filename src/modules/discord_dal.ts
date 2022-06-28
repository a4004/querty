/**
 * Discord Developer Abstraction Layer by Querty OSS
 * (C) a4004 2022
 * https://github.com/a4004/querty
 */

import { QuertyModuleBase } from "../template/component_base";
import { DebugHelper } from "./debug_helper";
import { Client, Intents, MessageEmbed, ClientOptions } from "discord.js";

/**
 * Provides an abstraction layer to many of Discord.js functions for speedier development.
 */
export class DiscordDAL extends QuertyModuleBase {
    constructor (helper: DebugHelper) {
        super("Querty OSS Discord DAL", "Beta", helper);
    }
    
    /**
     * Creates a simple embed object to send in a Discord text channel.
     * @param color Colour of the embed. e.g. `#00ff00` for a green line.
     * @param title Large text of the embed.
     * @param content Small text of the embed.
     * @param source (*Optional*) `pluginName` or `moduleName` that is inserted into the footer to offer plugin credit in chat.
     * @returns `MessageEmbed` object that can be used in conjunction with `{embeds:[embed]}` to send a message in a given text channel.
     */
    createEmbed(color: string, title: string, content: string, source?: string): MessageEmbed {
        return new MessageEmbed().setColor(color as any).setTitle(title).setDescription(content).setTimestamp().setFooter({text: source ?? "Querty OSS"});
    }
}
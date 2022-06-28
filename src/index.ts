import { DebugHelper, LogLevel } from "./modules/debug_helper";
import { PluginLoader } from "./modules/plugin_loader";
import path from "path";
import settings from "./settings/static.json";
import { Client, Intents, MessageEmbed, ClientOptions, Channel, TextChannel } from "discord.js";
import { DiscordDAL } from "./modules/discord_dal";
import "colors";
import { ZeroZero } from "./plugins/zerozero";
import { RemoteDBG } from "./plugins/remote_dbg";

const COLOUR_ERROR          = '#ff0000';

/**
 * Main app module.
 */
class Main implements QuertyModule {
    moduleName: string = "Main";
    version: string = "Beta";
    /**
     * `DebugHelper` instance.
     */
    debug: DebugHelper = new DebugHelper();
    /**
     * `PluginLoader` instance.
     */
    plugins: PluginLoader = new PluginLoader(this.debug);

    /**
     * `DiscordClient` instance.
     */
    dclient: Client = new Client( { intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_TYPING, 
        Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_INTEGRATIONS,
        Intents.FLAGS.GUILD_INVITES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_SCHEDULED_EVENTS, Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_WEBHOOKS] 
    });
    /**
     * `DiscordDAL` "Developer Abstraction Layer" instance.
     */
    ddal: DiscordDAL = new DiscordDAL(this.debug);

    /**
     * Loads and activates dynamic JavaScript plugins in the specified directory.
     * @param pluginPath Path where JavaScript plugins are located.
     */
    loadPluginsDynamic(pluginPath: string): void {
        let externalPluginFolder: string = path.join(__dirname, pluginPath);
        this.plugins.discoverPlugins(externalPluginFolder).then(items => 
            items.forEach(plugin => this.plugins.initPlugin(path.join(externalPluginFolder, plugin as string), this)));
    }

    /**
     * Initialises the Discord client and logs into the bot account.
     */
    discordClientSetup(): void {
        this.debug.Log(this.moduleName, "Connecting to Discord", LogLevel.None);
        this.dclient.once("ready", () => this.debug.Log(this.moduleName, `Discord client with ID "${settings.client_id}" is online & ready.`, LogLevel.Success));
        this.dclient.login(settings.bot_token).then(() => this.debug.Log(this.moduleName, `Discord client with ID "${settings.client_id}" logged in.`, LogLevel.Success))
            .catch(err => this.debug.Log(this.moduleName, `Failed to conenct to Discord, client ID "${settings.client_id}" not logged in. Reason: ${err}`, LogLevel.Critical));
    }

    /**
     * Entry point.
     */
    main(): void {
        this.debug.Log(this.moduleName, `${this.moduleName} module started. ${this.version}`, LogLevel.Info);
        this.discordClientSetup();
        this.loadPluginsDynamic("./external_plugins");

        new ZeroZero(this.debug, this.dclient, this.ddal).init();
        new RemoteDBG(this.debug, this.dclient, this.ddal).init();
    }
}

process.on("uncaughtException", (error) => {
    console.error(`\nfrom Main\t[ ${new Date().toUTCString().bgBlack}]\t${(`Uncaught Exception Captured! =>\n\t${error}\n\n`).red}`);
});

new Main().main();
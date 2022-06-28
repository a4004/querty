/**
 * ZeroZero Plugin by Querty OSS
 * (C) a4004 2022
 * https://github.com/a4004/querty
 */

import { DebugHelper, LogLevel } from "../modules/debug_helper";
import { QuertyPluginBase } from "../template/component_base";
import fs from "fs";
import path from "path";
import zerozero from "../settings/zerozero.json";
import { ButtonInteraction, Client, CommandInteraction, Emoji, Guild, GuildMember, MessageActionRow, MessageButton, MessageEmbed, Modal, ModalActionRowComponent, ModalSubmitInteraction, TextInputComponent, User } from "discord.js";
import { DiscordDAL } from "../modules/discord_dal";

const DEBUG_MODE: boolean   = true;
const COLOUR_INTERACT       = '#00ff33';
const COLOUR_SECONDARY      = '#00aaff';
const COLOUR_WIN            = '#eeee00';
const COLOUR_NEGATIVE       = '#ff00ff';
const COLOUR_POSITIVE       = '#00ff00';
const COLOUR_DEFAULT        = '#ffffff';
const COLOUR_ERROR          = '#ff0000';

export class ZeroZero extends QuertyPluginBase {
    debug: DebugHelper;
    dclient: Client;
    ddal: DiscordDAL;
    config_lock: boolean = false;
    defendant: string = "";
    claimant: string = "";
    claim_reason: string = "";
    replied: boolean = false;
    counter_claim: string = "";
    dispute_lock: boolean = false;

    constructor(helper: DebugHelper, client: Client, dal: DiscordDAL) {
        super("ZeroZero", "Beta");
        this.debug = helper;
        this.dclient = client;
        this.ddal = dal;
    }

    /**
     * Generates a POSIX/NT filesystem-compliant timestamp string.
     * @returns POSIX/NT compliant filename time snippet string.
     */
    getTimeInFileFriendlyFormat(): string {
        let current_time = new Date();
        let yyyy = current_time.getUTCFullYear();
        let MM = current_time.getUTCMonth();
        let dd = current_time.getUTCDay();
        let HH = current_time.getUTCHours();
        let mm = current_time.getUTCMinutes();
        let ss = current_time.getUTCSeconds();
        let Z = current_time.getUTCMilliseconds();

        return `D${yyyy}-${MM}-${dd}-T${HH}-${mm}-${ss}-${Z}_UTC`;
    }

    /**
     * Creates a named backup of the current state of the dynamic store on the filesystem.
     */
    createBackupStore(): void {
        while(this.config_lock);
        this.config_lock = true;
        this.debug.Log(this.pluginName, "Creating backup of zerozero dynamic store.", LogLevel.Info);
        let current_data: string = fs.readFileSync(path.join(__dirname, "../settings/zerozero.json"), { encoding: "utf-8"} );
        fs.writeFileSync(path.join(__dirname, `../settings/zerozero.backup${this.getTimeInFileFriendlyFormat()}.json`), current_data, { encoding: "utf-8" } );
        this.config_lock = false;
    }

    /**
     * Saves the current state of the dynamic store to the filesystem.
     */
    saveCurrentStore(): void {
        while(this.config_lock);
        this.config_lock = true;
        fs.writeFileSync(path.join(__dirname, `../settings/zerozero.json`), JSON.stringify(zerozero, null, 4), { encoding: "utf-8" } );
        this.config_lock = false;
    }

    /**
     * array.sort() function to sort values according to 00:00 rank algorithm.
     */
    rankElementsFunction(item_a: any, item_b: any): number {
        return (item_b["points"] - item_b["misses"] > item_a["points"] - item_a["misses"]) ? 1 : ((item_b["points"] - item_b["misses"] < item_a["points"] - item_a["misses"]) ? -1 : 0);
    }

    /**
     * Converts an integer into a number string constructed from Discord emoji.
     * @param integer Number
     * @returns Discord emoji string contianing the number.
     */
    toEmojiNumber(integer: number): string {
        const numbers = [":zero:", ":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:"];
        let result: string = "";
        let string_number = integer.toString();
        let i = 0;

        for (i; i < string_number.length; i++) {
            result = result.concat(numbers[Number(string_number[i])]);
        }
        
        return result;
    }

    /**
     * Updates zerozero database with new user data.
     * @param d_points Points added (if removed use negative number)
     * @param d_misses Misses added
     * @param d_cooldown Cooldowns added
     * @param d_history History entry added (if none, set to null)
     * @param d_cwon Challenges won added
     * @param d_clost Challenges lost added
     * @param d_cstale Challenges staled added
     */
    updateUserData(guild_id: string, user_id: string, d_points: number, d_misses: number, d_cooldown: number, d_history: string | null,
         d_cwon: number, d_clost: number, d_cstale: number): void {
            this.createBackupStore();
            zerozero.guilds.forEach(guild => {
                if (guild.guild_id != guild_id) return;
                if (guild.bucket.data.findIndex(user => user.user_id === user_id) == -1) {
                    guild.bucket.data.push(
                        {
                            user_id: user_id,
                            points: d_points,
                            misses: d_misses,
                            cooldown: d_cooldown,
                            history: [d_history ?? "Never"],
                            challenges: {
                                won: d_cwon,
                                lost: d_clost,
                                stale: d_cstale
                            }
                        }
                    );
                } else {
                    guild.bucket.data.forEach(user => {
                        if (user.user_id != user_id) return;
                        user.points += d_points;
                        user.misses += d_misses;
                        user.cooldown += d_cooldown;
                        if (d_history != null)
                            user.history.push(d_history);
                        user.challenges.won += d_cwon;
                        user.challenges.lost += d_clost;
                        user.challenges.stale += d_cstale;
                    });
                }
                guild.bucket.data.sort(this.rankElementsFunction);
            });
            this.saveCurrentStore();
    }

    /**
     * Button response handler.
     */
    async counterDisputeButtonResponse(interaction: ButtonInteraction): Promise<void> {
        this.debug.Log(this.pluginName, "Responding to button", LogLevel.Info);
        let claimant_user = await this.dclient.users.fetch(this.claimant);
        let defendant_user = await this.dclient.users.fetch(this.defendant);

        if (interaction.user.id != this.defendant) {
            this.debug.Log(this.pluginName, "Invalid user responded to button, replying with error.", LogLevel.None);
            await interaction.reply( { ephemeral: true, embeds: [this.ddal.createEmbed(COLOUR_ERROR, ":no_entry: You can't do that!",
                `The interaction is only meant to be used by <@${this.defendant}>.`, "00:00 by Querty OSS")]})
            return;
        }
        if (this.replied) {
            this.debug.Log(this.pluginName, "User already replied", LogLevel.None);
            await interaction.reply( { ephemeral: true, embeds: [this.ddal.createEmbed(COLOUR_ERROR, ":speech_balloon: You've already replied.",
                "Sorry but you can't make a change once you've submitted your response.", "00:00 by Querty OSS")]})
            return;
        }

        this.debug.Log(this.pluginName, "Processing button response", LogLevel.None);

        if (interaction.customId == "reply_give_up") {
            this.replied = true;
            this.debug.Log(this.pluginName, "User given up", LogLevel.None);
            await interaction.reply( { embeds: [this.ddal.createEmbed(COLOUR_NEGATIVE, `:crossed_swords: **${claimant_user.username}** has won the dispute!`,
                `The defendant, <@${defendant_user.id}> has pleaded guilty so has been deducted 1 point but NO compensation will be awarded to the claimant.`,
                "00:00 by Querty OSS")]} );
            this.dispute_lock = false;

            this.updateUserData(interaction.guildId as string, this.defendant, -1, 0, 0, null, 0, 1, 0);
            return;
        } 

        this.debug.Log(this.pluginName, "User is fighting the dispute. Continuing...", LogLevel.None);

        const modal = new Modal().setCustomId("dispute_modal")
            .setTitle("Defend your Case");
        const reason_txt = new TextInputComponent().setCustomId("dispute_reason")
            .setLabel("Why is your win legitimate?")
            .setStyle("PARAGRAPH")
            .setMaxLength(128)
            .setRequired(true)
            .setPlaceholder("e.g. You are a fast typer and/or you were accurately observing the time")

        const row_component = new MessageActionRow<ModalActionRowComponent>().addComponents(reason_txt);
        modal.addComponents(row_component);
        
        await interaction.showModal(modal);
    }

    /**
     * Modal response handler.
     */
    async challengeModalResponse(interaction: ModalSubmitInteraction): Promise<void> {
        if (interaction.customId == "challenge_request_modal") {
            this.dispute_lock = true;
            this.replied = false;
            this.claim_reason = interaction.fields.getTextInputValue("challenge_reason");
            this.debug.Log(this.pluginName, "Responding to modal dialogue", LogLevel.Info);
    
            await interaction.reply( { ephemeral: true, embeds: [this.ddal.createEmbed(COLOUR_INTERACT, ":white_check_mark: Dispute submitted",
                 "The other party will be notified and will be able to make a counter argument before voting begins.", "00:00 by Querty OSS")]});
    
            let embed = this.ddal.createEmbed(COLOUR_INTERACT, ":scales: Make your counter claim before it's too late!",
                 "If you don't make a counter claim within 5 minutes, the claimant will automatically win.", "00:00 by Querty OSS");
            let row = new MessageActionRow().addComponents(new MessageButton()
                        .setCustomId("reply_counter_claim")
                        .setStyle("PRIMARY")
                        .setEmoji("✅")
                        .setLabel("Dispute Claim"))
                        .addComponents(new MessageButton()
                        .setCustomId("reply_give_up")
                        .setStyle("SECONDARY")
                        .setEmoji("❌")
                        .setLabel("Plead Guilty"));

            await interaction.followUp( { components: [row], embeds: [embed], content: `<@${this.defendant}>, <@${this.claimant}> has started a dispute with you!` })

            setTimeout(async () => {
                if (this.replied) {
                    return;
                }
                if (interaction.channel != null) {
                    let claimant_user = await this.dclient.users.fetch(this.claimant);
                    let defendant_user = await this.dclient.users.fetch(this.defendant);
                    await interaction.channel.send( { embeds: [this.ddal.createEmbed(COLOUR_NEGATIVE, `:crossed_swords: **${claimant_user.username}** has won the dispute!`,
                    `The defendant, <@${this.defendant}> has not responded to the dispute so has been deducted 1 point and has incurred a 3-night cooldown but NO compensation will be awarded to the claimant. `,
                    "00:00 by Querty OSS")]} );
                    this.dispute_lock = false;

                    this.updateUserData(interaction.guildId as string, this.defendant, -1, 0, 3, null, 0, 1, 0);
                    setTimeout(() => {
                        this.updateUserData(interaction.guildId as string, this.defendant, 0, 0, -1, null, 0, 0, 0);
                    }, 86400000); 
                    setTimeout(() => {
                        this.updateUserData(interaction.guildId as string, this.defendant, 0, 0, -1, null, 0, 0, 0);
                    }, 172800000); 
                    setTimeout(() => {
                        this.updateUserData(interaction.guildId as string, this.defendant, 0, 0, -1, null, 0, 0, 0);
                    }, 259200000); 
                }
            }, 300000);

        } else if (interaction.customId == "dispute_modal") {
            this.counter_claim = interaction.fields.getTextInputValue("dispute_reason");
            let claimant_user = await this.dclient.users.fetch(this.claimant);
            let defendant_user = await this.dclient.users.fetch(this.defendant);
            this.replied = true;
            await interaction.reply( { ephemeral: true, embeds: [this.ddal.createEmbed(COLOUR_INTERACT, ":white_check_mark: Dispute submitted",
                "A vote will commence now. Good luck.", "00:00 by Querty OSS")]});

            if (interaction.channel != null) {
                let embed = this.ddal.createEmbed(COLOUR_INTERACT, ":fire: The dispute has commenced!",
                    `Vote now in the next 60 seconds to reach a final verdict. Vote with :crossed_swords: to vote for <@${this.claimant}> and vote :shield: for <@${this.defendant}>.`);
           
                embed.addField(`Claimant, ${claimant_user.username} says:`, `*"${this.claim_reason}"*`);
                embed.addField(`Defendant, ${defendant_user.username} says:`, `*"${this.counter_claim}"*`);

                let message = await interaction.channel.send( { embeds: [embed] });

                await message.react("⚔️");
                await message.react("🛡️");

                setTimeout(async () => {
                    await message.channel.send({embeds: [this.ddal.createEmbed(COLOUR_SECONDARY,
                        ':clock1230: **The clock is ticking!**', ':three::zero: seconds left!')]});
                }, 30000);
                setTimeout(async () => {
                    await message.channel.send({embeds: [this.ddal.createEmbed(COLOUR_SECONDARY,
                        ':one::zero: **seconds left!**', 'Vote now if you haven\'t already!')]});
                }, 50000);
                setTimeout(async () => {
                    await message.channel.send({embeds: [this.ddal.createEmbed(COLOUR_SECONDARY,
                        '::drum: **Vote closing!**', 'Results will be displayed now. :arrow_down:')]});
                }, 59000);
                setTimeout(async () => {
                    const claim = (message.reactions.cache.get('⚔️')?.count ?? 1) - 1;
                    const defend = (message.reactions.cache.get('🛡️')?.count ?? 1)- 1;

                    let embed = new MessageEmbed().setTimestamp().setFooter("00:00 by Querty OSS");
                    embed.addField(`:crossed_swords: Votes in favour of **${claimant_user.username}**`, `${claim}`);
                    embed.addField(`:shield: Votes in favour of **${defendant_user.username}**`, `${defend}`);

                    this.createBackupStore();

                    if (claim > defend) {
                        embed.setColor(COLOUR_NEGATIVE);
                        embed.setTitle(`:crossed_swords: **${claimant_user.username}** has won the dispute!`);
                        embed.setDescription(`The defendant, <@${defendant_user.id}> has lost the dispute and has been deducted 1 point alongside a cooldown of 3 nights. The claimant has been compensated.`);
                        
                        this.updateUserData(interaction.guildId as string, this.defendant, -1, 0, 3, null, 0, 1, 0);

                        setTimeout(() => {
                            this.updateUserData(interaction.guildId as string, this.defendant, 0, 0, -1, null, 0, 0, 0);
                        }, 86400000); 
                        setTimeout(() => {
                            this.updateUserData(interaction.guildId as string, this.defendant, 0, 0, -1, null, 0, 0, 0);
                        }, 172800000); 
                        setTimeout(() => {
                            this.updateUserData(interaction.guildId as string, this.defendant, 0, 0, -1, null, 0, 0, 0);
                        }, 259200000); 

                        this.updateUserData(interaction.guildId as string, this.claimant, 1, 0, 0, null, 1, 0, 0);
                
                    } else if (claim < defend) {
                        embed.setColor(COLOUR_POSITIVE);
                        embed.setTitle(`:shield: **${defendant_user.username}** has won the dispute!`);
                        embed.setDescription(`The claimant, <@${claimant_user.id}> has lost the dispute and has been deducted 1 point alongside a cooldown of 3 nights. The defendant will be compensated.`);
                       
                        this.updateUserData(interaction.guildId as string, this.claimant, -1, 0, 3, null, 0, 1, 0);

                        setTimeout(() => {
                            this.updateUserData(interaction.guildId as string, this.claimant, 0, 0, -1, null, 0, 0, 0);
                        }, 86400000); 
                        setTimeout(() => {
                            this.updateUserData(interaction.guildId as string, this.claimant, 0, 0, -1, null, 0, 0, 0);
                        }, 172800000); 
                        setTimeout(() => {
                            this.updateUserData(interaction.guildId as string, this.claimant, 0, 0, -1, null, 0, 0, 0);
                        }, 259200000); 

                        this.updateUserData(interaction.guildId as string, this.defendant, 1, 0, 0, null, 1, 0, 0);
                    
                    } else {
                        embed.setColor(COLOUR_SECONDARY);
                        embed.setTitle(`:bread: Vote is stale!`);
                        embed.setDescription("A verdict could not be decided so the case is dismissed. The defendant does not incur any penalties nor is the claimant compensated.");
                       
                        this.updateUserData(interaction.guildId as string, this.defendant, 0, 0, 0, null, 0, 0, 1);
                        this.updateUserData(interaction.guildId as string, this.claimant, 0, 0, 0, null, 0, 0, 1);
                    }

                    await message.reply( {embeds: [embed]});
                    this.saveCurrentStore();
                    this.dispute_lock = false;
                }, 60000);
            }              
        }
    }

    /**
     * Command handler for `challenge` command.
     */
    async challengeCommand(interaction: CommandInteraction): Promise<void> {
        if (interaction.commandName != "challenge") {
            return;
        }

        this.debug.Log(this.pluginName, "Interaction is command: challengeCommand", LogLevel.Info);

        zerozero.guilds.forEach(async guild => {
            if (guild.guild_id !== interaction.guildId) {
                return;
            }
            if (guild.bucket.last_winner == interaction.user.id && DEBUG_MODE == false) {
                await interaction.reply({ embeds: [this.ddal.createEmbed(COLOUR_SECONDARY, ":robot: Self Incriminating?",
                    "You can't start a dispute with yourself. I mean, you could but... you'd gain nothing from yourself since you simultaneously lose and win... you get the idea right?", "00:00 by Querty 0SS")]}); 
                 return;
            }
            if (this.dispute_lock) {
                let claimant_user = (await this.dclient.users.fetch(this.claimant)).username;
                let defendant_user = (await this.dclient.users.fetch(this.defendant)).username;

                await interaction.reply({ embeds: [this.ddal.createEmbed(COLOUR_SECONDARY, ":lock: A dispute is in progress",
                    `The currently is a dispute between **${claimant_user}** and **${defendant_user}**.`, "00:00 by Querty 0SS")]}); 
                 return;
            }
            if (guild.bucket.last_winner == undefined || guild.bucket.last_winner == "") {
                await interaction.reply({ embeds: [this.ddal.createEmbed(COLOUR_SECONDARY, ":grey_question: Unable to start dispute",
                    "There is no previous winner to start a dispute with.", "00:00 by Querty 0SS")]}); 
                 return;
            }
            if (!guild.bucket.win_taken) {
                await interaction.reply({ embeds: [this.ddal.createEmbed(COLOUR_SECONDARY, ":clock1: Unable to start dispute",
                     "The 6-minute dispute window has expired. If you suspect a severe violation, please submit all evidence to the bot administrator.", "00:00 by Querty 0SS")]}); 
                return;
            }

            const opponent = await this.dclient.users.fetch(guild.bucket.last_winner);
            const modal = new Modal().setCustomId("challenge_request_modal")
                .setTitle(`Challenge ${opponent.username}?`);
            const reason_txt = new TextInputComponent().setCustomId("challenge_reason")
                .setLabel("Provide a reason for this dispute")
                .setStyle("PARAGRAPH")
                .setMaxLength(128)
                .setRequired(true)
                .setPlaceholder("e.g. Pretyping")

            const row_component = new MessageActionRow<ModalActionRowComponent>().addComponents(reason_txt);
            modal.addComponents(row_component);

            this.defendant = opponent.id;
            this.claimant = interaction.user.id;
            
            await interaction.showModal(modal);
        });

    }

    /**
     * Command handler for `leadboard` command.
     */
    async leaderboardCommand(interaction: CommandInteraction): Promise<void> {
        if (interaction.commandName != "leaderboard") {
            return;
        }

        this.debug.Log(this.pluginName, "Interaction is command: leaderboardCommand", LogLevel.Info);
        await interaction.deferReply();

        this.debug.Log(this.pluginName, "Checking guild presence in database", LogLevel.None);
        if (zerozero.guilds.findIndex(guild => guild.guild_id == interaction.guildId) == -1) {
            this.debug.Log(this.pluginName, "Guild not present", LogLevel.Info);
            await interaction.editReply( {embeds: [this.ddal.createEmbed(COLOUR_SECONDARY, ":mag: No records found for this guild",
                "You may need to register using `/register` command.", "00:00 by Querty OSS")]});
            return;
        }

        zerozero.guilds.forEach(async guild => {
            if (guild.guild_id !== interaction.guildId) {
                return;
            }

            let embed = this.ddal.createEmbed(COLOUR_INTERACT, `:star: Leaderboard for **${interaction.guild?.name}**`, "", "00:00 by Querty OSS");   
            let rankings = [":first_place:", ":second_place:", ":third_place:", ":four:", ":five:"];

            guild.bucket.data.sort(this.rankElementsFunction);   
            let i: number = 0;

            for (i; i < 5; i++) {
                try {
                    if (guild.bucket.data[i].user_id != undefined) {
                        embed.addField(`${rankings[i]} ${(await this.dclient.users.fetch(guild.bucket.data[i].user_id)).username}`, `• Points: **${guild.bucket.data[i].points}**`);
                    }
                } catch (e) {
                    this.debug.Log(this.pluginName, `User does not exist (leaderboard index ${i}`, LogLevel.Warning);
                }   
            }
            
            await interaction.editReply( { embeds: [embed]});
        });
    }

    /**
     * Command handler for `info` command.
     */
    async infoCommand(interaction: CommandInteraction): Promise<void> {
        if (interaction.commandName != "info") {
            return;
        }

        this.debug.Log(this.pluginName, "Interaction is command: infoCommand", LogLevel.Info);
        await interaction.deferReply();

        this.debug.Log(this.pluginName, "Getting user object", LogLevel.None);
        let member: User = interaction.user;
        if (interaction.options.getMentionable("member", false) != undefined) {
            member = await this.dclient.users.fetch((interaction.options.getMentionable("member", false) as User).id);
        }
        if (member == null || member == undefined) {
            this.debug.Log(this.pluginName, "Member (type: User) object was null or undefined", LogLevel.Critical);
            return;
        }

        this.debug.Log(this.pluginName, "Checking guild presence in database", LogLevel.None);
        if (zerozero.guilds.findIndex(guild => guild.guild_id == interaction.guildId) == -1) {
            this.debug.Log(this.pluginName, "Guild not present", LogLevel.Info);
            await interaction.editReply( {embeds: [this.ddal.createEmbed(COLOUR_SECONDARY, ":mag: No records found for this guild",
                "You may need to register using `/register` command.", "00:00 by Querty OSS")]});
            return;
        }
        this.debug.Log(this.pluginName, "Checking user presence in database", LogLevel.None);
        if (zerozero.guilds.find(guild => guild.guild_id == interaction.guildId)?.bucket.data.findIndex(user => user.user_id == member.id) == -1) {
            this.debug.Log(this.pluginName, "User not present", LogLevel.Info);
            await interaction.editReply( {embeds: [this.ddal.createEmbed(COLOUR_SECONDARY, `:mag: No records found for **${member.username}**`,
                "An action like winning 00:00 or challenging another winner will create a record.", "00:00 by Querty OSS")]});
            return;
        }
        
        zerozero.guilds.forEach(async guild => {
            if (guild.guild_id !== interaction.guildId) {
                return;
            }

            guild.bucket.data.sort(this.rankElementsFunction);
            guild.bucket.data.forEach(async entry => {
                if (entry.user_id !== member.id) {
                    return;
                }

                this.debug.Log(this.pluginName, `Found guild "${guild.guild_name}" and user "${entry.user_id}"`, LogLevel.None);

                let embed = this.ddal.createEmbed(COLOUR_INTERACT, `:open_file_folder: Info for **${member.username}**`, "", "00:00 by Querty OSS");   
                let rankings = [":first_place:", ":second_place:", ":third_place:", ":four:", ":five:"];

                let index = guild.bucket.data.findIndex(item => item.user_id == member.id);
                if (index > 4) {
                    embed.addField("Rank", this.toEmojiNumber(index + 1));
                } else {
                    embed.addField("Rank", rankings[index]);
                }
                embed.addField("Summary", `• Points: **${entry.points}**\n• Misses: **${entry.misses}**\n• Cooldown: **${entry.cooldown}** nights\n• Last Win: **${entry.history[entry.history.length - 1] ?? "Never"}**`);
                embed.addField("Disputes", `• Won: **${entry.challenges.won}**\n• Lost: **${entry.challenges.lost}**\n• Staled: **${entry.challenges.stale}**`);

                await interaction.editReply( { embeds: [embed] } );
            });         
        });
    }

    /**
     * Command handler for `register` command.
     */
    async registerCommand(interaction: CommandInteraction): Promise<void> {
        if (interaction.commandName != "register") {
            return;
        }

        this.debug.Log(this.pluginName, "Interaction is command: registerCommand", LogLevel.Info);

        if (zerozero.guilds.findIndex(guild => guild.guild_id == interaction.guildId) != -1) {
            await interaction.reply( { embeds: [this.ddal.createEmbed(COLOUR_SECONDARY, ":ballot_box: This guild is already registered.",
                 "You can play 00:00 tonight (according to the Querty OSS server timezone).", "00:00 by Querty OSS")]});
            return;
        }

        await interaction.reply( {embeds: [this.ddal.createEmbed(COLOUR_POSITIVE, ":white_check_mark: This guild is now registered to play 00:00",
            "You can play 00:00 tonight (according to the Query OSS server timezone).", "00:00 by Querty OSS")]});

        this.createBackupStore();

        zerozero.guilds.push( 
            {
                "guild_id": `${interaction.guildId}`,
                "guild_name": `"${interaction.guild?.name}`,
                "bucket": {
                    "win_taken": false,
                    "challenge_lock": false,
                    "last_winner": "",
                    "data": []
                }
            }
        );

        this.saveCurrentStore();
    }

    init(): void {
        this.debug.Log(this.pluginName, `init() ${this.pluginName} ${this.version}`, LogLevel.Success);
        
        this.dclient.on("interactionCreate", async (interaction) => {
            if (interaction.isButton()) {
                await this.counterDisputeButtonResponse(interaction);
                return;
            }
            if (interaction.isModalSubmit()) {
                await this.challengeModalResponse(interaction);
                return;
            }
            
            if (!interaction.isCommand()) {
                this.debug.Log("Main", "Interaction is not a command, exiting...", LogLevel.None);
                return;
            }
            if (!interaction.inGuild()) {
                this.debug.Log("Main", "Interaction is not in a guild, exiting...", LogLevel.None);
                await interaction.reply({ embeds: [this.ddal.createEmbed(COLOUR_ERROR, ":x: Cannot run command", "You must be in a guild in order to use this command.")], ephemeral: true });
                return;
            }

            await this.registerCommand(interaction);
            await this.infoCommand(interaction);
            await this.leaderboardCommand(interaction);
            await this.challengeCommand(interaction);
        });

        this.dclient.on("messageCreate", async (message) => {
            if (message.author.id === this.dclient.user?.id) {
                this.debug.Log(this.pluginName, "Skipping bot message.", LogLevel.None);
                return;
            }
            zerozero.guilds.forEach(async (guild) => {
                // If we're not in the right server, ignore it.
                if (guild.guild_id != message.guild?.id) {
                    this.debug.Log(this.pluginName, `Skipping guild ${guild.guild_name}`, LogLevel.None);
                    return;
                }
                this.debug.Log(this.pluginName, `Possible ZeroZero event in guild ${guild.guild_name}`, LogLevel.Info);
                // If the time isn't correct, then ignore it.
                if ((message.createdAt.getHours() != 0 || message.createdAt.getMinutes() != 0) && DEBUG_MODE == false) {
                    this.debug.Log(this.pluginName, `The time is not 00:00 & debug mode is disabled. Skipping...`, LogLevel.None);
                    return;
                }
                // If the message doesn't include "00:00" or the winner has repeated their message, ignore it.
                if (!message.content.includes("00:00") || (message.author.id == guild.bucket.last_winner && guild.bucket.win_taken)) {
                    this.debug.Log(this.pluginName, `No "00:00" in message or repeated message by winner. Skipping...`, LogLevel.None);
                    return;
                }
                let user = guild.bucket.data.find(i => i.user_id == message.author.id);
                // If the user is timed out.
                if (user != undefined && user.cooldown > 0) {
                    await message.reply({ embeds: [this.ddal.createEmbed(COLOUR_NEGATIVE, ":ice_cube: Cooldown!",
                        `You were not awarded the point because you have an outstanding **${user.cooldown}** night cooldown.`, "00:00 by Querty OSS")] } );
                    return;
                }
                // If the win has already been taken for this night.
                if (guild.bucket.win_taken) {
                    this.debug.Log(this.pluginName, `User did not win.`, LogLevel.Success);
                    this.dclient.users.fetch(guild.bucket.last_winner).then(async (winner) => {
                        this.debug.Log(this.pluginName, `The win was already taken. Replying to the user...`, LogLevel.None);
                        await message.reply({ embeds: [this.ddal.createEmbed(COLOUR_NEGATIVE, ":snail: You we're too slow!",
                            `**${winner.username}** got 00:00 before you. Better luck next time.`, "00:00 by Querty OSS")] } );
                        this.updateUserData(guild.guild_id, message.author.id, 0, 1, 0, null, 0, 0, 0);
                    });
                    return;
                }
                this.debug.Log(this.pluginName, `User won 00:00 in ${guild.guild_name}`, LogLevel.Success);
                // We have a winner!
                await message.reply({ embeds: [this.ddal.createEmbed(COLOUR_WIN, `:trophy: Congrats ${message.author.username}, you win!`,
                    `You've been awarded **1** point, thanks for competing for the 00:00. Good night!`, "00:00 by Querty OSS")] } );
                guild.bucket.win_taken = true;
                guild.bucket.last_winner = message.author.id;
                setTimeout(() => guild.bucket.win_taken = false, 360000);
                this.updateUserData(guild.guild_id, message.author.id, 1, 0, 0, new Date().toString(), 0, 0, 0);
            });
        });
    }
}
/**
 * Sample JavaScript Plugin by Querty OSS 
 * © a4004 2022
 * https://github.com/a4004/querty
 */

const MODULE_NAME   = "Sample Script";
const VERSION       = "Beta";

function main(app, LogLevel) {
    app.debug.Log(MODULE_NAME, "This is a test plugin for demonstration purposes only. This script doesn't serve a functional purpose.", LogLevel.Critical);
    return;
}

function init(appRef) {
    const LogLevel = { None: 0, Info: 1, Success: 2, Warning: 3, Critical: 4, Magic: -1 };
    const app = { moduleName: appRef.moduleName, version: appRef.version, debug: appRef.debug,
        plugins: appRef.plugins, dclient: appRef.dclient, ddal: appRef.ddal };
    app.debug.Log(MODULE_NAME, `init() ${MODULE_NAME} ${VERSION}`, LogLevel.Success);

    app.dclient.on("messageCreate", async (msg) => {
        if (msg.content === "!ping") {
            msg.reply({embeds: [app.ddal.createEmbed("#00ffff", ":wave: Hello!", `:globe_with_meridians: Discord API Latency: **${app.dclient.ws.ping}**ms`)]});
        }
    });

    main(app, LogLevel);
}

module.exports = {
    moduleName: MODULE_NAME,
    version: VERSION,
    init: init
}
/**
 * Debug Helper Module by Querty OSS
 * (C) a4004 2022
 * https://github.com/a4004/querty
 */

/**
 * Defines how important an event is.
 */
export enum LogLevel {
    /**
     * The event is not important.
     */
    None = 0,
    /**
     * The event has some importance.
     */
    Info = 1,
    /**
     * The event indicates success.
     */
    Success = 2,
    /**
     * The event includes important information.
     */
    Warning = 3,
    /**
     * The event includes critical information.
     */
    Critical = 4,
    /**
     * The event is magic. (Rainbow Text)
     */
    Magic = -1,
}

/**
 * Provides useful debugging-related functionality.
 */
export class DebugHelper implements QuertyModule {
    moduleName: string = "Querty OSS Debug Helper";
    version: string = "Beta";  
    threshold: LogLevel;
    debugHistory: Array<string> = new Array<string>();

    /**
     * 
     * @param level Set the minimum logging level required for console output. Default is `LogLevel.None` which is verbose.
     */
    constructor(level?: LogLevel) {
        this.threshold = level ?? LogLevel.None;
        this.Log(this.moduleName, `${this.moduleName} module started. ${this.version}`, LogLevel.Success);
    }

    /**
     * Logs an event to the connected console.
     * @param source The module that invoked the event.
     * @param message The specified message of the event.
     * @param logLevel The importance of the event. `LogLevel.None` (least) `LogLevel.Magic` (most)
     */
    Log(source: string, message: string, logLevel: LogLevel): void {
        let date = new Date().toUTCString();
        this.debugHistory.push(`from ${source}\t[ ${date}]\t${message}`);

        if (logLevel != -1 && logLevel < this.threshold) {
            return;
        }

        switch(logLevel) {
            case LogLevel.None:
                console.log(`from ${source.bgBlack.white}\t[ ${date.bgBlack}]\t${message.white}`);
                break;
            case LogLevel.Info:
                console.info(`from ${source.bgBlack.cyan}\t[ ${date.bgBlack}]\t${message.cyan}`);
                break;
            case LogLevel.Success:
                console.log(`from ${source.bgBlack.green}\t[ ${date.bgBlack}]\t${message.green}`);
                break;
            case LogLevel.Warning:
                console.warn(`from ${source.bgBlack.yellow}\t[ ${date.bgBlack}]\t${message.yellow}`);
                break;
            case LogLevel.Critical:
                console.error(`from ${source.bgBlack.red}\t[ ${date.bgBlack}]\t${message.red}`);
                break;
            case LogLevel.Magic:
                console.log(`from ${source.bgBlack.rainbow}\t[ ${date.bgWhite.black}]\t${message.rainbow}`);
                break;
        }
    }
}
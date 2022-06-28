/**
 * Component Base Template: QuertyModuleBase, QuertyPluginBase by Querty OSS
 * (C) a4004 2022
 * https://github.com/a4004/querty
 */

import { DebugHelper } from "../modules/debug_helper";

/**
 * Base class of `QuertyModule`
 */
export class QuertyModuleBase implements QuertyModule {
    moduleName!: string;
    version!: string;
    /**
     * `DebugHelper` instance.
     */
    debug!: DebugHelper;
    
    /**
     * @param moduleName The name of the module.
     * @param version Version information.
     */
    constructor(moduleName: string, version: string, helper: DebugHelper) {
        console.log(`from ${moduleName.bgBlack.green}\t[ ${new Date().toUTCString().bgBlack}]\t${(`${moduleName} module started. ${version}`).green}`);
        this.moduleName = moduleName;
        this.version = version;
        this.debug = helper;
    }
}

/**
 * Base class of `QuertyPlugin`
 */
export class QuertyPluginBase implements QuertyPlugin {
    pluginName!: string;
    version!: string;

    /**
     * @param pluginName The name of the plugin.
     * @param version Version information.
     */
    constructor(pluginName: string, version: string) {
        console.log(`from ${pluginName.bgBlack.green}\t[ ${new Date().toUTCString().bgBlack}]\t${(`${pluginName} plugin started. ${version}`).green}`);
        this.pluginName = pluginName;
        this.version = version;
    }

    init() {
        console.log(`from ${this.pluginName.bgBlack.yellow}${'.QuertyPluginBase'.yellow} \t[ ${new Date().toUTCString().bgBlack}]\t${(`${this.pluginName} not implemented.`).yellow}`);
    }
}
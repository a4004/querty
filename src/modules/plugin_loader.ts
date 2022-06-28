/**
 * Plugin Loader Module by Querty OSS
 * (C) a4004 2022
 * https://github.com/a4004/querty
 */

import { QuertyModuleBase } from "../template/component_base";
import { DebugHelper, LogLevel } from "./debug_helper";
import fs from "fs";
import path from "path";

/**
 * Provides the ability to dynamically load & execute formatted JavaScript plugins.
 */
export class PluginLoader extends QuertyModuleBase {
    /**
     * @param helper Reference to the `DebugHelper` module.
     */
    constructor(helper: DebugHelper) {
        super("Querty OSS Plugin Loader", "Beta", helper);
    }

    /**
     * Loads a JavaScript plugin using `import(path as string)`.
     * @param path Relative or absolute file path to the JavaScript file.
     * @returns A `Promise<any>` value containing the `module.exports` object or `undefined`.
     */
    async loadPlugin(path: string): Promise<any> {
        try {
            this.debug.Log(this.moduleName, `Loading plugin "${path}"`, LogLevel.Info);
            return await import(path as string);
        } catch (e) {
            this.debug.Log(this.moduleName, `Failed to load plugin "${path}"\t${e}`, LogLevel.Warning);
            return undefined as any;
        }
    }
    /**
     * Loads and executes the `init` routine of a plugin.
     * @param path Relative or absolute file path to the JavaScript file.
     * @param appRef Reference to an instance of the `Main` app module. 
     * @returns A `Promise<boolean>` indicating the success of the function.
     */
    async initPlugin(path: string, appRef: any): Promise<boolean> {
        try {
            let local_plugin: any = await this.loadPlugin(path);
            local_plugin.init(appRef);
            this.debug.Log(this.moduleName, `Loaded plugin "${local_plugin.moduleName}"`, LogLevel.Success);
            return true;
        } catch (e) {
            this.debug.Log(this.moduleName, `Failed to init() plugin "${path}"\t${e}`, LogLevel.Warning);
            return false;
        }
    }

    async discoverPlugins(folderPath: string) : Promise<string[]> {      
        this.debug.Log(this.moduleName, `Discovering plugins in directory "${folderPath}"`, LogLevel.Info);
        let valid_plugins: Array<string> = new Array<string>();
        try {
            let files = fs.readdirSync(folderPath as string);
            let i: number;
            for (i = 0; i < files.length; i++) {
                let file: string = files[i];
                if (!file.endsWith('.js')) {
                    this.debug.Log(this.moduleName, `Object "${file}" is not a valid JavaScript file. Omitting.`, LogLevel.Warning);
                    continue;
                }
                let sample_plugin: any = await this.loadPlugin(path.join(folderPath as string, file));
                if (sample_plugin.init == undefined || sample_plugin.version == undefined || sample_plugin.moduleName == undefined) {
                    this.debug.Log(this.moduleName, `Object "${file}" is not a valid plugin. Omitting.`, LogLevel.Warning);
                    continue;
                }
                this.debug.Log(this.moduleName, `Found plugin: ${sample_plugin.moduleName} ${sample_plugin.version} on "${file}"`, LogLevel.Info);
                valid_plugins.push(file);
            }                  
            this.debug.Log(this.moduleName, `Discovered ${valid_plugins.length} plugin(s) in "${folderPath}"`, LogLevel.Success);
        } catch (e) {
            this.debug.Log(this.moduleName, `Failed to discover plugins in "${folderPath}" due to error ${e}`, LogLevel.Critical);            
        }

        return valid_plugins;
    }
}
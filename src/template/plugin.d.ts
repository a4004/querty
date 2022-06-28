/**
 * QuertyPlugin Interface Template
 * (C) a4004 2022
 * https://github.com/a4004/querty
 */

/**
 * Provides basic building blocks for an `QuertyPlugin` component.
 */
interface QuertyPlugin {
    /**
     * The name of the plugin.
     */
    pluginName: string;
    /**
     * Version information.
     */
    version: string;
    /**
     * Base `init` function of `QuertyPlugin`.
     */
    init(): void;
    /**
     * Base `init` function of `QuertyPlugin`
     * @param args Unspecified Parameter
     */
    init(args: any): void;
}
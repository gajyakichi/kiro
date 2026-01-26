
export interface PluginDef {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
}

export const AVAILABLE_PLUGINS: PluginDef[] = [
    {
        id: "plugin-jp",
        name: "Japanese Language Support",
        description: "Enables Japanese localization for the interface.",
        version: "1.0.0",
        author: "System"
    },
    {
        id: "plugin-theme-lab",
        name: "Theme Lab",
        description: "EXPERIMENTAL: Create and manage custom themes. (Currently built-in)",
        version: "0.1.0",
        author: "System"
    }
];

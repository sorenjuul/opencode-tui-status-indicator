# opencode-tui-status-indicator

An [OpenCode](https://opencode.ai) TUI plugin that shows agent status in the terminal tab title with an animated spinner.

Works on any terminal that supports OSC title sequences — Windows Terminal, iTerm2, WezTerm, Ghostty, Kitty, Alacritty, and more.

## Status indicators

| State | Icon | When |
|---|---|---|
| Working | `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` | Agent is processing (animated braille spinner) |
| Ready | `✓` | Agent is idle |
| Error | `✗` | Session error occurred |
| Waiting | `◉` | Agent is waiting for user input (permission or question) |

The tab title also shows the current session name, e.g. `⠹ Fix auth middleware` while working.

## Install

```bash
opencode plugin opencode-tui-status-indicator
```

Restart OpenCode and the spinner will appear in your terminal tab.

## How it works

This plugin uses OpenCode's TUI plugin API (`renderer.setTerminalTitle()`) to set the terminal tab title based on session events. Unlike plugins that write OSC escape sequences directly (which get captured by the TUI), this approach goes through OpenCode's renderer and works correctly on all platforms including Windows.

## License

MIT

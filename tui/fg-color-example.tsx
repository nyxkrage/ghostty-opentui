import { createCliRenderer } from "@opentui/core"
import { createRoot, useKeyboard, extend } from "@opentui/react"
import { useState } from "react"
import { GhosttyTerminalRenderable } from "../src/terminal-buffer"

// Register the ghostty-terminal component
extend({ "ghostty-terminal": GhosttyTerminalRenderable })

// Sample ANSI content showing text without explicit colors
// This text will use the default foreground color
const SAMPLE_ANSI = `$ echo "Hello World"
Hello World

$ ls -la
total 64
drwxr-xr-x  8 user user  4096 Jan 18 10:30 .
drwxr-xr-x  5 user user  4096 Jan 17 14:22 ..
-rw-r--r--  1 user user   234 Jan 18 10:30 .gitignore
drwxr-xr-x  8 user user  4096 Jan 18 10:28 \x1b[1;34m.git\x1b[0m
-rw-r--r--  1 user user  1842 Jan 18 09:15 package.json
drwxr-xr-x  3 user user  4096 Jan 17 16:40 \x1b[1;34mnode_modules\x1b[0m
drwxr-xr-x  2 user user  4096 Jan 18 10:15 \x1b[1;34msrc\x1b[0m

$ cat README.md
This is plain text without any ANSI color codes.
It will be rendered using the default foreground color.

Notice how the colored text (like .git, node_modules, src)
still shows its original blue color, while the plain text
uses whichever default you configure.

$ git status
On branch \x1b[1;36mmain\x1b[0m
Your branch is up to date with '\x1b[1;31morigin/main\x1b[0m'.

Changes to be committed:
  \x1b[32mmodified:   src/index.ts\x1b[0m
  \x1b[32mnew file:   src/utils.ts\x1b[0m

Untracked files:
  \x1b[35mtmp/\x1b[0m
  \x1b[35mdebug.log\x1b[0m

$ _`

const COLOR_OPTIONS = [
  { name: "Muted Gray (default)", color: "#d4d4d4" },
  { name: "Bright White", color: "#ffffff" },
  { name: "Light Gray", color: "#c0c0c0" },
  { name: "Warm White", color: "#f5f5dc" },
  { name: "Cool Blue-White", color: "#e0e8f0" },
  { name: "Green Tint", color: "#c0f0c0" },
  { name: "Amber/Retro", color: "#ffb000" },
]

function App() {
  const [colorIndex, setColorIndex] = useState(0)

  useKeyboard((key) => {
    if (key.name === "q" || key.name === "escape") {
      process.exit(0)
    }
    if (key.name === "left" || key.name === "h") {
      setColorIndex((i) => (i - 1 + COLOR_OPTIONS.length) % COLOR_OPTIONS.length)
    }
    if (key.name === "right" || key.name === "l") {
      setColorIndex((i) => (i + 1) % COLOR_OPTIONS.length)
    }
    // Number keys 1-7 to select colors directly
    const num = parseInt(key.name, 10)
    if (num >= 1 && num <= COLOR_OPTIONS.length) {
      setColorIndex(num - 1)
    }
  })

  const currentColor = COLOR_OPTIONS[colorIndex]

  return (
    <box style={{ flexDirection: "column", flexGrow: 1, padding: 1 }}>
      <box style={{ height: 5, paddingLeft: 1, flexDirection: "column", marginBottom: 1 }}>
        <text fg="#ffffff">
          <span fg="#888888">Default Foreground Color Demo</span>
        </text>
        <text fg="#888888">
          Use <span fg="#ffffff">left/right</span> or <span fg="#ffffff">h/l</span> to cycle colors, <span fg="#ffffff">1-7</span> to select directly, <span fg="#ffffff">q</span> to quit
        </text>
        <text>
          Current: <span fg={currentColor.color}>{currentColor.name}</span> (<span fg="#888888">{currentColor.color}</span>)
        </text>
      </box>

      <box style={{ flexDirection: "row", flexGrow: 1, gap: 2 }}>
        {/* Main terminal with configurable color */}
        <box style={{ flexGrow: 1, border: true, borderColor: currentColor.color }} title={`Terminal (${currentColor.color})`}>
          <scrollbox focused style={{ flexGrow: 1 }}>
            <ghostty-terminal 
              ansi={SAMPLE_ANSI} 
              cols={80} 
              rows={40}
              defaultForegroundColor={currentColor.color}
            />
          </scrollbox>
        </box>

        {/* Side panel showing all color options */}
        <box style={{ width: 30, flexDirection: "column", gap: 1 }}>
          <box style={{ border: true, height: COLOR_OPTIONS.length + 2 }} title="Colors">
            {COLOR_OPTIONS.map((opt, i) => (
              <text key={i} fg={i === colorIndex ? opt.color : "#666666"}>
                {i === colorIndex ? "> " : "  "}{i + 1}. {opt.name}
              </text>
            ))}
          </box>

          <box style={{ border: true, flexGrow: 1 }} title="Preview">
            <box style={{ flexDirection: "column", padding: 1 }}>
              {COLOR_OPTIONS.map((opt, i) => (
                <text key={i} fg={opt.color}>
                  {opt.name}
                </text>
              ))}
            </box>
          </box>
        </box>
      </box>
    </box>
  )
}

if (require.main === module) {
  ;(async () => {
    const renderer = await createCliRenderer({ exitOnCtrlC: true })
    createRoot(renderer).render(<App />)
  })()
}

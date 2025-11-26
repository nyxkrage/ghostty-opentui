// Old React-based implementation (slow for large files)
// Kept for comparison and testing

import { StyleFlags, type TerminalData, type TerminalSpan } from "./ffi"

const DEFAULT_FG = "#d4d4d4"
const DEFAULT_BG = "#1e1e1e"

function TerminalSpanView({ span }: { span: TerminalSpan }) {
  const { text, fg, bg, flags } = span

  let fgColor = fg || DEFAULT_FG
  let bgColor = bg || undefined

  if (flags & StyleFlags.INVERSE) {
    const temp = fgColor
    fgColor = bgColor || DEFAULT_BG
    bgColor = temp
  }

  const isBold = !!(flags & StyleFlags.BOLD)
  const isItalic = !!(flags & StyleFlags.ITALIC)
  const isUnderline = !!(flags & StyleFlags.UNDERLINE)
  const isFaint = !!(flags & StyleFlags.FAINT)

  let content: JSX.Element = <>{text}</>

  if (isBold) {
    content = <strong>{content}</strong>
  }
  if (isItalic) {
    content = <em>{content}</em>
  }
  if (isUnderline) {
    content = <u>{content}</u>
  }

  return (
    <span fg={fgColor} bg={bgColor} dim={isFaint}>
      {content}
    </span>
  )
}

function TerminalLineView({ spans }: { spans: TerminalSpan[] }) {
  if (spans.length === 0) {
    return <text> </text>
  }

  return (
    <text>
      {spans.map((span, i) => (
        <TerminalSpanView key={i} span={span} />
      ))}
    </text>
  )
}

export function TerminalViewReact({ data }: { data: TerminalData }) {
  return (
    <box style={{ flexDirection: "column", flexGrow: 1 }}>
      <scrollbox
        focused
        style={{ flexGrow: 1 }}
        rootOptions={{ backgroundColor: DEFAULT_BG }}
        contentOptions={{ backgroundColor: DEFAULT_BG, padding: 1 }}
      >
        {data.lines.map((line, i) => (
          <TerminalLineView key={i} spans={line.spans} />
        ))}
      </scrollbox>
      <box style={{ height: 1, backgroundColor: "#21262d", paddingLeft: 1 }}>
        <text fg="#8b949e">
          {data.cols}x{data.rows} | Cursor: ({data.cursor[0]}, {data.cursor[1]}) | Lines: {data.totalLines}
        </text>
      </box>
    </box>
  )
}

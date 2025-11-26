import { describe, expect, it, afterEach } from "bun:test"
import { testRender } from "@opentui/react/test-utils"
import { TerminalView } from "./index"
import { TerminalViewReact } from "./terminal-view-react"
import { ptyToJson } from "./ffi"
import fs from "fs"

let testSetup: Awaited<ReturnType<typeof testRender>>

describe("Performance benchmark", () => {
  afterEach(() => {
    if (testSetup) {
      testSetup.renderer.destroy()
    }
  })

  it("Compare Native vs React rendering (10,000 lines)", async () => {
    const input = fs.readFileSync("/tmp/big.log")

    const zigStart = performance.now()
    const data = ptyToJson(input, { cols: 120, rows: 10000 })
    const zigTime = performance.now() - zigStart

    console.log(`\n--- BENCHMARK RESULTS ---`)
    console.log(`Total lines: ${data.totalLines}`)
    console.log(`Total spans: ${data.lines.reduce((acc, l) => acc + l.spans.length, 0)}`)
    console.log(`Zig processing: ${zigTime.toFixed(2)}ms`)

    // Test 1: Old React Implementation
    const reactStart = performance.now()
    testSetup = await testRender(<TerminalViewReact data={data} />, {
      width: 120,
      height: 40,
    })
    await testSetup.renderOnce()
    const reactTime = performance.now() - reactStart
    testSetup.renderer.destroy()

    // Test 2: New Native Implementation
    const nativeStart = performance.now()
    testSetup = await testRender(<TerminalView data={data} />, {
      width: 120,
      height: 40,
    })
    await testSetup.renderOnce()
    const nativeTime = performance.now() - nativeStart

    console.log(`Old React View: ${reactTime.toFixed(2)}ms`)
    console.log(`New Native View: ${nativeTime.toFixed(2)}ms`)
    console.log(`Speedup: ${(reactTime / nativeTime).toFixed(1)}x`)
    console.log(`-------------------------\n`)

    expect(nativeTime).toBeLessThan(reactTime)
  }, 30000) // Increase timeout
})

#!/usr/bin/env bun
import { $ } from "bun"
import fs from "fs"
import path from "path"

const ROOT = path.resolve(import.meta.dir, "..")
const DIST = path.join(ROOT, "dist")
const ZIG_OUT = path.join(ROOT, "zig-out", "lib")

interface Target {
  name: string
  zigTarget: string | null // null means native
  libSuffix: string // .dylib, .so, or .dll
}

const TARGETS: Target[] = [
  { name: "linux-x64", zigTarget: "x86_64-linux-gnu", libSuffix: ".so" },
  { name: "linux-arm64", zigTarget: "aarch64-linux-gnu", libSuffix: ".so" },
  // musl targets disabled - ghostty's C++ deps (simdutf, highway) fail with PIC errors
  // { name: "linux-x64-musl", zigTarget: "x86_64-linux-musl", libSuffix: ".so" },
  // { name: "linux-arm64-musl", zigTarget: "aarch64-linux-musl", libSuffix: ".so" },
  { name: "darwin-x64", zigTarget: "x86_64-macos", libSuffix: ".dylib" },
  { name: "darwin-arm64", zigTarget: "aarch64-macos", libSuffix: ".dylib" },
  { name: "win32-x64", zigTarget: "x86_64-windows-gnu", libSuffix: ".dll" },
]

async function build(target: Target): Promise<boolean> {
  const targetDir = path.join(DIST, target.name)
  const destFile = path.join(targetDir, `libghostty-opentui${target.libSuffix}`)

  console.log(`\n--- Building ${target.name} ---`)

  // Clean zig-out before each build to avoid stale artifacts
  fs.rmSync(path.join(ROOT, "zig-out"), { recursive: true, force: true })

  const args = ["-Doptimize=ReleaseFast"]
  if (target.zigTarget) {
    args.push(`-Dtarget=${target.zigTarget}`)
  }

  try {
    await $`zig build ${args}`.cwd(ROOT)

    // Find the output file
    const srcFile = path.join(ZIG_OUT, `libghostty-opentui${target.libSuffix}`)

    if (!fs.existsSync(srcFile)) {
      console.error(`  ERROR: No output file found for ${target.name}`)
      console.error(`  Expected: ${srcFile}`)
      if (fs.existsSync(ZIG_OUT)) {
        const files = fs.readdirSync(ZIG_OUT).join(", ")
        console.error(`  Available files: ${files}`)
      } else {
        console.error(`  zig-out/lib directory does not exist`)
      }
      return false
    }

    // Copy to dist
    fs.mkdirSync(targetDir, { recursive: true })
    fs.copyFileSync(srcFile, destFile)

    const stats = fs.statSync(destFile)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
    console.log(`  OK: ${destFile} (${sizeMB} MB)`)
    return true
  } catch (error) {
    console.error(`  FAILED: ${target.name}`)
    console.error(error)
    return false
  }
}

async function main() {
  const args = process.argv.slice(2)

  // Filter targets if specified
  let targets = TARGETS
  if (args.length > 0) {
    targets = TARGETS.filter((t) => args.includes(t.name))
    if (targets.length === 0) {
      console.error(`No matching targets. Available: ${TARGETS.map((t) => t.name).join(", ")}`)
      process.exit(1)
    }
  }

  console.log(`Building ${targets.length} target(s): ${targets.map((t) => t.name).join(", ")}`)

  // Clean dist folder for targets we're building
  for (const target of targets) {
    const targetDir = path.join(DIST, target.name)
    fs.rmSync(targetDir, { recursive: true, force: true })
  }

  const results: { target: string; success: boolean }[] = []

  for (const target of targets) {
    const success = await build(target)
    results.push({ target: target.name, success })
  }

  console.log("\n--- Summary ---")
  let failed = 0
  for (const r of results) {
    const status = r.success ? "OK" : "FAILED"
    console.log(`  ${r.target}: ${status}`)
    if (!r.success) failed++
  }

  if (failed > 0) {
    console.error(`\n${failed} target(s) failed`)
    process.exit(1)
  }

  console.log("\nAll targets built successfully!")
}

main()

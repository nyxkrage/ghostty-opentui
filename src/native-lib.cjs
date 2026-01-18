const { platform, arch } = require("os");
const path = require("path");

function loadNativeModule() {
  // Try development path first
  try {
    return require("../zig-out/lib/ghostty-opentui.node");
  } catch {}

  // Load platform-specific dist path using dynamic path construction
  // to prevent bundlers from statically analyzing these requires
  const p = platform();
  const a = arch();

  const distPath = path.join(
    __dirname,
    "..",
    "dist",
    `${p}-${a}`,
    "ghostty-opentui.node",
  );

  try {
    return require(distPath);
  } catch (e) {
    // Windows non-x64 fallback
    if (p === "win32" && a !== "x64") {
      return null;
    }
    throw new Error(
      `Unsupported platform: ${p}-${a}. Could not load ${distPath}`,
    );
  }
}

const native = loadNativeModule();

module.exports = { native };

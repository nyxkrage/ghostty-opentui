const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const lib_mod = b.createModule(.{
        .root_source_file = b.path("src/lib.zig"),
        .target = target,
        .optimize = optimize,
        .strip = true,
        .single_threaded = true,
    });

    if (b.lazyDependency("ghostty", .{ .target = target, .optimize = optimize })) |dep| {
        lib_mod.addImport("ghostty-vt", dep.module("ghostty-vt"));
    }

    const lib = b.addLibrary(.{
        .name = "ghostty-opentui",
        .root_module = lib_mod,
        .linkage = .dynamic,
    });
    b.installArtifact(lib);

    const test_step = b.step("test", "Run unit tests");
    const run_test = b.addRunArtifact(b.addTest(.{ .root_module = lib_mod }));
    test_step.dependOn(&run_test.step);
}

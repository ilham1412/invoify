#!/usr/bin/env node
/*
 * Merge per-spec coverage parts into coverage-map.json and a summary file.
 *
 * Usage:
 *   node scripts/coverage/merge-maps.mjs \
 *     --parts coverage-data/build-1/parts \
 *     --out coverage-map.json \
 *     --summary coverage-data/summary-build-1.json \
 *     --runs coverage-data/build-1/runs.json \
 *     --build 1
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function parseArgs(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (!arg.startsWith("--")) continue;
        const key = arg.slice(2);
        const value = argv[i + 1];
        if (value === undefined || value.startsWith("--")) {
            out[key] = true;
        } else {
            out[key] = value;
            i += 1;
        }
    }
    return out;
}

function git(args) {
    try {
        return execFileSync("git", args, {
            cwd: repoRoot,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();
    } catch {
        return "";
    }
}

function readJson(file) {
    const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(text);
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    const partsDir = path.resolve(args.parts || "coverage-data/parts");
    const outFile = path.resolve(args.out || "coverage-map.json");
    const summaryFile = args.summary ? path.resolve(args.summary) : null;
    const runsFile = args.runs ? path.resolve(args.runs) : null;
    const buildNumber = Number(args.build || 1);

    const partFiles = fs
        .readdirSync(partsDir)
        .filter((name) => name.endsWith(".json"))
        .sort();

    const specs = {};
    const filesBySpec = new Map();
    const fileCounts = new Map();
    const allFiles = new Set();

    for (const name of partFiles) {
        const part = readJson(path.join(partsDir, name));
        if (!part.spec || !Array.isArray(part.files)) continue;
        const files = [...new Set(part.files.map((item) => String(item).replace(/\\/g, "/")))].sort();
        specs[part.spec] = files;
        filesBySpec.set(part.spec, files);
        for (const file of files) {
            allFiles.add(file);
            fileCounts.set(file, (fileCounts.get(file) || 0) + 1);
        }
    }

    const specCount = Object.keys(specs).length;
    const sharedFiles = [...fileCounts.entries()]
        .filter(([, count]) => count >= 12)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([file, count]) => ({ file, specCount: count }));

    const packageJson = readJson(path.join(repoRoot, "package.json"));
    const monocartVersion =
        packageJson.devDependencies?.["monocart-coverage-reports"] ||
        packageJson.dependencies?.["monocart-coverage-reports"] ||
        "unknown";

    const gitStatus = git(["status", "--porcelain"]);
    const metadata = {
        generatedAt: new Date().toISOString(),
        gitHead: git(["rev-parse", "HEAD"]) || "unknown",
        gitStatus,
        gitDirty: gitStatus.length > 0,
        monocartVersion,
        threshold: "executed-non-top-level-function>=1",
        buildNumber,
        mode: "production-build",
        specCount,
        fileCount: allFiles.size,
    };

    const coverageMap = { metadata, specs };
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(coverageMap, null, 2));

    const runs = runsFile && fs.existsSync(runsFile) ? readJson(runsFile) : [];
    const summary = {
        metadata,
        perSpec: Object.entries(specs)
            .map(([spec, files]) => ({
                spec,
                fileCount: files.length,
                files,
            }))
            .sort((a, b) => a.spec.localeCompare(b.spec)),
        sharedFiles,
        filesInAllSpecs: [...fileCounts.entries()]
            .filter(([, count]) => count === specCount)
            .map(([file, count]) => ({ file, specCount: count }))
            .sort((a, b) => a.file.localeCompare(b.file)),
        runs,
    };

    if (summaryFile) {
        fs.mkdirSync(path.dirname(summaryFile), { recursive: true });
        fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    }

    console.log(`specs: ${specCount}`);
    console.log(`unique app files: ${allFiles.size}`);
    console.log("per-spec file counts:");
    for (const [spec, files] of Object.entries(specs).sort((a, b) => a[0].localeCompare(b[0]))) {
        console.log(`  ${files.length.toString().padStart(3)}  ${spec}`);
    }
    console.log(`files appearing in >= 12/${specCount} specs: ${sharedFiles.length}`);
    for (const item of sharedFiles.slice(0, 30)) {
        console.log(`  ${item.specCount.toString().padStart(2)}  ${item.file}`);
    }
}

main();

#!/usr/bin/env node
/*
 * Convert Playwright raw V8 coverage (one JSON file per test) into a sorted
 * list of client source files for one spec.
 *
 * Usage:
 *   node scripts/coverage/process-coverage.mjs \
 *     --raw coverage-raw/build-1/06-pratinjau__pratinjau \
 *     --out coverage-data/parts/06-pratinjau__pratinjau.json \
 *     --spec e2e/tests/06-pratinjau/pratinjau.spec.ts \
 *     --build 1
 *
 * The raw files are produced by the opt-in `coverage` fixture in
 * e2e/support/test.ts. Source maps are resolved by Monocart from the running
 * production server, so keep that server alive while this script runs.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CoverageReport } from "monocart-coverage-reports";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const APP_ROOTS = new Set([
    "app",
    "components",
    "contexts",
    "hooks",
    "i18n",
    "lib",
    "services",
    "actions",
]);

const SOURCE_EXTENSIONS = /\.(?:[cm]?[jt]sx?)$/;

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

function walkJsonFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...walkJsonFiles(full));
        } else if (entry.isFile() && entry.name.endsWith(".json")) {
            out.push(full);
        }
    }
    return out;
}

function loadRawCoverage(dir) {
    const entries = [];
    for (const file of walkJsonFiles(dir)) {
        const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
        if (!Array.isArray(parsed)) continue;
        for (const entry of parsed) {
            if (entry && entry.url && Array.isArray(entry.functions)) {
                entries.push(entry);
            }
        }
    }
    return entries;
}

function normalizeSourcePath(input, info = {}) {
    let value = String(input || "").replace(/\\/g, "/").trim();
    if (!value) return "";

    // The URL of the original source map entry is often more informative than
    // the path Monocart has already normalised. Prefer it when it still has a
    // webpack/file prefix.
    const url = String(info.url || "").replace(/\\/g, "/");
    if (url && /^(?:webpack|file):\/\//.test(url)) {
        value = url;
    }

    value = value.replace(/[?#].*$/, "");
    value = value.replace(/^webpack:\/\/[^/]*\/+/, "");
    value = value.replace(/^webpack:\/\/\/+/, "");
    value = value.replace(/^webpack-internal:\/\/\/+/, "");
    value = value.replace(/^file:\/\/\/+/, "");
    value = value.replace(/^file:\/\/+/, "");
    value = value.replace(/^\/+/, "");
    value = value.replace(/^\.\//, "");

    const normalisedRoot = repoRoot.replace(/\\/g, "/");
    if (value.startsWith(normalisedRoot + "/")) {
        value = value.slice(normalisedRoot.length + 1);
    }

    value = path.posix.normalize(value);
    while (value.startsWith("../")) value = value.slice(3);
    value = value.replace(/^\.\//, "");

    return value;
}

function isAppSource(sourcePath) {
    if (!sourcePath || !SOURCE_EXTENSIONS.test(sourcePath)) return false;
    if (sourcePath.endsWith(".d.ts")) return false;
    if (sourcePath.startsWith("node_modules/")) return false;
    if (sourcePath.startsWith(".next/")) return false;
    if (sourcePath.startsWith("e2e/")) return false;
    if (sourcePath.startsWith("coverage-")) return false;
    if (sourcePath.includes("/node_modules/")) return false;
    if (sourcePath.includes("/.next/")) return false;
    if (sourcePath.includes("/webpack/")) return false;
    if (sourcePath.includes("__playwright_evaluation_script__")) return false;

    const root = sourcePath.split("/")[0];
    return APP_ROOTS.has(root);
}

function countExecutedNonTopLevelFunctions(file) {
    const functions = Array.isArray(file.data?.functions) ? file.data.functions : [];
    const executed = functions.filter((item) => Number(item.count) > 0);
    if (executed.length === 0) return 0;

    const sourceLength = typeof file.source === "string" ? file.source.length : undefined;

    return executed.filter((item) => {
        if (Number(item.start) !== 0) return true;
        if (typeof sourceLength === "number") {
            return Number(item.end) < sourceLength - 2;
        }
        // Without the original source, a range that starts at zero and is not
        // clearly the whole module wrapper is still treated as real code.
        return Number(item.end) > 0;
    }).length;
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    const rawDir = path.resolve(args.raw || "coverage-raw");
    const outFile = args.out ? path.resolve(args.out) : null;
    const spec = args.spec || "";
    const buildNumber = Number(args.build || 1);
    const minExecutedFunctions = Math.max(1, Number(args["min-functions"] || 1));
    const reportDir = path.resolve(
        args["report-dir"] ||
            path.join("coverage-data", "monocart", path.basename(rawDir)),
    );

    const entries = loadRawCoverage(rawDir);
    if (entries.length === 0) {
        console.error(`No raw V8 coverage entries found in ${rawDir}`);
        process.exitCode = 1;
        return;
    }

    const report = new CoverageReport({
        name: `TIA coverage ${spec || path.basename(rawDir)}`,
        outputDir: reportDir,
        reports: [["v8-json"]],
        clean: true,
        logging: "error",
        baseDir: repoRoot,
        entryFilter: (entry) => {
            const url = String(entry?.url || "");
            return (
                /^https?:\/\//.test(url) &&
                !url.includes("__playwright_evaluation_script__") &&
                !url.includes("/node_modules/")
            );
        },
        sourcePath: (filePath, info) => normalizeSourcePath(filePath, info),
    });

    // Monocart is async; keep main() small by returning the promise.
    return report
        .add(entries)
        .then(() => report.generate())
        .then((results) => {
            if (!results) throw new Error("Monocart returned no coverage results");

            const allPaths = [];
            const seenPaths = new Set();
            const appFiles = new Set();
            const debugRows = [];

            for (const file of results.files || []) {
                const sourcePath = normalizeSourcePath(file.sourcePath, {
                    url: file.url,
                });
                if (!sourcePath || seenPaths.has(sourcePath)) continue;
                seenPaths.add(sourcePath);
                allPaths.push(sourcePath);

                const functions = Array.isArray(file.data?.functions)
                    ? file.data.functions
                    : [];
                const executed = functions.filter((item) => Number(item.count) > 0).length;
                debugRows.push({
                    sourcePath,
                    executedFunctions: executed,
                    totalFunctions: functions.length,
                });

                if (!isAppSource(sourcePath)) continue;
                if (countExecutedNonTopLevelFunctions(file) < minExecutedFunctions) continue;
                appFiles.add(sourcePath);
            }

            allPaths.sort();
            const files = [...appFiles].sort();

            const payload = {
                spec,
                buildNumber,
                generatedAt: new Date().toISOString(),
                threshold: `executed-non-top-level-function>=${minExecutedFunctions}`,
                minExecutedFunctions,
                fileCount: files.length,
                files,
            };

            if (outFile) {
                fs.mkdirSync(path.dirname(outFile), { recursive: true });
                fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
            }

            console.log(`raw entries: ${entries.length}`);
            console.log(`source paths found: ${allPaths.length}`);
            console.log(`app source files covered: ${files.length}`);
            console.log("first 20 source paths:");
            for (const item of allPaths.slice(0, 20)) {
                console.log(`  ${item}`);
            }

            // A compact diagnostic file is useful when Gate 1 fails: it shows
            // whether the paths are real source paths or mere chunks.
            if (args.debug) {
                const debugFile = path.resolve(args.debug);
                fs.mkdirSync(path.dirname(debugFile), { recursive: true });
                fs.writeFileSync(
                    debugFile,
                    JSON.stringify(
                        {
                            rawDir,
                            spec,
                            buildNumber,
                            entryCount: entries.length,
                            allPaths,
                            debugRows,
                            files,
                        },
                        null,
                        2,
                    ),
                );
            }

            if (files.length === 0) {
                console.error(
                    "No app source files passed the threshold; Gate 1 has not passed.",
                );
                process.exitCode = 2;
            }
        })
        .catch((error) => {
            console.error(error?.stack || String(error));
            process.exitCode = 1;
        })
        .finally(() => {
            try {
                report.clean();
            } catch {
                // Cleaning is best-effort; the extracted map is already written.
            }
        });
}

main();

#!/usr/bin/env node
/*
 * Diagnostic: show executed function counts/names for selected source files in
 * one raw Playwright coverage file or directory. Used only for the navigation
 * coverage check; it does not touch coverage-map.json.
 *
 * Usage:
 *   node scripts/coverage/inspect-functions.mjs \
 *     --raw coverage-raw/... \
 *     --files app/components/invoice/form/sections/InvoiceDetails.tsx,...
 *     --out coverage-data/navigation-check/functions-details.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CoverageReport } from "monocart-coverage-reports";

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

function walk(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(full));
        else if (entry.isFile() && entry.name.endsWith(".json")) out.push(full);
    }
    return out;
}

function loadEntries(target) {
    const files = fs.statSync(target).isDirectory() ? walk(target) : [target];
    const entries = [];
    for (const file of files) {
        const data = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
        if (Array.isArray(data)) {
            for (const entry of data) {
                if (entry && entry.url && Array.isArray(entry.functions)) entries.push(entry);
            }
        }
    }
    return entries;
}

function normalizeSourcePath(input, info = {}) {
    let value = String(input || "").replace(/\\/g, "/").trim();
    if (!value) return "";
    const url = String(info.url || "").replace(/\\/g, "/");
    if (url && /^(?:webpack|file):\/\//.test(url)) value = url;
    value = value.replace(/[?#].*$/, "");
    value = value.replace(/^webpack:\/\/[^/]*\/+/, "");
    value = value.replace(/^webpack:\/\/\/+/, "");
    value = value.replace(/^webpack-internal:\/\/\/+/, "");
    value = value.replace(/^file:\/\/\/+/, "");
    value = value.replace(/^file:\/\/+/, "");
    value = value.replace(/^\/+/, "");
    value = value.replace(/^\.\//, "");
    const root = repoRoot.replace(/\\/g, "/");
    if (value.startsWith(root + "/")) value = value.slice(root.length + 1);
    value = path.posix.normalize(value);
    while (value.startsWith("../")) value = value.slice(3);
    return value;
}

function lineAt(source, offset) {
    if (typeof source !== "string") return null;
    return source.slice(0, offset).split("\n").length;
}

function countNonTop(functions, sourceLength) {
    return functions.filter((item) => Number(item.count) > 0 && !(
        Number(item.start) === 0 &&
        typeof sourceLength === "number" &&
        Number(item.end) >= sourceLength - 2
    )).length;
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    const raw = path.resolve(args.raw);
    const targets = String(args.files || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    const outFile = args.out ? path.resolve(args.out) : null;

    const entries = loadEntries(raw);
    if (!entries.length) throw new Error(`No coverage entries in ${raw}`);

    const report = new CoverageReport({
        name: "Navigation coverage probe",
        outputDir: path.resolve("coverage-data/navigation-check/inspect-tmp"),
        reports: [["v8-json"]],
        clean: true,
        logging: "error",
        baseDir: repoRoot,
        entryFilter: (entry) => {
            const url = String(entry?.url || "");
            return /^https?:\/\//.test(url) && !url.includes("__playwright_evaluation_script__");
        },
        sourcePath: (filePath, info) => normalizeSourcePath(filePath, info),
    });

    return report
        .add(entries)
        .then(() => report.generate())
        .then((results) => {
            const byPath = new Map();
            for (const file of results.files || []) {
                const sourcePath = normalizeSourcePath(file.sourcePath, { url: file.url });
                byPath.set(sourcePath, file);
            }

            const output = {};
            for (const target of targets) {
                const file = byPath.get(target) || [...byPath.values()].find((item) =>
                    normalizeSourcePath(item.sourcePath, { url: item.url }).endsWith(target),
                );
                if (!file) {
                    output[target] = { present: false };
                    continue;
                }
                const functions = Array.isArray(file.data?.functions) ? file.data.functions : [];
                const sourceLength = typeof file.source === "string" ? file.source.length : undefined;
                const executed = functions
                    .filter((item) => Number(item.count) > 0)
                    .map((item) => ({
                        name: item.name,
                        count: item.count,
                        start: item.start,
                        end: item.end,
                        line: lineAt(file.source, item.start),
                    }));
                output[target] = {
                    present: true,
                    executedNonTopLevel: countNonTop(functions, sourceLength),
                    totalFunctions: functions.length,
                    executedFunctions: executed,
                };
            }

            const payload = { raw, targets, output };
            if (outFile) {
                fs.mkdirSync(path.dirname(outFile), { recursive: true });
                fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
            }
            console.log(JSON.stringify(payload, null, 2));
        })
        .catch((error) => {
            console.error(error?.stack || String(error));
            process.exitCode = 1;
        })
        .finally(() => {
            try {
                report.clean();
            } catch {
                // best-effort
            }
        });
}

main();

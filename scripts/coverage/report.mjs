#!/usr/bin/env node
/*
 * Consolidate the Gate 1/2/3 artifacts into one machine-readable report.
 *
 * Usage:
 *   node scripts/coverage/report.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readJson(file, fallback = null) {
    try {
        return JSON.parse(fs.readFileSync(path.resolve(repoRoot, file), "utf8").replace(/^\uFEFF/, ""));
    } catch {
        return fallback;
    }
}

function sum(values) {
    return values.reduce((total, value) => total + Number(value || 0), 0);
}

function selectionSummary(file) {
    const data = readJson(file);
    if (!data) return null;
    return {
        strategy: data.strategy,
        changedFiles: data.changedFiles,
        selectedSpecs: data.selectedSpecs,
        selectedTestCount: data.selectedTestCount,
        selectionSources: data.selectionSources,
        fallback: data.fallback,
        fallbackReason: data.fallbackReason,
        outsideCoverageScope: data.outsideCoverageScope,
        changedFilesMissingFromGraph: data.changedFilesMissingFromGraph,
        coverageMapFilesMissingFromGraph: data.coverageMapFilesMissingFromGraph,
        analysisSeconds: data.analysisSeconds,
    };
}

const gate1 = readJson("coverage-data/gate1/gate1-summary.json");
const min2 = readJson("coverage-data/gate1/pratinjau-coverage-min2.json");
const min3 = readJson("coverage-data/gate1/pratinjau-coverage-min3.json");
const build1 = readJson("coverage-data/build-1/summary-build-1.json");
const build2 = readJson("coverage-data/build-2/summary-build-2.json");
const runs1 = readJson("coverage-data/build-1/runs.json", []);
const runs2 = readJson("coverage-data/build-2/runs.json", []);
const jaccard = readJson("coverage-data/jaccard-build-1-vs-2.json");
const noCoverage = readJson("coverage-data/no-coverage-run.json");
const tiaExecution = readJson("coverage-data/tia-execution.json");

const selectionFiles = [
    "client-M",
    "client-CD",
    "layout-M",
    "layout-CD",
    "server-M",
    "server-CD",
    "fallback-e2e-infra",
    "outside-json",
    "reverse-singleitem",
    "m-singleitem",
    "missing-source",
];

const selections = {};
for (const name of selectionFiles) {
    selections[name] = selectionSummary(`coverage-data/selection/${name}.json`);
}

let gitStatus = "";
try {
    gitStatus = execFileSync("git", ["status", "--short"], {
        cwd: repoRoot,
        encoding: "utf8",
    }).trim();
} catch {
    gitStatus = "";
}

const report = {
    generatedAt: new Date().toISOString(),
    gate1: gate1
        ? {
              status: gate1.status,
              spec: gate1.spec,
              rawEntries: gate1.rawEntries,
              sourcePaths: gate1.sourcePaths,
              appSourceFiles: gate1.appSourceFiles,
              first20: gate1.first20,
              sensitivity: {
                  min1: gate1.appSourceFiles,
                  min2: min2?.fileCount ?? null,
                  min3: min3?.fileCount ?? null,
              },
          }
        : null,
    gate2: build1
        ? {
              specCount: build1.metadata.specCount,
              uniqueFiles: build1.metadata.fileCount,
              perSpec: build1.perSpec.map((item) => ({
                  spec: item.spec,
                  fileCount: item.fileCount,
              })),
              sharedFilesAtLeast12: build1.sharedFiles.length,
              filesInAllSpecs: build1.filesInAllSpecs.length,
              jaccard: jaccard
                  ? {
                        average: jaccard.averageJaccard,
                        overall: jaccard.overallJaccard,
                        perSpec: jaccard.perSpec.map((item) => ({
                            spec: item.spec,
                            jaccard: item.jaccard,
                            onlyInA: item.onlyInA,
                            onlyInB: item.onlyInB,
                        })),
                    }
                  : null,
              build1DurationSeconds: Number(sum(runs1.map((run) => run.playwrightSeconds)).toFixed(2)),
              build1ProcessSeconds: Number(sum(runs1.map((run) => run.processSeconds)).toFixed(2)),
              build2DurationSeconds: Number(sum(runs2.map((run) => run.playwrightSeconds)).toFixed(2)),
              build2ProcessSeconds: Number(sum(runs2.map((run) => run.processSeconds)).toFixed(2)),
          }
        : null,
    noCoverageFullSuite: noCoverage,
    tiaExecution,
    gate3: selections,
    gitStatus,
};

const outFile = path.resolve(repoRoot, "coverage-data/experiment-report.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(`wrote ${outFile}`);

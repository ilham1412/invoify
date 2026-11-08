#!/usr/bin/env node
/*
 * Compare two coverage-map files produced by two independent coverage runs.
 * Jaccard similarity is a stability diagnostic, not a correctness measure.
 *
 * Usage:
 *   node scripts/coverage/compare-maps.mjs \
 *     --a coverage-data/coverage-map-build-1.json \
 *     --b coverage-data/coverage-map-build-2.json \
 *     --out coverage-data/jaccard-build-1-vs-2.json
 */

import fs from "node:fs";
import path from "node:path";

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

function readMap(file) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return data.specs || data;
}

function setOf(value) {
    return new Set(Array.isArray(value) ? value.map((item) => String(item).replace(/\\/g, "/")) : []);
}

function intersection(a, b) {
    const out = new Set();
    for (const item of a) if (b.has(item)) out.add(item);
    return out;
}

function union(a, b) {
    const out = new Set(a);
    for (const item of b) out.add(item);
    return out;
}

function jaccard(a, b) {
    const u = union(a, b);
    if (u.size === 0) return 1;
    return intersection(a, b).size / u.size;
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    if (!args.a || !args.b) {
        console.error("Usage: compare-maps.mjs --a <map-a> --b <map-b> [--out <file>]");
        process.exitCode = 1;
        return;
    }

    const mapA = readMap(path.resolve(args.a));
    const mapB = readMap(path.resolve(args.b));
    const specs = [...new Set([...Object.keys(mapA), ...Object.keys(mapB)])].sort();

    const perSpec = [];
    let sum = 0;
    for (const spec of specs) {
        const a = setOf(mapA[spec]);
        const b = setOf(mapB[spec]);
        const value = jaccard(a, b);
        sum += value;
        perSpec.push({
            spec,
            jaccard: Number(value.toFixed(6)),
            onlyInA: [...a].filter((item) => !b.has(item)).sort(),
            onlyInB: [...b].filter((item) => !a.has(item)).sort(),
            intersectionCount: intersection(a, b).size,
            unionCount: union(a, b).size,
        });
    }

    const allA = new Set(specs.flatMap((spec) => [...setOf(mapA[spec])]));
    const allB = new Set(specs.flatMap((spec) => [...setOf(mapB[spec])]));
    const overall = jaccard(allA, allB);
    const average = specs.length ? sum / specs.length : 1;

    const result = {
        generatedAt: new Date().toISOString(),
        mapA: path.resolve(args.a),
        mapB: path.resolve(args.b),
        specCount: specs.length,
        averageJaccard: Number(average.toFixed(6)),
        overallJaccard: Number(overall.toFixed(6)),
        perSpec,
    };

    if (args.out) {
        const outFile = path.resolve(args.out);
        fs.mkdirSync(path.dirname(outFile), { recursive: true });
        fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
    }

    console.log(`specs compared: ${specs.length}`);
    console.log(`average Jaccard: ${result.averageJaccard}`);
    console.log(`overall Jaccard: ${result.overallJaccard}`);
    for (const item of perSpec) {
        console.log(
            `  ${item.jaccard.toFixed(4)}  ${String(item.intersectionCount).padStart(3)}/${String(item.unionCount).padEnd(3)}  ${item.spec}`,
        );
    }
    const unstable = perSpec.filter((item) => item.jaccard < 0.9);
    if (unstable.length) {
        console.log(`\nspecs below 0.9 (${unstable.length}):`);
        for (const item of unstable) {
            console.log(`  ${item.jaccard.toFixed(4)}  ${item.spec}`);
            if (item.onlyInA.length) console.log(`    only A: ${item.onlyInA.join(", ")}`);
            if (item.onlyInB.length) console.log(`    only B: ${item.onlyInB.join(", ")}`);
        }
    }
}

main();

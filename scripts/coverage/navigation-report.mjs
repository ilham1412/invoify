#!/usr/bin/env node
/*
 * Consolidate the navigation coverage probe. Reads only separate probe
 * artifacts; it never writes coverage-map.json.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const base = path.join(repoRoot, "coverage-data/navigation-check");

function read(file, fallback = null) {
    try {
        return JSON.parse(fs.readFileSync(path.join(base, file), "utf8").replace(/^\uFEFF/, ""));
    } catch {
        return fallback;
    }
}

function files(name) {
    const data = read(name + ".json");
    return new Set(data?.files || []);
}

function diff(a, b) {
    return [...a].filter((item) => !b.has(item)).sort();
}

function functionSummary(name, targets) {
    const data = read("functions-" + name + ".json");
    if (!data) return null;
    const out = {};
    for (const target of targets) {
        const item = data.output?.[target];
        out[target] = item
            ? {
                  present: item.present,
                  executedNonTopLevel: item.executedNonTopLevel,
                  totalFunctions: item.totalFunctions,
              }
            : null;
    }
    return out;
}

const detailTargets = [
    "app/components/invoice/form/sections/InvoiceDetails.tsx",
    "app/components/reusables/form-fields/DatePickerFormField.tsx",
    "app/components/reusables/form-fields/FormFile.tsx",
    "app/components/reusables/form-fields/CurrencySelector.tsx",
    "hooks/useCurrencies.tsx",
];

const itemTargets = [
    "app/components/invoice/form/sections/Items.tsx",
    "app/components/invoice/form/SingleItem.tsx",
    "app/components/invoice/form/VoiceInput.tsx",
];

const allTargets = [...new Set([...detailTargets, ...itemTargets])];

const f = {
    first2: files("first2"),
    details2: files("details2"),
    detailsBack2: files("details-back2"),
    items: files("items"),
    itemsHome: files("items-home"),
    wizPos01: files("wiz-pos-01"),
    wizPos02: files("wiz-pos-02"),
    wizEdge01: files("wiz-edge-01"),
};

const finalMap = JSON.parse(fs.readFileSync(path.join(repoRoot, "coverage-map.json"), "utf8"));
const spec00 = finalMap.specs["e2e/tests/00-navigasi-wizard/navigasi-wizard.spec.ts"] || [];

const report = {
    generatedAt: new Date().toISOString(),
    finalMap: {
        buildNumber: finalMap.metadata.buildNumber,
        fileCount: finalMap.metadata.fileCount,
        spec00FileCount: spec00.length,
        detailsFilesPresentInMap: Object.fromEntries(
            detailTargets.map((target) => [target, spec00.includes(target)]),
        ),
    },
    probes: {
        firstPageOnly: {
            fileCount: f.first2.size,
            executedFunctions: functionSummary("first2", allTargets),
        },
        detailsOnly: {
            fileCount: f.details2.size,
            executedFunctions: functionSummary("details2", allTargets),
        },
        detailsThenBack: {
            fileCount: f.detailsBack2.size,
            executedFunctions: functionSummary("details-back2", allTargets),
        },
        itemsOnly: {
            fileCount: f.items.size,
            executedFunctions: functionSummary("items", allTargets),
        },
        itemsThenFullNavigationToHome: {
            fileCount: f.itemsHome.size,
            executedFunctions: functionSummary("items-home", allTargets),
        },
        actualSpecWizPos01: {
            fileCount: f.wizPos01.size,
            executedFunctions: functionSummary("wiz-pos-01", allTargets),
        },
        actualSpecWizPos02: {
            fileCount: f.wizPos02.size,
            executedFunctions: functionSummary("wiz-pos-02", allTargets),
        },
        actualSpecWizEdge01: {
            fileCount: f.wizEdge01.size,
            executedFunctions: functionSummary("wiz-edge-01", allTargets),
        },
    },
    comparisons: {
        detailsThenBackVsDetailsOnly: {
            missing: diff(f.detailsBack2, f.details2),
            extra: diff(f.details2, f.detailsBack2),
        },
        actualWizPos02VsDetailsThenBack: {
            missing: diff(f.wizPos02, f.detailsBack2),
            extra: diff(f.detailsBack2, f.wizPos02),
        },
        firstPageOnlyVsDetails: {
            detailsOnlyFilesMissingFromFirst: diff(f.details2, f.first2),
            firstExtra: diff(f.first2, f.details2),
        },
        itemsThenHomeVsItemsOnly: {
            missingAfterFullNavigation: diff(f.items, f.itemsHome),
            extraAfterFullNavigation: diff(f.itemsHome, f.items),
        },
        itemsThenHomeVsFirstPageOnly: {
            missing: diff(f.itemsHome, f.first2),
            extra: diff(f.first2, f.itemsHome),
        },
    },
    conclusion: {
        clientSideNavigation:
            "WIZ-POS-02 ends on the first wizard page but retains the details-page files. Details-only and details-then-back sets are identical; actual WIZ-POS-02 also matches details-then-back. No coverage loss observed for Next.js client-side step navigation.",
        fullDocumentNavigation:
            "PROBE-ITEMS-HOME navigates from the items page to /en with page.goto(). Its file set equals the first-page-only set, and Items/SingleItem/VoiceInput drop to 0 executed non-top-level functions. This is evidence that a full document navigation resets the V8 coverage buffer despite resetOnNavigation:false.",
        finalMap:
            "coverage-map.json was not rewritten. It still contains the details-page files for 00-navigasi-wizard, contributed by WIZ-POS-02's client-side navigation.",
    },
};

const outFile = path.join(base, "report.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(`wrote ${outFile}`);

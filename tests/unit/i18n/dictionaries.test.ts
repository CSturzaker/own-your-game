import { describe, expect, it } from "vitest";

import { LOCALES, NON_DEFAULT_LOCALES } from "~/i18n/config";
import { TODO_MARKER } from "~/i18n/t";
import ar from "~/i18n/dictionaries/ar.json";
import en from "~/i18n/dictionaries/en.json";
import es from "~/i18n/dictionaries/es.json";
import fr from "~/i18n/dictionaries/fr.json";
import pt from "~/i18n/dictionaries/pt.json";

type Json = string | string[] | { [k: string]: Json };

const DICTS: Record<string, Json> = { en, es, fr, ar, pt };

/**
 * Collect every leaf key path in a dictionary. A leaf is a string or an
 * array of strings (repeated text blocks); objects are recursed into.
 */
function leafPaths(node: Json, prefix = ""): string[] {
	if (typeof node === "string" || Array.isArray(node)) return [prefix];
	return Object.entries(node).flatMap(([key, value]) =>
		leafPaths(value, prefix ? `${prefix}.${key}` : key),
	);
}

function getPath(node: Json, path: string): Json | undefined {
	let current: Json | undefined = node;
	for (const segment of path.split(".")) {
		if (typeof current !== "object" || Array.isArray(current) || current == null) return undefined;
		current = current[segment];
	}
	return current;
}

const EN_LEAVES = leafPaths(en);

describe("dictionary key parity (CI guard)", () => {
	it("English is the source of truth and never carries a TODO stub", () => {
		for (const path of EN_LEAVES) {
			const value = getPath(en, path);
			expect(value, `en.${path} must exist`).toBeDefined();
			if (typeof value === "string") {
				expect(value, `en.${path} must not be a TODO stub`).not.toBe(TODO_MARKER);
			}
		}
	});

	for (const locale of NON_DEFAULT_LOCALES) {
		it(`${locale}.json has every key present in en.json`, () => {
			const dict = DICTS[locale]!;
			const missing = EN_LEAVES.filter((path) => getPath(dict, path) === undefined);
			expect(missing, `${locale}.json is missing keys: ${missing.join(", ")}`).toEqual([]);
		});
	}

	it("no locale has keys that en.json lacks (no orphans)", () => {
		const enSet = new Set(EN_LEAVES);
		for (const locale of LOCALES) {
			const orphans = leafPaths(DICTS[locale]!).filter((path) => !enSet.has(path));
			expect(orphans, `${locale}.json has orphan keys: ${orphans.join(", ")}`).toEqual([]);
		}
	});

	it("the delivered translations actually landed (spot checks)", () => {
		expect(getPath(es as Json, "tagline.question")).toBe("¿De quién es este juego?");
		expect(getPath(fr as Json, "home.startingEleven.kicker")).toBe("LES ONZE DU JOUR");
		expect(getPath(ar as Json, "about.answer")).toBe("إنها لنا.");
		// About body is a translated 5-paragraph array in es/fr/ar.
		expect(getPath(es as Json, "about.body")).toHaveLength(5);
		// Portuguese stays stubbed: array leaves degrade to the marker string.
		expect(getPath(pt as Json, "about.body")).toBe(TODO_MARKER);
	});
});

/** @type {import('@commitlint/types').UserConfig} */
export default {
	extends: ["@commitlint/config-conventional"],
	rules: {
		// Subject line: ≤72 chars, lowercase, no trailing period.
		"subject-max-length": [2, "always", 72],
		"subject-case": [2, "always", "lower-case"],
		"subject-full-stop": [2, "never", "."],
		// Wrap bodies and footers at 100 chars.
		"body-max-line-length": [2, "always", 100],
		"footer-max-line-length": [2, "always", 100],
		// Allowed Conventional Commit types — explicit list rather
		// than inheriting the default.
		"type-enum": [
			2,
			"always",
			["feat", "fix", "chore", "docs", "refactor", "test", "style", "perf", "ci", "build"],
		],
	},
};

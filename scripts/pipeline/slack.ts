/**
 * Slack notification — formatter + poster.
 *
 * Validation errors arrive as `RowResult.kind === "rejected"` records.
 * The campaign team needs a message in their pipeline channel that
 * names the row number, the (best-effort) ID, and the field-level
 * complaint so they can fix the sheet without engineer-in-the-loop.
 *
 * The formatter is pure (testable). The poster is a thin wrapper
 * around `fetch` so the entrypoint can mock it in tests too.
 */

import type { RowResult } from "./transform";

type RejectedResult = RowResult & { kind: "rejected" };

/**
 * Build the Slack message body. Plain text with light markdown — the
 * audience is the campaign ops people, not engineering, so this stays
 * human and brief.
 *
 * The first line names the run; subsequent lines name each row. We
 * cap the per-row error list at 5 errors to keep the message inside
 * Slack's display limits even for catastrophically broken sheets.
 */
export function formatSlackMessage(rejected: readonly RejectedResult[]): string {
	if (rejected.length === 0) {
		throw new Error("formatSlackMessage called with no rejected rows");
	}

	const header = `*Voices sheet validation failed* — ${rejected.length} row(s) rejected`;

	const lines = rejected.map((r) => {
		const idTag = r.id ? ` (\`${r.id}\`)` : "";
		const shownErrors = r.errors.slice(0, 5);
		const truncated = r.errors.length - shownErrors.length;
		const errorList = shownErrors.map((e) => `    • ${e}`).join("\n");
		const tail = truncated > 0 ? `\n    • …and ${truncated} more` : "";
		return `*Row ${r.rowNumber}*${idTag}:\n${errorList}${tail}`;
	});

	return `${header}\n\n${lines.join("\n\n")}`;
}

/**
 * POST the message to the Slack incoming webhook. The webhook is a
 * private channel; the URL itself is the auth, so it lives in a
 * GitHub Actions secret (`SLACK_PIPELINE_WEBHOOK_URL`) and not in
 * code or env files.
 *
 * Returns whether the post succeeded. Failures are not thrown — the
 * caller decides whether a missing Slack message should fail the
 * whole run (it shouldn't; the validation errors already exit with
 * a non-zero code).
 */
export async function postToSlack(
	webhookUrl: string,
	message: string,
	fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
	const response = await fetchImpl(webhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ text: message }),
	});
	return response.ok;
}

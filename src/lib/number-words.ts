/**
 * Spell a non-negative integer in English words ("two hundred and
 * forty-seven"). British style — an "and" before the final tens/ones
 * within each thousand group.
 *
 * Used by the squad page's desktop H1, which renders the live voice
 * count as words ("Two hundred and forty-seven.") per the prototype
 * (`hifi-squad.jsx`). Kept generic and pure so Vitest can pin it.
 */

const ONES = [
	"zero",
	"one",
	"two",
	"three",
	"four",
	"five",
	"six",
	"seven",
	"eight",
	"nine",
	"ten",
	"eleven",
	"twelve",
	"thirteen",
	"fourteen",
	"fifteen",
	"sixteen",
	"seventeen",
	"eighteen",
	"nineteen",
] as const;

const TENS = [
	"",
	"",
	"twenty",
	"thirty",
	"forty",
	"fifty",
	"sixty",
	"seventy",
	"eighty",
	"ninety",
] as const;

/** Spell an integer in 0..999. */
function under1000(n: number): string {
	if (n < 20) return ONES[n] ?? "";
	if (n < 100) {
		const tens = TENS[Math.floor(n / 10)] ?? "";
		const ones = n % 10;
		return ones ? `${tens}-${ONES[ones] ?? ""}` : tens;
	}
	const hundreds = ONES[Math.floor(n / 100)] ?? "";
	const rest = n % 100;
	return rest ? `${hundreds} hundred and ${under1000(rest)}` : `${hundreds} hundred`;
}

/**
 * Spell a non-negative integer in words. Handles 0..999,999 — far
 * beyond any plausible campaign size. Non-finite or negative input
 * falls back to the plain numeral so a bad value never crashes a
 * render.
 */
export function numberToWords(value: number): string {
	if (!Number.isFinite(value) || value < 0) return String(value);
	const n = Math.floor(value);
	if (n < 1000) return under1000(n);

	const thousands = Math.floor(n / 1000);
	const rest = n % 1000;
	const thousandsPart = `${under1000(thousands)} thousand`;
	if (!rest) return thousandsPart;
	// "one thousand and five" but "one thousand two hundred".
	const connector = rest < 100 ? " and " : " ";
	return `${thousandsPart}${connector}${under1000(rest)}`;
}

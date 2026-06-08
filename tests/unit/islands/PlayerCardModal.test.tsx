import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { makeT } from "~/i18n/astro";
import { buildPlayerStrings } from "~/i18n/player-strings";
import { PlayerCardModal } from "~/islands/PlayerCardModal";
import type { Voice } from "~/lib/voice";

const strings = buildPlayerStrings(makeT("en").t);

const VOICE: Voice = {
	id: "sofia-ar-003",
	firstName: "Sofía",
	age: 16,
	countryCode: "AR",
	city: "Rosario",
	theme: "friendship",
	pullQuote: "We learn the world through who we play with.",
	language: "es",
	videoId: "c3d4e5f6a7b8c9d0",
	portraitImageId: "sofia-ar-003",
	publishedAt: "2026-05-05T00:00:00Z",
};

function renderModal(props: Partial<React.ComponentProps<typeof PlayerCardModal>> = {}) {
	const onClose = vi.fn();
	render(
		<PlayerCardModal
			voice={VOICE}
			position={3}
			total={38}
			strings={strings}
			open
			onClose={onClose}
			voicePath="/voice/sofia-ar-003"
			{...props}
		/>,
	);
	return { onClose };
}

describe("PlayerCardModal", () => {
	it("renders nothing when closed", () => {
		renderModal({ open: false });
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("renders the card content in a labelled dialog when open", () => {
		renderModal();
		const dialog = screen.getByRole("dialog");
		expect(dialog).toBeInTheDocument();
		// The visible name is the dialog's accessible name (Dialog.Title).
		expect(dialog).toHaveAccessibleName(/Sofía/);
		expect(screen.getByRole("button", { name: strings.close })).toBeInTheDocument();
		// The video player renders its poster + play button — no iframe until
		// the user presses play (DEV-46).
		expect(screen.getByRole("button", { name: strings.video.play })).toBeInTheDocument();
		expect(dialog.querySelector("iframe")).toBeNull();
		// The caption / transcript / share chip row renders (DEV-47).
		expect(screen.getByRole("button", { name: strings.chips.transcript })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: strings.chips.share })).toBeInTheDocument();
	});

	it("calls onClose on Escape", () => {
		const { onClose } = renderModal();
		fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when the close button is clicked", () => {
		const { onClose } = renderModal();
		fireEvent.click(screen.getByRole("button", { name: strings.close }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});

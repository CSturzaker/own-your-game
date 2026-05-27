import { useEffect, useRef, useState, type JSX } from "react";

export interface PortraitImageProps {
	src: string;
	alt: string;
}

/**
 * Real portrait image with a graceful fallback to whatever sits
 * behind it. The Astro shell (`~/components/Portrait.astro`) renders
 * the deterministic silhouette as the container background and then
 * mounts this island on top with the real image. If the image fails
 * to load (404, network drop, blocked by an extension) the island
 * unmounts itself and the silhouette shows through.
 *
 * The Astro shell hydrates this island with `client:visible`, so the
 * native `error` event may have fired and been missed before React
 * attached its handler. The useEffect below catches that race by
 * checking `complete && naturalWidth === 0` on mount.
 */
export function PortraitImage({ src, alt }: PortraitImageProps): JSX.Element | null {
	const [failed, setFailed] = useState(false);
	const imgRef = useRef<HTMLImageElement | null>(null);

	useEffect(() => {
		const img = imgRef.current;
		// `complete` is true once load OR error has fired. A
		// `naturalWidth` of 0 means the load failed — covers the case
		// where the browser already gave up before hydration finished.
		if (img && img.complete && img.naturalWidth === 0) {
			setFailed(true);
		}
	}, []);

	if (failed) return null;
	return (
		<img
			ref={imgRef}
			src={src}
			alt={alt}
			loading="lazy"
			decoding="async"
			className="absolute inset-0 size-full object-cover"
			onError={() => setFailed(true)}
		/>
	);
}

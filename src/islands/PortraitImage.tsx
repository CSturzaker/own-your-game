import { useEffect, useRef, useState, type JSX } from "react";

export interface PortraitImageProps {
	src: string;
	/** Optional DPR `srcset` (1×/2×) from `portraitSrcset` (DEV-74). */
	srcset?: string;
	alt: string;
	/**
	 * Above-the-fold LCP hint (DEV-129). When true the image loads
	 * eagerly with `fetchpriority="high"` so it isn't deprioritised
	 * behind the rest of a grid; default `false` keeps the lazy,
	 * low-priority load for below-fold portraits. Pair with a
	 * `<link rel="preload" as="image">` at SSR for the warm download —
	 * the island only renders client-side (its host hydrates
	 * `client:visible`/`client:idle`), so the priority hint alone can't
	 * start the request before hydration.
	 */
	priority?: boolean;
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
export function PortraitImage({
	src,
	srcset,
	alt,
	priority = false,
}: PortraitImageProps): JSX.Element | null {
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
			srcSet={srcset}
			alt={alt}
			loading={priority ? "eager" : "lazy"}
			fetchPriority={priority ? "high" : undefined}
			decoding="async"
			className="absolute inset-0 size-full object-cover"
			onError={() => setFailed(true)}
		/>
	);
}

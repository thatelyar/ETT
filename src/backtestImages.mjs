const validImage = (item) => item && typeof item.src === "string" && item.src.length > 0;

export function backtestImages(trade) {
  if (Array.isArray(trade?.images)) return trade.images.filter(validImage);
  const stored = trade?.image;
  if (!stored || typeof stored !== "string") return [];
  if (stored.startsWith("{")) {
    try {
      const payload = JSON.parse(stored);
      if (Array.isArray(payload.images)) return payload.images.filter(validImage);
    } catch {
      // A legacy image URL can contain braces; keep it as one image.
    }
  }
  return [{ id: "legacy-image", timeframe: "", src: stored }];
}

export function encodeBacktestImages(trade) {
  const images = backtestImages(trade);
  return images.length
    ? JSON.stringify({ version: 1, images: images.map(({ id, timeframe, src }) => ({ id, timeframe: timeframe || "", src })) })
    : "";
}

export function tradePreviewImage(trade) {
  if (!trade) return "";
  return backtestImages(trade)[0]?.src || "";
}

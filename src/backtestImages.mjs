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

export function backtestMetadata(trade) {
  if (typeof trade?.image !== "string" || !trade.image.startsWith("{")) return {};
  try {
    const payload = JSON.parse(trade.image);
    return payload.status === "no-entry"
      ? { status: "no-entry", noEntryReason: String(payload.noEntryReason || "") }
      : {};
  } catch {
    return {};
  }
}

export function encodeBacktestImages(trade) {
  const images = backtestImages(trade);
  if (!images.length && trade.status !== "no-entry") return "";
  return JSON.stringify({
    version: 2,
    images: images.map(({ id, timeframe, src }) => ({ id, timeframe: timeframe || "", src })),
    ...(trade.status === "no-entry" ? { status: "no-entry", noEntryReason: trade.noEntryReason || "" } : {}),
  });
}

export function tradePreviewImage(trade) {
  if (!trade) return "";
  return backtestImages(trade)[0]?.src || "";
}

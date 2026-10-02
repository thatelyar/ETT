import assert from "node:assert/strict";
import test from "node:test";
import { backtestImages, encodeBacktestImages, tradePreviewImage } from "./backtestImages.mjs";

test("four timeframe images round-trip through the existing text field", () => {
  const images = ["4H", "1H", "15M", "5M"].map((timeframe, index) => ({
    id: `image-${index}`, timeframe, src: `data:image/jpeg;base64,${index}`,
  }));
  const encoded = encodeBacktestImages({ images });
  assert.deepEqual(backtestImages({ image: encoded }), images);
  assert.equal(tradePreviewImage({ image: encoded }), images[0].src);
});

test("a legacy single image remains readable and an empty gallery removes it", () => {
  const legacy = "data:image/jpeg;base64,legacy";
  assert.equal(backtestImages({ image: legacy })[0].src, legacy);
  assert.equal(tradePreviewImage({ image: legacy }), legacy);
  assert.equal(encodeBacktestImages({ image: legacy, images: [] }), "");
});

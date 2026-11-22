import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain ESM script without type declarations
import { ICON_LINK_RE, iconFontUrl, usedIconNames } from "../scripts/icons.mjs";

describe("icon font subset (app/index.html)", () => {
  it("loads exactly the icons the code uses; run `npm run icons` after adding an icon", () => {
    const html = readFileSync(new URL("../../app/index.html", import.meta.url), "utf8");
    const link = (html.match(ICON_LINK_RE) as RegExpMatchArray | null)?.[0] ?? "";
    const names = usedIconNames() as string[];
    expect(names).toContain("mic");
    expect(link).toContain(iconFontUrl(names));
  });
});

import { describe, expect, it } from "vitest";
import { parseNumberSelection } from "../src/parser.js";

describe("parseNumberSelection", () => {
  it.each([
    ["7", 7],
    ["7 🔮", 7],
    ["Carta 7", 7],
    ["Mi número es 7 ❤️", 7],
    ["Elijo 17!", 17],
  ])("parses %j as selection %i", (text, selection) => {
    expect(parseNumberSelection(text)).toEqual({ status: "selected", selection });
  });

  it.each(["", "Hola", "Qué bonito ❤️", "Me encanta", "Quiero mi carta"])(
    "reports no selection for %j",
    (text) => {
      expect(parseNumberSelection(text)).toEqual({
        status: "invalid",
        reason: "no_selection",
      });
    },
  );

  it.each(["7 o 12", "3 8 15"])("rejects ambiguous selection %j", (text) => {
    expect(parseNumberSelection(text)).toEqual({
      status: "invalid",
      reason: "ambiguous_selection",
    });
  });

  it("does not impose a campaign-specific numeric range", () => {
    expect(parseNumberSelection("Elijo 120")).toEqual({ status: "selected", selection: 120 });
  });
});

import type { SelectionType } from "./types.js";

export type SelectionParseResult =
  | { status: "selected"; selection: number }
  | { status: "invalid"; reason: "no_selection" | "ambiguous_selection" };

/** Parse a numeric selection without applying campaign-specific validity rules. */
export function parseNumberSelection(text: string): SelectionParseResult {
  const matches = text.match(/[+-]?\d+/gu) ?? [];
  if (matches.length === 0) {
    return { status: "invalid", reason: "no_selection" };
  }

  const selections = new Set<number>();
  for (const match of matches) {
    const selection = Number(match);
    if (!Number.isSafeInteger(selection)) {
      return { status: "invalid", reason: "no_selection" };
    }
    selections.add(selection);
  }

  if (selections.size !== 1) {
    return { status: "invalid", reason: "ambiguous_selection" };
  }

  const selection = selections.values().next().value;
  if (selection === undefined) {
    return { status: "invalid", reason: "no_selection" };
  }
  return { status: "selected", selection };
}

export function parseSelection(
  selectionType: SelectionType,
  text: string,
): SelectionParseResult {
  switch (selectionType) {
    case "number":
      return parseNumberSelection(text);
  }
}

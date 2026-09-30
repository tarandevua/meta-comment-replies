import {describe,it,expect} from "vitest"; import {extractSelection} from "../src/parser.js";
describe("extractSelection",()=>{it("parses a numbered comment",()=>{expect(extractSelection("✨ 7 🔮")).toBe(7)});it("rejects text without a number",()=>{expect(extractSelection("hello")).toBeNull()});it("rejects multiple numbers",()=>{expect(extractSelection("7 or 8")).toBeNull()});});

import { writeFileSync } from "fs";
import { generateCssVariables } from "../src/styles/theme.ts";

const css = generateCssVariables();
writeFileSync("src/styles/theme.css", css);
console.log("theme.css gerado com sucesso!");

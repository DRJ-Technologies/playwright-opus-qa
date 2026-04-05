import * as fs from "fs";
import type { QAResult } from "../types";

/**
 * Write a QA result to a JSON file.
 */
export function reportJSON(result: QAResult, filePath: string): void {
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
}

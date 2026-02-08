import { XMLParser } from "fast-xml-parser";
import fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ManifestInterface } from "../@types/Manifest.js";
const __dirname = dirname(fileURLToPath(import.meta.url));

export class ManifestService {
  get data() {
    const distPath = join(__dirname, "..", "manifest.xml");
    const srcPath = join(__dirname, "..", "..", "src", "manifest.xml");
    
    let manifestPath = distPath;
    if (!fs.existsSync(distPath) && fs.existsSync(srcPath)) {
      manifestPath = srcPath;
    }

    const data = fs.readFileSync(manifestPath, "utf-8");

    const parser = new XMLParser({
      ignoreAttributes: false,
      parseTagValue: true,
    });
    let jObj: ManifestInterface = parser.parse(data);

    return jObj;
  }
}

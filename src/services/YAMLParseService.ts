import fs from "fs";
import _ from "lodash";
import { config } from "dotenv";
import { XMLParser } from "fast-xml-parser";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
config();

const boolean = ["true", "false", "null", "undefined"];

export class YAMLParseService {
  path: string;
  constructor(path: string) {
    this.path = path;
  }

  private getVersionFromManifest(): string {
    try {
      const __dirname = dirname(fileURLToPath(import.meta.url));
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
      const jObj = parser.parse(data);
      return jObj.metadata?.bot?.version || "unknown";
    } catch (e) {
      console.error("[YAMLParseService] Error reading manifest:", e);
      return "unknown";
    }
  }

  execute() {
    const line = this.readline();
    const res_array: string[] = [];
    const version = this.getVersionFromManifest();

    for (let i = 0; i < line.length; i++) {
      var element = line[i];
      var re = /\${(.*?)\}/;

      if (re.exec(element) !== null || re.exec(element)) {
        const extract = re.exec(element) as string[] | null;
        const varName = extract![1];

        if (varName === "version") {
          res_array.push(_.replace(element, extract![0], version));
        } else if (
          process.env![varName] &&
          boolean.includes(process.env[varName]!.trim().toLowerCase())
        ) {
          const boolean_prase_res: boolean | "null" | undefined = this.parseBoolean(
            process.env[varName]!
          );
          res_array.push(_.replace(element, extract![0], String(boolean_prase_res)));
        } else {
          res_array.push(_.replace(element, extract![0], process.env[varName]!));
        }
      } else {
        res_array.push(element);
      }
    }

    return res_array.join("\r\n");
  }

  parseBoolean(value: string) {
    if (typeof value === "string") {
      value = value.trim().toLowerCase();
    }
    switch (value) {
      case "true":
        return true;
      case "null":
        return "null";
      case "undefined":
        return undefined;
      default:
        return false;
    }
  }

  readline() {
    const res_array: string[] = [];

    const res = fs.readFileSync(this.path, "utf-8");

    res.split(/\r?\n/).forEach(function (line) {
      res_array.push(line);
    });

    return res_array;
  }
}
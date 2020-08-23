#!/usr/bin/env node

const fs = require("fs")
const getStdin = require("get-stdin");
const tmp = require("tmp-promise");
const yargs = require("yargs");

const HtmlToPdf = require("./html-to-pdf");


const pageSizes = ["Letter", "Legal", "Tabloid", "Ledger",
                   "A0", "A1", "A2", "A3", "A4", "A5", "A6"];

const argv = yargs
      .usage("Usage: $0 -s Letter -i input.html -o output.pdf")
      .options({
        landscape: { type: "boolean", default: false, alias: "l" },
        pagesize: { choices: pageSizes, default: pageSizes[0], alias: "s" },
        footer: { type: "string", alias: "f",
                    desc: "File with HTML snippet to use as the footer." },
        input: { type: "string", alias: "i",
                   desc: "File to use as HTML input (instead of STDIN)." },
        output: { type: "string", alias: "o",
                    desc: "File to write PDF to (instead of STDOUT)."}
      })
      .argv;

// See https://raszi.github.io/node-tmp/global.html
const tmpOptions = { prefix: "htmltopdf", postfix: ".html" };


async function main() {
  await withInputFile(async inPath => {
    const htmlToPdf = new HtmlToPdf(inPath, {
      format: argv.pagesize,
      landscape: argv.landscape
    });

    if (argv.footer) {
      htmlToPdf.footer = fs.readFileSync(argv.footer, {encoding: "utf8"});
    }
    return await htmlToPdf.writePdf(createOutputStream());
  });
}

async function withInputFile(callback) {
  return argv.input ? callback(argv.input) : withStdinFile(callback);
}

function createOutputStream() {
  return argv.output ? fs.createWriteStream(argv.output) : process.stdout;
}

/**
 * Reads HTML from STDIN and stores it in a temporary file. The file will be
 * cleaned up after the callback returns.
 * @param {pathCallback} callback
 * @return {Promise}
 */
async function withStdinFile(callback) {
  const html = await getStdin();

  return tmp.withFile(async ({path, fd}) => {
    await new Promise(res => fs.writeFile(fd, html, res));
    return callback(path);
  }, tmpOptions);
}


// Start!
main();


/**
 * @callback pageCallback
 * @param {Page} page - A `puppeteer` Page.
 */

/**
 * @callback pathCallback
 * @param {string} path - The filepath to the temporary file.
 */

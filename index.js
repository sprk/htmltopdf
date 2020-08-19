#!/usr/bin/env node

const fs = require("fs")
const getStdin = require("get-stdin");
const puppeteer = require("puppeteer");
const tmp = require("tmp-promise");
const yargs = require("yargs");


const pageSizes = ["Letter", "Legal", "Tabloid", "Ledger",
                   "A0", "A1", "A2", "A3", "A4", "A5", "A6"];

const argv = yargs.options({
  "landscape": { type: "boolean", default: false, alias: "l" },
  "pagesize": { choices: pageSizes, default: pageSizes[0], alias: "s" }
  // TODO: add footer HTML option
}).argv;

// See https://github.com/puppeteer/puppeteer/blob/v5.2.1/docs/api.md#pagepdfoptions
const pdfOptions = {
  margin: { top: "11mm", right: "9mm", bottom: "11mm", left: "9mm" },
  printBackground: true,
  scale: 0.8, // Scale down to match current wkhtmltopdf output.
  landscape: argv.landscape,
  format: argv.pagesize
};

// See https://raszi.github.io/node-tmp/global.html
const tmpOptions = { prefix: "htmltopdf-", postfix: ".html" };


function main() {
  withStdinPage(page => toPdfBuffer(page).then(bufferToStdout));
}

/**
 * Reads HTML from STDIN and visits it in headless-chromium.
 * @param {pageCallback} callback
 * @return {Promise}
 */
async function withStdinPage(callback) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  return withStdinFile(async path => {
    await page.goto(`file://${path}`, { waitUntil: "networkidle0" });
    return callback(page);
  }).finally(() => browser.close());
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
    await callback(path);
  }, tmpOptions);
}

/**
 * @return {Buffer} A PDF render of the given Page.
 * @note This emulates the "screen" CSS media type (instead of "print"), so this
 *   is more of a PDF-screenshot than a print file.
 */
async function toPdfBuffer(page) {
  await page.emulateMediaType("screen");
  return page.pdf(pdfOptions);
}

/** Dump the given buffer to STDOUT. */
async function bufferToStdout(buffer) {
  return new Promise(res => process.stdout.write(buffer, null, res));
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

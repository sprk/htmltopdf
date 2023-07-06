const puppeteer = require("puppeteer");

// See https://github.com/puppeteer/puppeteer/blob/v5.2.1/docs/api.md#pagepdfoptions
const defaultOptions = {
  margin: { top: "11mm", right: "9mm", bottom: "11mm", left: "9mm" },
  printBackground: true,
  headerTemplate: "\n", // Unset default header.
  scale: 0.8, // Scale down to match current wkhtmltopdf output.
  timeout: 60000, // timeout in ms. Default 30000
};


/**
 * A Puppeteer adapter to render an HTML file into a PDF buffer and write it to
 * a Stream.
 */
class HtmlToPdf {
  /**
   * @param {String} inputPath
   * @param {Object} options
   */
  constructor(inputPath, options) {
    this.inputPath = inputPath
    this.pdfOptions = Object.assign({}, defaultOptions, options)
  }


  /**
   * @param {String} html - HTML content to use as a footer on each page.
   *   Scripts will not be evaluated and CSS must be inline.
   */
  set footer(html) {
    this.pdfOptions["displayHeaderFooter"] = !!html;
    this.pdfOptions["footerTemplate"] = html;
  }

  /**
   * @param {Stream} output
   */
  async writePdf(output) {
    await this.withPuppeteerPage(async page => {
      await this.toPdfBuffer(page)
        .then(buffer => this.writeToStream(output, buffer))
    });
  }

  /**
   * @return {Buffer} A PDF render of the given Page.
   * @note This emulates the "screen" CSS media type (instead of "print"), so this
   *   is more of a PDF-screenshot than a print file.
   */
  async toPdfBuffer(page) {
    await page.emulateMediaType("screen");
    return page.pdf(this.pdfOptions);
  }

  /**
   * Visits the input file in headless-chromium and yields its Page.
   * @param {pageCallback} callback
   * @return {Promise}
   */
  async withPuppeteerPage(callback) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    try {
      // networkidle0: will block until 500 ms after network activity finishes.
      // See https://github.com/puppeteer/puppeteer/blob/v5.2.1/docs/api.md#pagegotourl-options
      await page.goto(`file://${this.inputPath}`, { waitUntil: "networkidle0" });
      return await callback(page);
    } finally {
      browser.close();
    }
  }

  writeToStream(stream, buffer) {
    return new Promise(res => stream.write(buffer, null, res));//.finally(() => stream.destroy());
  }
}


module.exports = HtmlToPdf;

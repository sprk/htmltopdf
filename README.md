# Convert HTML to PDF

This project intends to replace [`wkhtmltopdf`](https://wkhtmltopdf.org/) with a
similar executable to convert HTML pages into PDF files.

`wkhtmltopdf` is a convenient and fast tool for converting files to PDF.
Unfortunately, it uses the discontinued
[QtWeb](https://en.wikipedia.org/wiki/QtWeb) rendering engine. There are quite a
few JavaScript and CSS features which it cannot handle.

This tool is a simple NodeJS wrapper script that evokes a headless `chromium`,
to use it's "print-to-pdf" feature to render the HTML page as a PDF.

## Usage

This executable is meant for streaming, so it reads the raw HTML from STDIN and
writes the PDF file to STDOUT:

```sh
htmltopdf -i /path/to/input.html -o /path/to/output.pdf
```

### Commandline Flags

```
Options:
  --help           Show help                                           [boolean]
  --version        Show version number                                 [boolean]
  --landscape, -l                                     [boolean] [default: false]
  --pagesize, -s
       [choices: "Letter", "Legal", "Tabloid", "Ledger", "A0", "A1", "A2", "A3",
                                           "A4", "A5", "A6"] [default: "Letter"]
  --footer, -f     File with HTML snippet to use as the footer.         [string]
  --input, -i      File to use as HTML input (instead of STDIN).        [string]
  --output, -o     File to write PDF to (instead of STDOUT).            [string]
```



## Future Improvements

### Refactor out temporary files

Currently this program dumps the HTML into a temporary file, before opening it
in `chromium`. Ideally, no files would be created and the HTML text would be
passed directly to `chromium` via
[`page.setContent(html)`](https://github.com/puppeteer/puppeteer/blob/v5.2.1/docs/api.md#pagesetcontenthtml-options);
however, at this time `setContent` doesn't trigger any lifecycle events, so it's
not possible to know when the page is done being loaded (and ready to print).

This may be splitting hairs, as our server stores temporary files in
[`tmpfs`](https://en.wikipedia.org/wiki/Tmpfs), which is entirely in RAM anyway.

### Replace with an online service

Every time this executable runs, it has to spin up a fresh instance of
`chromium`, and free it once it's finished. Considering that rendering PDFs is a
core part of the Spark application, it would be better to have an
always-running, microservice version of this app that keeps chromium running. It
could then accepts jobs from Spark via some interface.

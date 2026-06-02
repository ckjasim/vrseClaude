const PDFParser = require('pdf2json');
const parser = new PDFParser();

parser.on('pdfParser_dataReady', (data) => {
  const pages = data.Pages || [];
  let text = '';
  for (const page of pages) {
    for (const t of (page.Texts || [])) {
      for (const r of (t.R || [])) {
        try { text += decodeURIComponent(r.T) + ' '; } catch(e) { text += r.T + ' '; }
      }
    }
    text += '\n';
  }
  process.stdout.write(text.substring(0, 12000));
});

parser.on('pdfParser_dataError', (err) => {
  console.error('Error:', err.parserError);
});

parser.loadPDF('C:/Users/jasim/Downloads/EAF_Steel.pdf');

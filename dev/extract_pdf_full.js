const PDFParser = require('pdf2json');
const fs = require('fs');
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
    text += '\n---PAGE BREAK---\n';
  }
  fs.writeFileSync('C:/autovrse/jsonClaw/dev/unity-discovery/eaf_sop.txt', text, 'utf8');
  console.log('Saved', pages.length, 'pages,', text.length, 'chars');
});

parser.on('pdfParser_dataError', (err) => {
  console.error('Error:', err.parserError);
});

parser.loadPDF('C:/Users/jasim/Downloads/EAF_Steel.pdf');

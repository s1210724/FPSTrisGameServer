const fs = require('fs');
const path = require('path');

const reportDir = path.join(__dirname, '..', 'reports', 'junit');
const xmlPath = path.join(reportDir, 'junit.xml');
const xslPath = path.join(reportDir, 'junit-style.xsl');
const xslHref = 'junit-style.xsl';
const stylesheetDirective = `<?xml-stylesheet type="text/xsl" href="${xslHref}"?>`;

function patchXmlFile() {
  if (!fs.existsSync(xmlPath)) {
    console.warn(`JUnit XML report not found at ${xmlPath}.`);
    return;
  }

  if (!fs.existsSync(xslPath)) {
    console.warn(`Stylesheet not found at ${xslPath}. Please add junit-style.xsl to reports/junit.`);
    return;
  }

  const xml = fs.readFileSync(xmlPath, 'utf8');
  if (xml.includes(stylesheetDirective)) {
    return;
  }

  const lines = xml.split(/\r?\n/);
  const firstLine = lines[0] || '';
  let updated;

  if (firstLine.startsWith('<?xml')) {
    lines.splice(1, 0, stylesheetDirective);
    updated = lines.join('\n');
  } else {
    updated = [stylesheetDirective, ...lines].join('\n');
  }

  fs.writeFileSync(xmlPath, updated, 'utf8');
  console.log(`Injected stylesheet reference into ${xmlPath}`);
}

patchXmlFile();

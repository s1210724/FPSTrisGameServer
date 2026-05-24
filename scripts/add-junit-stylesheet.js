const fs = require('fs');
const path = require('path');

const reportDir = path.join(__dirname, '..', 'reports', 'junit');
const xslPath = path.join(reportDir, 'junit-style.xsl');
const xslHref = 'junit-style.xsl';
const stylesheetDirective = `<?xml-stylesheet type="text/xsl" href="${xslHref}"?>`;

function getXmlFiles() {
  if (!fs.existsSync(reportDir)) {
    return [];
  }
  return fs.readdirSync(reportDir)
    .filter((file) => file.endsWith('.xml'))
    .map((file) => path.join(reportDir, file));
}

function patchXmlFile(xmlPath) {
  const xml = fs.readFileSync(xmlPath, 'utf8');
  if (xml.includes(stylesheetDirective)) {
    return false;
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
  return true;
}

function main() {
  if (!fs.existsSync(xslPath)) {
    console.warn(`Stylesheet not found at ${xslPath}. Please add junit-style.xsl to reports/junit.`);
    return;
  }

  const xmlFiles = getXmlFiles();
  if (!xmlFiles.length) {
    console.warn(`No XML files found in ${reportDir}.`);
    return;
  }

  xmlFiles.forEach((xmlPath) => {
    if (patchXmlFile(xmlPath)) {
      console.log(`Injected stylesheet reference into ${xmlPath}`);
    }
  });
}

main();

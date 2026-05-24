<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:template match="/">
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>JUnit Test Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 1rem; background: #f5f7fb; color: #1f2937; }
          h1 { margin-bottom: 1rem; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
          th, td { padding: 0.75rem 0.85rem; border: 1px solid #d1d5db; }
          th { background: #e5e7eb; text-align: left; }
          tr:nth-child(even) { background: #ffffff; }
          tr:nth-child(odd) { background: #f9fafb; }
          .suite-row { cursor: pointer; }
          .suite-row:hover { background: #e2e8f0; }
          .details { display: none; }
          .details.show { display: table-row; }
          .details td { padding: 0; border: none; background: #fff; }
          .details-table { width: 100%; border-collapse: collapse; }
          .details-table th, .details-table td { padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; }
          .summary { margin-bottom: 1rem; }
          .summary span { display: inline-block; margin-right: 1rem; }
          .pass { color: #047857; font-weight: 700; }
          .fail { color: #b91c1c; font-weight: 700; }
        </style>
        <script type="text/javascript">
          function toggleDetails(el) {
            var details = el.nextElementSibling;
            if (!details || details.className.indexOf('details') === -1) return;
            if (details.classList) {
              details.classList.toggle('show');
            } else {
              details.className = details.className.indexOf('show') > -1 ? 'details' : 'details show';
            }
          }
        </script>
      </head>
      <body>
        <h1>JUnit Test Report</h1>
        <div class="summary">
          <span>Total suites: <xsl:value-of select="count(//testsuite)"/></span>
          <span>Total tests: <xsl:value-of select="/testsuites/@tests"/></span>
          <span class="pass">Passed: <xsl:value-of select="/testsuites/@tests - /testsuites/@failures - /testsuites/@errors"/></span>
          <span class="fail">Failures: <xsl:value-of select="/testsuites/@failures"/></span>
          <span>Errors: <xsl:value-of select="/testsuites/@errors"/></span>
          <span>Time: <xsl:value-of select="/testsuites/@time"/>s</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Suite</th>
              <th>Tests</th>
              <th>Failures</th>
              <th>Errors</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="//testsuite">
              <tr class="suite-row" onclick="toggleDetails(this)">
                <td><xsl:value-of select="@name"/></td>
                <td><xsl:value-of select="@tests"/></td>
                <td><xsl:value-of select="@failures"/></td>
                <td><xsl:value-of select="@errors"/></td>
                <td><xsl:value-of select="@time"/>s</td>
              </tr>
              <tr class="details">
                <td colspan="5">
                  <table class="details-table">
                    <thead>
                      <tr>
                        <th>Test Case</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      <xsl:for-each select="testcase">
                        <tr>
                          <td><xsl:value-of select="@name"/></td>
                          <td><xsl:value-of select="@time"/>s</td>
                        </tr>
                      </xsl:for-each>
                    </tbody>
                  </table>
                </td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

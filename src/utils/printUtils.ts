/**
 * Reliable Cross-Environment Printing Utility
 * Works seamlessly within sandboxed iframes, popups, and standard browser tabs.
 */

export function printHtmlDocument(title: string, htmlBody: string): boolean {
  try {
    // 1. Try hidden iframe printing first (doesn't navigate away or pop up blockers)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', title);
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <style>
              @page {
                size: letter portrait;
                margin: 12mm 15mm;
              }
              *, *::before, *::after {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #09090b;
                background: #ffffff;
                font-size: 12px;
                line-height: 1.4;
                padding: 0;
                margin: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .slip-container {
                max-width: 100%;
                margin: 0 auto;
              }
              .border-b-thick { border-bottom: 2px solid #18181b; }
              .border-b { border-bottom: 1px solid #e4e4e7; }
              .border-t { border-top: 1px solid #e4e4e7; }
              .border-dashed-t { border-top: 2px dashed #a1a1aa; }
              .border { border: 1px solid #d4d4d8; }
              .border-2 { border: 2px solid #a1a1aa; }
              .bg-zinc-50 { background-color: #f8fafc; }
              .bg-zinc-100 { background-color: #f4f4f5; }
              .bg-amber-50 { background-color: #fffbeb; }
              .bg-rose-50 { background-color: #fff1f2; }
              .bg-emerald-50 { background-color: #ecfdf5; }
              .text-zinc-900 { color: #18181b; }
              .text-zinc-700 { color: #3f3f46; }
              .text-zinc-500 { color: #71717a; }
              .text-amber-800 { color: #92400e; }
              .text-rose-800 { color: #9f1239; }
              .text-emerald-800 { color: #065f46; }
              .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
              .font-bold { font-weight: 700; }
              .font-extrabold { font-weight: 800; }
              .font-black { font-weight: 900; }
              .uppercase { text-transform: uppercase; }
              .text-xs { font-size: 11px; }
              .text-sm { font-size: 13px; }
              .text-base { font-size: 15px; }
              .text-lg { font-size: 18px; }
              .p-2 { padding: 8px; }
              .p-3 { padding: 12px; }
              .p-4 { padding: 16px; }
              .mb-1 { margin-bottom: 4px; }
              .mb-2 { margin-bottom: 8px; }
              .mb-3 { margin-bottom: 12px; }
              .mb-4 { margin-bottom: 16px; }
              .mt-1 { margin-top: 4px; }
              .mt-2 { margin-top: 8px; }
              .mt-3 { margin-top: 12px; }
              .mt-4 { margin-top: 16px; }
              .grid-2 {
                display: table;
                width: 100%;
                table-layout: fixed;
                margin-bottom: 12px;
              }
              .col {
                display: table-cell;
                vertical-align: top;
                width: 50%;
                padding: 0 6px;
              }
              .col:first-child { padding-left: 0; }
              .col:last-child { padding-right: 0; }
              .rounded { border-radius: 4px; }
              .flex-row { display: flex; justify-content: space-between; align-items: center; }
              .badge {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
              }
              .checkbox-box {
                display: inline-block;
                width: 12px;
                height: 12px;
                border: 1px solid #71717a;
                margin-right: 4px;
                vertical-align: middle;
              }
              .sig-line {
                border-bottom: 1px solid #71717a;
                height: 24px;
                margin-bottom: 2px;
              }
            </style>
          </head>
          <body>
            <div class="slip-container">
              ${htmlBody}
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn("Iframe print triggered fallback:", e);
          fallbackPrint(title, htmlBody);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 60000);
        }
      }, 350);

      return true;
    }
  } catch (err) {
    console.warn("Direct iframe print failed, using fallback:", err);
  }

  return fallbackPrint(title, htmlBody);
}

function fallbackPrint(title: string, htmlBody: string): boolean {
  try {
    const printWindow = window.open('', '_blank', 'width=850,height=900,menubar=yes,toolbar=yes');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <style>
              @page { size: letter portrait; margin: 12mm 15mm; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #09090b;
                background: #ffffff;
                font-size: 12px;
                line-height: 1.4;
                padding: 15px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print { display: block; text-align: center; margin-bottom: 15px; }
              @media print { .no-print { display: none !important; } }
              .btn-print {
                background: #4f46e5;
                color: white;
                font-weight: bold;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
              }
              .border-b-thick { border-bottom: 2px solid #18181b; }
              .border-b { border-bottom: 1px solid #e4e4e7; }
              .border-t { border-top: 1px solid #e4e4e7; }
              .border-dashed-t { border-top: 2px dashed #a1a1aa; }
              .border { border: 1px solid #d4d4d8; }
              .border-2 { border: 2px solid #a1a1aa; }
              .bg-zinc-50 { background-color: #f8fafc; }
              .bg-zinc-100 { background-color: #f4f4f5; }
              .bg-amber-50 { background-color: #fffbeb; }
              .bg-rose-50 { background-color: #fff1f2; }
              .bg-emerald-50 { background-color: #ecfdf5; }
              .text-zinc-900 { color: #18181b; }
              .text-zinc-700 { color: #3f3f46; }
              .text-zinc-500 { color: #71717a; }
              .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
              .font-bold { font-weight: 700; }
              .font-extrabold { font-weight: 800; }
              .uppercase { text-transform: uppercase; }
              .p-2 { padding: 8px; }
              .p-3 { padding: 12px; }
              .p-4 { padding: 16px; }
              .mb-1 { margin-bottom: 4px; }
              .mb-2 { margin-bottom: 8px; }
              .mb-3 { margin-bottom: 12px; }
              .mt-1 { margin-top: 4px; }
              .mt-2 { margin-top: 8px; }
              .grid-2 { display: table; width: 100%; table-layout: fixed; margin-bottom: 12px; }
              .col { display: table-cell; vertical-align: top; width: 50%; padding: 0 6px; }
              .col:first-child { padding-left: 0; }
              .col:last-child { padding-right: 0; }
              .rounded { border-radius: 4px; }
              .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold; }
              .checkbox-box { display: inline-block; width: 12px; height: 12px; border: 1px solid #71717a; margin-right: 4px; vertical-align: middle; }
              .sig-line { border-bottom: 1px solid #71717a; height: 24px; margin-bottom: 2px; }
            </style>
          </head>
          <body>
            <div class="no-print">
              <button class="btn-print" onclick="window.print()">🖨️ Click Here to Print Work Order Slip</button>
            </div>
            ${htmlBody}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return true;
    }
  } catch (popupErr) {
    console.error("Popup print fallback also failed:", popupErr);
  }

  // Last resort: invoke window.print directly on current window
  window.print();
  return true;
}

export function downloadHtmlSlip(filename: string, title: string, htmlBody: string) {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: letter portrait; margin: 12mm 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #09090b;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.4;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .no-print { text-align: center; margin-bottom: 20px; }
    @media print { .no-print { display: none !important; } }
    .btn { background: #4f46e5; color: white; padding: 8px 16px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }
    .border-b-thick { border-bottom: 2px solid #18181b; }
    .border-b { border-bottom: 1px solid #e4e4e7; }
    .border-t { border-top: 1px solid #e4e4e7; }
    .border-dashed-t { border-top: 2px dashed #a1a1aa; }
    .border { border: 1px solid #d4d4d8; }
    .border-2 { border: 2px solid #a1a1aa; }
    .bg-zinc-50 { background-color: #f8fafc; }
    .bg-amber-50 { background-color: #fffbeb; }
    .bg-rose-50 { background-color: #fff1f2; }
    .bg-emerald-50 { background-color: #ecfdf5; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-bold { font-weight: 700; }
    .font-extrabold { font-weight: 800; }
    .uppercase { text-transform: uppercase; }
    .p-2 { padding: 8px; }
    .p-3 { padding: 12px; }
    .p-4 { padding: 16px; }
    .mb-1 { margin-bottom: 4px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .mt-1 { margin-top: 4px; }
    .mt-2 { margin-top: 8px; }
    .grid-2 { display: table; width: 100%; table-layout: fixed; margin-bottom: 12px; }
    .col { display: table-cell; vertical-align: top; width: 50%; padding: 0 6px; }
    .col:first-child { padding-left: 0; }
    .col:last-child { padding-right: 0; }
    .rounded { border-radius: 4px; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold; }
    .checkbox-box { display: inline-block; width: 12px; height: 12px; border: 1px solid #71717a; margin-right: 4px; vertical-align: middle; }
    .sig-line { border-bottom: 1px solid #71717a; height: 24px; margin-bottom: 2px; }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn" onclick="window.print()">🖨️ Print this Work Order</button>
  </div>
  ${htmlBody}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

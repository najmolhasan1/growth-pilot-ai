interface ExportableArticle {
  title: string;
  description: string;
  slug: string;
  html: string;
  ogTags: Record<string, string>;
  schema: Record<string, unknown>;
}

export function articleFileBaseName(value: string): string {
  return (value || 'article')
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'article';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(value: string): string {
  return escapeHtml(value).replace(/\u0000/g, '');
}

function articleRoot(html: string): HTMLElement {
  const documentValue = new DOMParser().parseFromString(`<article>${html}</article>`, 'text/html');
  return documentValue.querySelector('article') as HTMLElement;
}

export function articleToPlainText(html: string): string {
  const root = articleRoot(html);
  root.querySelectorAll('script, style').forEach(node => node.remove());
  root.querySelectorAll('br').forEach(node => node.replaceWith('\n'));
  root.querySelectorAll('li').forEach(node => node.prepend('- '));
  root.querySelectorAll('h1, h2, h3, h4, p, li, tr, nav, section').forEach(node => node.append('\n\n'));
  return (root.textContent || '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildArticleHtml(article: ExportableArticle): string {
  const schemaJson = JSON.stringify(article.schema, null, 2).replace(/<\/script/gi, '<\\/script');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(article.title)}</title>
  <meta name="description" content="${escapeHtml(article.description)}">
  <meta property="og:title" content="${escapeHtml(article.ogTags['og:title'] || article.title)}">
  <meta property="og:description" content="${escapeHtml(article.ogTags['og:description'] || article.description)}">
  <meta property="og:type" content="article">
  <script type="application/ld+json">${schemaJson}</script>
</head>
<body>
${article.html}
</body>
</html>`;
}

export function articleToMarkdown(html: string): string {
  const root = articleRoot(html);
  const convert = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (!(node instanceof HTMLElement)) return '';
    const content = Array.from(node.childNodes).map(convert).join('');
    switch (node.tagName.toLowerCase()) {
      case 'h1': return `# ${content.trim()}\n\n`;
      case 'h2': return `## ${content.trim()}\n\n`;
      case 'h3': return `### ${content.trim()}\n\n`;
      case 'p': return `${content.trim()}\n\n`;
      case 'strong':
      case 'b': return `**${content.trim()}**`;
      case 'em':
      case 'i': return `*${content.trim()}*`;
      case 'a': return `[${content.trim()}](${node.getAttribute('href') || ''})`;
      case 'li': return `- ${content.trim()}\n`;
      case 'ul':
      case 'ol': return `${content}\n`;
      case 'img': return `![${node.getAttribute('alt') || ''}](${node.getAttribute('src') || ''})\n\n`;
      case 'br': return '\n';
      case 'table': return `\n${node.innerText.trim()}\n\n`;
      default: return content;
    }
  };
  return Array.from(root.childNodes).map(convert).join('').replace(/\n{3,}/g, '\n\n').trim();
}

function wordParagraph(text: string, style?: string): string {
  const paragraphStyle = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : '';
  return `<w:p>${paragraphStyle}<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function htmlToWordXml(html: string): string {
  const root = articleRoot(html);
  const convert = (element: Element): string => {
    const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
    switch (element.tagName.toLowerCase()) {
      case 'h1': return wordParagraph(text, 'Heading1');
      case 'h2': return wordParagraph(text, 'Heading2');
      case 'h3': return wordParagraph(text, 'Heading3');
      case 'p': return wordParagraph(text);
      case 'img': return wordParagraph(`[Image: ${element.getAttribute('alt') || 'Article image'}]`);
      case 'li': return wordParagraph(`\u2022 ${text}`, 'ListParagraph');
      case 'table': {
        const rows = Array.from(element.querySelectorAll('tr')).map(row => {
          const cells = Array.from(row.querySelectorAll('th, td')).map(cell =>
            `<w:tc><w:tcPr><w:tcW w:w="3200" w:type="dxa"/></w:tcPr>${wordParagraph((cell.textContent || '').trim())}</w:tc>`,
          ).join('');
          return `<w:tr>${cells}</w:tr>`;
        }).join('');
        return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr>${rows}</w:tbl>`;
      }
      case 'ul':
      case 'ol':
        return Array.from(element.children).map(convert).join('');
      default:
        return Array.from(element.children).map(convert).join('') || (text ? wordParagraph(text) : '');
    }
  };
  return Array.from(root.children).map(convert).join('');
}

function uint16(value: number): Uint8Array {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function uint32(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const combined = new Uint8Array(length);
  let offset = 0;
  parts.forEach(part => {
    combined.set(part, offset);
    offset += part.length;
  });
  return combined;
}

function crc32(bytes: Uint8Array): number {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function buildZip(files: Array<{ name: string; content: string }>): Blob {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let localOffset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const content = encoder.encode(file.content);
    const crc = crc32(content);
    const local = concatBytes([
      uint32(0x04034b50), uint16(20), uint16(0x0800), uint16(0), uint16(0), uint16(0),
      uint32(crc), uint32(content.length), uint32(content.length), uint16(name.length), uint16(0), name, content,
    ]);
    const directory = concatBytes([
      uint32(0x02014b50), uint16(20), uint16(20), uint16(0x0800), uint16(0), uint16(0), uint16(0),
      uint32(crc), uint32(content.length), uint32(content.length), uint16(name.length), uint16(0), uint16(0),
      uint16(0), uint16(0), uint32(0), uint32(localOffset), name,
    ]);
    locals.push(local);
    central.push(directory);
    localOffset += local.length;
  }

  const centralDirectory = concatBytes(central);
  const endRecord = concatBytes([
    uint32(0x06054b50), uint16(0), uint16(0), uint16(files.length), uint16(files.length),
    uint32(centralDirectory.length), uint32(localOffset), uint16(0),
  ]);
  const zippedBytes = concatBytes([...locals, centralDirectory, endRecord]);
  const zippedBuffer = new ArrayBuffer(zippedBytes.length);
  new Uint8Array(zippedBuffer).set(zippedBytes);
  return new Blob([zippedBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

export function buildDocx(article: ExportableArticle): Blob {
  const body = htmlToWordXml(article.html);
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body>
</w:document>`;
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="34"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:pPr><w:ind w:left="720"/></w:pPr></w:style>
</w:styles>`;
  return buildZip([
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    },
    {
      name: 'word/_rels/document.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    { name: 'word/document.xml', content: documentXml },
    { name: 'word/styles.xml', content: stylesXml },
  ]);
}

export function buildWordHtmlDocument(article: ExportableArticle): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="UTF-8"><title>${escapeHtml(article.title)}</title></head>
<body>${article.html}</body>
</html>`;
}

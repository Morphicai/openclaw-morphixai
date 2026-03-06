/**
 * Jira Atlassian Document Format (ADF) Helpers
 *
 * Jira Cloud API v3 requires all rich-text fields (description, comments)
 * to use ADF (a structured JSON format) instead of plain text or Markdown.
 *
 * These helpers convert plain text and basic Markdown into ADF.
 */

export interface AdfNode {
  type: string;
  version?: number;
  content?: AdfNode[];
  text?: string;
  attrs?: Record<string, any>;
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
}

/**
 * Wrap content nodes in a top-level ADF document.
 */
export function adfDoc(content: AdfNode[]): AdfNode {
  return { type: "doc", version: 1, content };
}

/**
 * Create an ADF paragraph node from inline content.
 */
export function adfParagraph(content: AdfNode[]): AdfNode {
  return { type: "paragraph", content };
}

/**
 * Create an ADF text node with optional marks.
 */
export function adfText(
  text: string,
  marks?: Array<{ type: string; attrs?: Record<string, any> }>,
): AdfNode {
  const node: AdfNode = { type: "text", text };
  if (marks && marks.length > 0) node.marks = marks;
  return node;
}

/**
 * Create an ADF heading node.
 */
export function adfHeading(level: number, text: string): AdfNode {
  return {
    type: "heading",
    attrs: { level },
    content: [adfText(text)],
  };
}

/**
 * Create an ADF code block node.
 */
export function adfCodeBlock(code: string, language?: string): AdfNode {
  const node: AdfNode = {
    type: "codeBlock",
    content: [adfText(code)],
  };
  if (language) node.attrs = { language };
  return node;
}

/**
 * Create an ADF bullet list from text items.
 */
export function adfBulletList(items: string[]): AdfNode {
  return {
    type: "bulletList",
    content: items.map((text) => ({
      type: "listItem",
      content: [adfParagraph([adfText(text)])],
    })),
  };
}

/**
 * Create an ADF ordered list from text items.
 */
export function adfOrderedList(items: string[]): AdfNode {
  return {
    type: "orderedList",
    content: items.map((text) => ({
      type: "listItem",
      content: [adfParagraph([adfText(text)])],
    })),
  };
}

/**
 * Parse inline Markdown formatting into ADF inline nodes.
 * Supports: **bold**, *italic*, `code`, [link](url)
 */
function parseInlineMarkdown(text: string): AdfNode[] {
  const nodes: AdfNode[] = [];
  // Regex to match: **bold**, *italic*, `code`, [text](url)
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    // Add preceding plain text
    if (match.index > lastIndex) {
      nodes.push(adfText(text.slice(lastIndex, match.index)));
    }

    if (match[2]) {
      // **bold**
      nodes.push(adfText(match[2], [{ type: "strong" }]));
    } else if (match[3]) {
      // *italic*
      nodes.push(adfText(match[3], [{ type: "em" }]));
    } else if (match[4]) {
      // `code`
      nodes.push(adfText(match[4], [{ type: "code" }]));
    } else if (match[5] && match[6]) {
      // [text](url)
      nodes.push(
        adfText(match[5], [{ type: "link", attrs: { href: match[6] } }]),
      );
    }
    lastIndex = match.index + match[0].length;
  }

  // Trailing plain text
  if (lastIndex < text.length) {
    nodes.push(adfText(text.slice(lastIndex)));
  }

  // If no inline formatting found, return single text node
  if (nodes.length === 0) {
    nodes.push(adfText(text));
  }

  return nodes;
}

/**
 * Convert plain text to an ADF document.
 * Splits by newlines into paragraphs.
 */
export function textToAdf(text: string): AdfNode {
  const lines = text.split("\n");
  const content: AdfNode[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      // Empty line → empty paragraph (spacing)
      content.push(adfParagraph([adfText(" ")]));
    } else {
      content.push(adfParagraph(parseInlineMarkdown(line)));
    }
  }

  return adfDoc(content);
}

/**
 * Convert basic Markdown to an ADF document.
 *
 * Supported Markdown:
 * - Headings: # H1, ## H2, ### H3
 * - Bold: **text**
 * - Italic: *text*
 * - Inline code: `code`
 * - Links: [text](url)
 * - Code blocks: ```language\ncode\n```
 * - Bullet lists: - item or * item
 * - Ordered lists: 1. item
 * - Paragraphs: separated by blank lines
 */
export function markdownToAdf(markdown: string): AdfNode {
  const lines = markdown.split("\n");
  const content: AdfNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      content.push(adfCodeBlock(codeLines.join("\n"), lang));
      i++; // skip closing ```
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      content.push(adfHeading(headingMatch[1].length, headingMatch[2]));
      i++;
      continue;
    }

    // Bullet list (collect consecutive items)
    if (/^[\-\*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\-\*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[\-\*]\s+/, ""));
        i++;
      }
      content.push(adfBulletList(items));
      continue;
    }

    // Ordered list (collect consecutive items)
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      content.push(adfOrderedList(items));
      continue;
    }

    // Empty line → skip
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-empty lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !/^[\-\*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      content.push(adfParagraph(parseInlineMarkdown(paraLines.join(" "))));
    }
  }

  // Ensure at least one content node
  if (content.length === 0) {
    content.push(adfParagraph([adfText(markdown || " ")]));
  }

  return adfDoc(content);
}

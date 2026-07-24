import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {
  type Color,
  PDFDocument,
  PDFField,
  PDFName,
  PDFString,
  StandardFonts,
  TextAlignment,
  rgb,
} from 'pdf-lib';
import {
  BOARD_SIZE,
  BOARD_SIZE_PT,
  BUTTON_COLOR,
  CELL_BACKGROUND,
  CELL_SIZE,
  COMPATIBILITY_OUTPUT_FILE,
  CONTROL_LEFT,
  FIELD_NAMES,
  FRAME_COLOR,
  GRID_BOTTOM,
  GRID_COLOR,
  GRID_LEFT,
  OUTPUT_DIRECTORY,
  OUTPUT_FILE,
  PAGE_BACKGROUND,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  TEXT_COLOR,
} from './constants.js';
import {buildDirectionScript, buildStartScript} from './game_script.js';

type TextFieldOptions = {
  name: string;
  value?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  alignment?: TextAlignment;
  label?: string;
  backgroundColor?: Color;
  borderColor?: Color;
  borderWidth?: number;
  textColor?: Color;
};

function color(value: {r: number; g: number; b: number}): Color {
  return rgb(value.r, value.g, value.b);
}

function addJavaScriptAction(field: PDFField, script: string): void {
  const action = field.acroField.dict.context.obj({
    S: PDFName.of('JavaScript'),
    JS: PDFString.of(script),
  });
  field.acroField.getWidgets().forEach((widget) => {
    widget.dict.set(PDFName.of('A'), action);
  });
}

async function addTextField(
  pdfDoc: PDFDocument,
  options: TextFieldOptions,
): Promise<void> {
  const page = pdfDoc.getPages()[0];
  const form = pdfDoc.getForm();
  const field = form.createTextField(options.name);
  const font = await pdfDoc.embedFont(StandardFonts.CourierBold);
  field.setText(options.value ?? '');
  field.enableReadOnly();
  field.addToPage(page, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    textColor: options.textColor ?? color(TEXT_COLOR),
    backgroundColor: options.backgroundColor ?? color(CELL_BACKGROUND),
    borderColor: options.borderColor ?? color(CELL_BACKGROUND),
    borderWidth: options.borderWidth ?? 0,
    font,
  });
  field.setFontSize(options.fontSize ?? 20);
  if (options.alignment !== undefined) {
    field.setAlignment(options.alignment);
  }
  if (options.label) {
    page.drawText(options.label, {
      x: options.x,
      y: options.y + options.height + 5,
      size: 9,
      color: color(TEXT_COLOR),
    });
  }
}

function addButton(
  pdfDoc: PDFDocument,
  name: string,
  label: string,
  x: number,
  y: number,
  script: string,
  width: number,
  height: number,
): void {
  const page = pdfDoc.getPages()[0];
  const button = pdfDoc.getForm().createButton(name);
  button.addToPage(label, page, {
    x,
    y,
    width,
    height,
    textColor: rgb(1, 1, 1),
    backgroundColor: color(BUTTON_COLOR),
    borderColor: color(FRAME_COLOR),
    borderWidth: 1,
  });
  addJavaScriptAction(button, script);
}

function addPageGraphics(pdfDoc: PDFDocument): void {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: color(PAGE_BACKGROUND),
  });
  page.drawText('PDF 2048', {
    x: GRID_LEFT,
    y: 458,
    size: 25,
    color: color(FRAME_COLOR),
  });
  page.drawText('A playable 2048 game running inside a PDF file.', {
    x: GRID_LEFT,
    y: 438,
    size: 10,
    color: color(TEXT_COLOR),
  });
  page.drawText('Works best in Chrome desktop PDF viewer.', {
    x: GRID_LEFT,
    y: 423,
    size: 10,
    color: color(TEXT_COLOR),
  });
  page.drawText('Tiles update as ASCII numbers. The board background is static.', {
    x: GRID_LEFT,
    y: 408,
    size: 9,
    color: color(TEXT_COLOR),
  });

  page.drawRectangle({
    x: GRID_LEFT - 10,
    y: GRID_BOTTOM - 10,
    width: BOARD_SIZE_PT + 20,
    height: BOARD_SIZE_PT + 20,
    color: color(FRAME_COLOR),
  });
  page.drawRectangle({
    x: GRID_LEFT - 4,
    y: GRID_BOTTOM - 4,
    width: BOARD_SIZE_PT + 8,
    height: BOARD_SIZE_PT + 8,
    color: color(GRID_COLOR),
  });
  page.drawRectangle({
    x: GRID_LEFT,
    y: GRID_BOTTOM,
    width: BOARD_SIZE_PT,
    height: BOARD_SIZE_PT,
    color: color(CELL_BACKGROUND),
  });

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      page.drawRectangle({
        x: GRID_LEFT + col * CELL_SIZE + 1,
        y: GRID_BOTTOM + row * CELL_SIZE + 1,
        width: CELL_SIZE - 2,
        height: CELL_SIZE - 2,
        color: color(CELL_BACKGROUND),
      });
    }
  }

  for (let index = 0; index <= BOARD_SIZE; index += 1) {
    const offset = index * CELL_SIZE;
    page.drawLine({
      start: {x: GRID_LEFT + offset, y: GRID_BOTTOM},
      end: {x: GRID_LEFT + offset, y: GRID_BOTTOM + BOARD_SIZE_PT},
      thickness: index === 0 || index === BOARD_SIZE ? 1.4 : 0.65,
      color: color(GRID_COLOR),
    });
    page.drawLine({
      start: {x: GRID_LEFT, y: GRID_BOTTOM + offset},
      end: {x: GRID_LEFT + BOARD_SIZE_PT, y: GRID_BOTTOM + offset},
      thickness: index === 0 || index === BOARD_SIZE ? 1.4 : 0.65,
      color: color(GRID_COLOR),
    });
  }

  page.drawText('Click START, then use the direction buttons.', {
    x: CONTROL_LEFT,
    y: 458,
    size: 11,
    color: color(TEXT_COLOR),
  });
  page.drawText('Each button press performs one move.', {
    x: CONTROL_LEFT,
    y: 442,
    size: 9,
    color: color(TEXT_COLOR),
  });
  page.drawText('2048 shows CLEAR!. No moves left shows FAILED.', {
    x: CONTROL_LEFT,
    y: 427,
    size: 9,
    color: color(TEXT_COLOR),
  });
}

async function addBoardFields(pdfDoc: PDFDocument): Promise<void> {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      await addTextField(pdfDoc, {
        name: `cell_${row}_${col}`,
        value: '',
        x: GRID_LEFT + col * CELL_SIZE + 2,
        y: GRID_BOTTOM + (BOARD_SIZE - row - 1) * CELL_SIZE + 2,
        width: CELL_SIZE - 4,
        height: CELL_SIZE - 4,
        fontSize: 21,
        alignment: TextAlignment.Center,
        backgroundColor: color(CELL_BACKGROUND),
        borderColor: color(CELL_BACKGROUND),
        borderWidth: 0,
        textColor: color(TEXT_COLOR),
      });
    }
  }
}

async function addControlFields(pdfDoc: PDFDocument): Promise<void> {
  await addTextField(pdfDoc, {
    name: FIELD_NAMES.score,
    label: 'Score',
    value: '0',
    x: CONTROL_LEFT,
    y: 382,
    width: 84,
    height: 25,
    fontSize: 16,
    alignment: TextAlignment.Center,
    backgroundColor: color(CELL_BACKGROUND),
    borderColor: color(GRID_COLOR),
    borderWidth: 1,
  });
  await addTextField(pdfDoc, {
    name: FIELD_NAMES.message,
    label: 'Message',
    value: 'READY',
    x: CONTROL_LEFT + 98,
    y: 382,
    width: 196,
    height: 25,
    fontSize: 14,
    alignment: TextAlignment.Center,
    backgroundColor: color(CELL_BACKGROUND),
    borderColor: color(GRID_COLOR),
    borderWidth: 1,
  });
}

function addGameButtons(pdfDoc: PDFDocument): void {
  addButton(
    pdfDoc,
    FIELD_NAMES.start,
    'START / RETRY',
    CONTROL_LEFT,
    320,
    buildStartScript(),
    294,
    38,
  );
  addButton(pdfDoc, FIELD_NAMES.up, 'UP', CONTROL_LEFT + 118, 263, buildDirectionScript('UP'), 58, 28);
  addButton(pdfDoc, FIELD_NAMES.left, 'LEFT', CONTROL_LEFT + 52, 227, buildDirectionScript('LEFT'), 58, 28);
  addButton(pdfDoc, FIELD_NAMES.right, 'RIGHT', CONTROL_LEFT + 184, 227, buildDirectionScript('RIGHT'), 58, 28);
  addButton(pdfDoc, FIELD_NAMES.down, 'DOWN', CONTROL_LEFT + 118, 191, buildDirectionScript('DOWN'), 58, 28);
}

async function createPdf(): Promise<PDFDocument> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('PDF 2048');
  pdfDoc.setAuthor('pdf-2048');
  pdfDoc.setSubject('Playable 2048 PDF generated with TypeScript and pdf-lib');
  addPageGraphics(pdfDoc);
  await addBoardFields(pdfDoc);
  await addControlFields(pdfDoc);
  addGameButtons(pdfDoc);
  return pdfDoc;
}

async function savePdf(pdfDoc: PDFDocument): Promise<string> {
  const outputDirectory = path.resolve(OUTPUT_DIRECTORY);
  await mkdir(outputDirectory, {recursive: true});
  const outputPath = path.join(outputDirectory, OUTPUT_FILE);
  const bytes = await pdfDoc.save({
    updateFieldAppearances: true,
    useObjectStreams: false,
  });
  await writeFile(outputPath, bytes);
  await writeFile(path.join(outputDirectory, COMPATIBILITY_OUTPUT_FILE), bytes);
  return outputPath;
}

async function verify(outputPath: string): Promise<void> {
  const pdfDoc = await PDFDocument.load(await readFile(outputPath));
  if (pdfDoc.getPageCount() !== 1) {
    throw new Error('Expected exactly one PDF page.');
  }
  const pageSize = pdfDoc.getPage(0).getSize();
  if (Math.round(pageSize.width) !== PAGE_WIDTH || Math.round(pageSize.height) !== PAGE_HEIGHT) {
    throw new Error(`Unexpected page size: ${pageSize.width} x ${pageSize.height}`);
  }

  const fieldNames = pdfDoc.getForm().getFields().map((field) => field.getName());
  const requiredFields = [
    FIELD_NAMES.score,
    FIELD_NAMES.message,
    FIELD_NAMES.start,
    FIELD_NAMES.up,
    FIELD_NAMES.down,
    FIELD_NAMES.left,
    FIELD_NAMES.right,
    ...Array.from({length: BOARD_SIZE}, (_, row) =>
      Array.from({length: BOARD_SIZE}, (_, col) => `cell_${row}_${col}`),
    ).flat(),
  ];
  for (const fieldName of requiredFields) {
    if (!fieldNames.includes(fieldName)) {
      throw new Error(`Missing required field: ${fieldName}`);
    }
  }
  if (fieldNames.length !== requiredFields.length) {
    throw new Error(`Unexpected field count: ${fieldNames.length}`);
  }
  if (fieldNames.includes('best') || fieldNames.includes('status')) {
    throw new Error('MVP PDF should not contain best or status fields.');
  }

  const startScript = buildStartScript();
  const requiredRuntimeSnippets = [
    "pdf2048State = 'READY'",
    "pdf2048State = 'RUNNING'",
    "pdf2048State = 'WIN'",
    "pdf2048State = 'GAME_OVER'",
    'pdf2048MergeLine',
    'pdf2048AddRandomTile',
    'pdf2048Render',
    "return 'CLEAR!'",
    "return 'FAILED'",
  ];
  for (const snippet of requiredRuntimeSnippets) {
    if (!startScript.includes(snippet)) {
      throw new Error(`Missing runtime snippet: ${snippet}`);
    }
  }
  if (startScript.includes('fillColor') || startScript.includes('setInterval')) {
    throw new Error('Runtime must not change fillColor or use setInterval.');
  }
  console.log(`Verified ${requiredFields.length} PDF fields and runtime structure.`);
}

async function main(): Promise<void> {
  const outputPath = await savePdf(await createPdf());
  console.log(`Generated ${outputPath}`);
  if (process.argv.includes('--verify')) {
    await verify(outputPath);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

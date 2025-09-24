import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * 合并同一行中连续的文字块
 */
export function mergeTextItems(items: any[], xTolerance = 10, yTolerance = 10) {
  // 按 y 坐标分行
  const linesMap: Record<number, any[]> = {};
  items.forEach((item) => {
    const y = Math.round(item.transform[5] / yTolerance) * yTolerance;
    if (!linesMap[y]) linesMap[y] = [];
    linesMap[y].push(item);
  });

  const mergedLines: {
    y: number;
    blocks: {
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }[];
  }[] = [];

  Object.keys(linesMap).forEach((yKey) => {
    const lineItems = linesMap[+yKey].sort(
      (a, b) => a.transform[4] - b.transform[4],
    );

    const blocks: (typeof mergedLines)[0]["blocks"] = [];
    let currentBlock: any = null;

    lineItems.forEach((item) => {
      const x = item.transform[4];
      const y = item.transform[5];
      if (!currentBlock) {
        currentBlock = {
          text: item.str,
          x,
          y,
          width: item.width,
          height: item.height,
        };
      } else {
        // 判断是否连续：当前片段与上一块的间距是否小于容差
        const gap = x - (currentBlock.x + currentBlock.width);
        if (gap <= xTolerance) {
          // 连续 → 拼接
          currentBlock.text += item.str;
          currentBlock.width = x + item.width - currentBlock.x;
          currentBlock.height = Math.max(currentBlock.height, item.height);
        } else {
          // 不连续 → 保存上一块，开启新块
          blocks.push(currentBlock);
          currentBlock = {
            text: item.str,
            x,
            y,
            width: item.width,
            height: item.height,
          };
        }
      }
    });

    if (currentBlock) blocks.push(currentBlock);

    mergedLines.push({ y: +yKey, blocks });
  });

  // 按 y 从上到下排序
  return mergedLines
    .sort((a, b) => b.y - a.y)
    .map((it) => it.blocks.map((t) => t.text))
    .flat(3);
}
/**
 * 提取发票关键信息
 */
function extractInvoiceInfo(lines: string[]) {
  lines = lines.map((it) => it.replace(/ /g, "")).filter(Boolean);

  let mayBeMoney = lines
    .filter((it) => it.includes("¥"))
    .map((it) =>
      it
        .split("¥")
        .filter(Boolean)
        .map((it) => parseFloat(it)),
    )
    .flat(2)
    .filter((it) => !Number.isNaN(it));

  if (mayBeMoney.length === 0) {
    // 需要处理 金额不包含 ¥
    // 比如 贰拾壹圆整21.00
    mayBeMoney = lines
      .filter(containsChineseAmount)
      .map(extractNumericAmount) as unknown as number[];
  }
  const money = Math.max(...mayBeMoney).toFixed(2);

  // 发票代码，发票日期
  const codeOrDate = lines.filter((it) => it.length === 8 && /^\d+$/.test(it));
  let code = codeOrDate.find((it) => !it.startsWith(thisYear));
  if (!code) {
    // 电子发票普通发票
    code = lines.filter((it) => it.length === 20 && /^\d+$/.test(it))[0];
  }

  if (!code) {
    // fix this case:
    // 电子发票（普通发票）发票号码：24317000000075757963
    code = lines
      .filter(
        (it) => it.length > 20 && it.slice(-20) && /^\d+$/.test(it.slice(-20)),
      )
      .map((it) => it.slice(-20))[0];
  }

  // console.log(`codeOrDate =>`, codeOrDate)
  const thisYear = new Date().getFullYear().toString();
  const lastYear = (Number(thisYear) - 1).toString();
  let date = codeOrDate.find((it) => it.startsWith(thisYear));
  if (!date) {
    date = codeOrDate.find((it) => it.startsWith(lastYear));
  }
  if (!date) {
    let maybeDate =
      lines
        .filter((it) => it.length === 11)
        .find((it) => it.startsWith(thisYear) || it.startsWith(lastYear)) || "";
    if (!maybeDate) {
      // fix this case: 开票日期：2024年03月13日
      maybeDate = lines.find((it) => it.includes(`${thisYear}年`)) || "";
      maybeDate = thisYear + maybeDate.split(thisYear).pop();
    }
    // console.log(`maybeDate =>`, maybeDate)
    date = maybeDate.replace(/年|月|日/g, ""); // 部分发票文字顺序错乱
  }

  return { date: formatDate(date), code, money };
}

function formatDate(inputDate: string) {
  // console.log(`inputDate =>`, inputDate)
  const year = inputDate.slice(0, 4);
  const month = inputDate.slice(4, 6);
  const day = inputDate.slice(6, 8);
  return `${year}年${month}月${day}日`;
}

/**
 * 从 PDF 文件（File 对象）中解析发票信息
 */
export async function parseInvoicePDF(file: any) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let lines: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const merged = mergeTextItems(textContent.items);
    lines.push(...merged);
  }

  return extractInvoiceInfo(lines);
}

/**
 * 正则表达式用来匹配中文大写金额
 * @param text
 * @return {boolean}
 */
function containsChineseAmount(text: string) {
  const regex = /[壹贰叁肆伍陆柒捌玖拾佰仟万亿元角分整]+/g;
  return regex.test(text);
}

/**
 * 获取数字部分
 * @param text
 * @return {*|null}
 */
function extractNumericAmount(text: string) {
  const regex = /[\d.]+/;
  const match = text.match(regex);
  return match ? match[0] : null;
}

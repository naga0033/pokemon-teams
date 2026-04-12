// 画像をポケチャン能力画面の 6 ボックスに分割するユーティリティ (Client-Side)
// Canvas で描画 → 6 つの切り抜き結果を Blob で返す

// ボックスの正規化座標 [x, y, width, height] (0~1)
// ヘッダー (スロット/チームID/能力タブ) を除いた使用領域を3行×2列に割る想定
const BOX_COORDS: Array<[number, number, number, number]> = [
  [0.03, 0.18, 0.47, 0.26], // 1: top-left
  [0.50, 0.18, 0.47, 0.26], // 2: top-right
  [0.03, 0.44, 0.47, 0.26], // 3: mid-left
  [0.50, 0.44, 0.47, 0.26], // 4: mid-right
  [0.03, 0.70, 0.47, 0.26], // 5: bot-left
  [0.50, 0.70, 0.47, 0.26], // 6: bot-right
];

export type CroppedBox = {
  index: number;
  dataUrl: string;
  width: number;
  height: number;
};

/** File を HTML Image に読み込む */
function fileToImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/** 6 つのボックスに分割して dataUrl (PNG) で返す */
export async function cropTeamImage(file: File | Blob): Promise<CroppedBox[]> {
  const img = await fileToImage(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const results: CroppedBox[] = [];

  for (let i = 0; i < BOX_COORDS.length; i++) {
    const [xPct, yPct, wPct, hPct] = BOX_COORDS[i];
    const sx = Math.floor(w * xPct);
    const sy = Math.floor(h * yPct);
    const sw = Math.floor(w * wPct);
    const sh = Math.floor(h * hPct);

    // OCR 精度を上げるため、できれば 2x 拡大する
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = sw * scale;
    canvas.height = sh * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context が取得できません");

    // リサイズ品質向上
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");
    results.push({
      index: i,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    });
  }

  return results;
}

/** dataUrl から Blob へ変換 (Tesseract に渡すため) */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

/**
 * 產生圓形圖片
 * @param url 圖片網址
 * @param callback 產生圖片後的 callback
 */
export function createCircleImageFromUrl(url: string) {
  return new Promise((resolve: (value: string) => void, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx?.beginPath();
      ctx?.arc(img.width / 2, img.height / 2, img.width / 2, 0, Math.PI * 2, true);
      ctx?.clip();

      ctx?.drawImage(img, 0, 0, img.width, img.height);

      const dataUrl = canvas.toDataURL('image/png');

      resolve(dataUrl);
    };

    img.onerror = reject;
  });
}

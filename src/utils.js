
const base64ToRaw = (base64) => {
  // base64 字符串转成二进制字符串
  const rawString = atob(base64)
  const arraybuffer = new ArrayBuffer(rawString.length)
  const raw = new Uint8Array(arraybuffer)
  for (var i = 0; i < rawString.length; i++) {
    // 二进制字符串转成 bytes array
    raw[i] = rawString.charCodeAt(i) & 0xff
  }
  return raw
}
const downFromBrowser = (blob) => {
  // 这里感觉有点 hack，不知道是否有更好的方法来触发浏览器下载的动作
  const evt = new MouseEvent('click', {
    view: window,
    bubbles: false,
    cancelable: true,
  });
  const aLink = document.createElement('a');
  aLink.download = 'ziped_images.zip';
  aLink.href = URL.createObjectURL(blob);
  aLink.dispatchEvent(evt);
}

export { base64ToRaw, downFromBrowser }
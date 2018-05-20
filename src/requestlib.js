// 构建一个使用 XHR 的 Promise 版本请求,
// config 可以有 endpoint, method, params, headers, responseType
const makeRequest = (config) => {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    const params = config.params;
    let paramString = ''
    let url = config.endpoint
    // 理论上应该是把 paramString 传给 xhr.send 方法的，但是不知道为什么在我的 chrome 里面不工作
    // 因此这里 hack 一下把 paramString 直接接到 url 后面。
    if (params && typeof params === 'object') {
      paramString = Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      }).join('&');
      url = `${config.endpoint}?${paramString}`
    }
    xhr.open(config.method, url, true);
    xhr.onload = function () {
      // 成功就 resolve
      // 其他情况都 reject
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    // 处理 header 以及我们请求 zip 文件需要的 responseType
    if (config.headers) {
      Object.keys(config.headers).forEach(function (key) {
        xhr.setRequestHeader(key, config.headers[key]);
      });
    }
    if (config.responseType) {
      xhr.responseType = config.responseType
    }
    xhr.send();
  });
}
// 构建一个 GET 请求的 wrapper, POST 请求也类似，这里只用到了 GET
const get = (endpoint, config) => makeRequest({ ...config, method: 'GET', endpoint })
exports.get = get
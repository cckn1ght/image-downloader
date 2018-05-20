"use strict"
const url = require("url")
const path = require("path")
const fs = require("fs")

const GET_METHOD = 'GET'
const POST_METHOD = 'POST'
const PUT_METHOD = 'PUT'
const DELETE_METHOD = 'DELETE'

class Router {
  constructor() {
    this.routes = {
      [GET_METHOD]: {},
      [POST_METHOD]: {},
      [PUT_METHOD]: {},
      [DELETE_METHOD]: {}
    }
  }
  // 创建 HTTP GET 请求的路由
  get(endpoint, func) {
    this.createRoute(GET_METHOD, endpoint, func)
  }
  // POST，PUT，以及 DElETE 类似, 因为没有用到，就只实现 POST 先。
  post(endpoint, func) {
    this.createRoute(POST_METHOD, endpoint, func)
  }
  createRoute(method, endpoint, func) {
    this.routes[method][endpoint] = func
  }

  requestHandler() {
    return (req, res) => {
      req.on('error', (err) => {
        console.error(err)
        req.statusCode = 400
        req.end(err)
      })
      const parsedUrl = url.parse(req.url, true)
      // 获取 pathname，用于区分是请求文件还是请求 api
      let pathname = `.${parsedUrl.pathname}`
      if (pathname === './') {
        pathname = 'index.html'
      }
      // 获取文件的后缀
      let ext = path.parse(pathname).ext
      // 如果后缀为空，认为不是获取文件，是请求 API
      let isFile = true
      if (ext.length === 0) {
        isFile = false
      }
      if (isFile) {
        this.serveStaticFile(req, res, pathname)
      } else {
        // 处理请求，拿到我们的 routes, 分别处理各种请求。
        Object.keys(this.routes).forEach(requestMethod => {
          // 对应每种不同请求的所有路由
          const methodRoutes = this.routes[requestMethod]
          Object.keys(methodRoutes).forEach(endpoint => {
            if (req.method === requestMethod && parsedUrl.pathname === endpoint) {
              res.on('error', (err) => {
                console.error(err)
                res.statusCode = 400
              })
              res.statusCode = 200
              methodRoutes[endpoint](req, res, parsedUrl)
            }
          })
        })
        // TODO: 处理没有找到对应路由的情况。
      }
    }
  }

  serveStaticFile(req, res, filename) {
    const map = {
      '.ico': 'image/x-icon',
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
    }
    fs.exists(filename, function (exist) {
      if (!exist) {
        // 文件不存在的话就返回 404
        res.statusCode = 404
        res.end(`File ${filename} not found!`)
        return
      }
      // 读取文件
      fs.readFile(filename, function (err, data) {
        if (err) {
          res.statusCode = 500
          res.end(`Error getting the file: ${err}.`)
        } else {
          // 设定文件类型
          res.setHeader('Content-type', map[path.parse(filename).ext] || 'text/plain')
          res.end(data)
        }
      })
    })
  }
}
exports.Router = Router
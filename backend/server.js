"use strict"
const http = require('http')
const fs = require('fs')
const path = require('path')
const util = require('util')
const url = require('url')
const crypto = require('crypto')
const utils = require('./utils.js')
const controller = require('./controller.js')


// 启动时将所有图像加载到内存中提高处理速度
// 图片以 base64 字符串的形式存储及发送
const imagesFolder = path.join(__dirname, 'images')
const imageContent = {}
const imageNames = []
fs.readdirSync(imagesFolder)
  .filter(file => file.endsWith(".jpg"))
  .forEach(file => {
    const p = path.join(imagesFolder, file)
    imageNames.push(file)
    imageContent[file] = fs.readFileSync(p).toString('base64')
  })

// zipFilesFolder 用以存放被用户下载过的 zip 文件
// zip 文件文件名以包含的所有图片的图片名进行 hash 得到
// 因此如果某个用户需要下载的图片跟之前另一个用户下载过的完全一样，
// 那么直接发送已经生成过的 zip 文件，不需要另外生成
// 因此这里缓存一下已经生成过的 zip 文件名
const zipFilesFolder = path.join(__dirname, 'zip_files')
const zipFiles = new Set()
fs.readdirSync(zipFilesFolder)
  .filter(file => file.endsWith(".zip"))
  .forEach(file => zipFiles.add(file))

// 这里模仿 experss 的 api 写了一个自己的 Router 类
// 用来添加 API 路由
const router = new controller.Router()
// 添加以 /images 作为 endpoint 的 GET 方法
// parsedUrl 也可以在回调函数里自己通过 parse req.url 得到，这里为了方便
router.get("/api/images", (req, res, parsedUrl) => {
  // 该路由可以接受一个 from 参数来指定请求的图像块，前端可以分步地请求图片。
  const from = parseInt(parsedUrl.query['from'] || 0, 10)
  // 现在直接写死了每次取10张图片，可以改为通过 query 得到每次的数量。
  const names = imageNames.slice(from, from + 10)
  const images = {}
  names.forEach(n => images[n] = imageContent[n])
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  const body = { images }
  res.write(JSON.stringify(body))
  res.end()
})

router.get("/api/download", (req, res, parsedUrl) => {
  let queryedImages = parsedUrl.query['images'].split(',')
  // sort 以保证 hash 值不会因为图片在数组中出现的次序不一样而不同
  const zipFileName = crypto.createHash('md5').update(queryedImages.sort().join('')).digest('hex');
  res.statusCode = 200
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Content-Disposition': "attachment; filename=images.zip",
  });
  const absZipFile = path.join(zipFilesFolder, zipFileName + '.zip')
  // 如果之前生成过了该 zip 文件，直接发送
  if (zipFiles.has(zipFileName)) {
    const fileStream = fs.createReadStream(absZipFile)
    fileStream.pipe(response)
  } else {
    // 不然的话用 utils 中的方法来生成 zip 并发送
    zipFiles.add(zipFileName)
    const output = fs.createWriteStream(absZipFile)
    const archive = utils.zipFilesFromFolder(output, imagesFolder, queryedImages)
    archive.pipe(res)
  }
})

// 配置并启动 server
const server = http.createServer(router.requestHandler())
const port = 3001
server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on http://localhost:${port}`)
})
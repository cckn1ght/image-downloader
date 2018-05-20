"use strict"
const archiver = require('archiver')
const path = require('path')
const fs = require('fs')

function zipFilesFromFolder(outStream, fodler, fileNames) {
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  })
  // listen for all archive data to be written
  // 'close' event is fired only when a file descriptor is involved
  outStream.on('close', function () {
    console.log(archive.pointer() + ' total bytes')
    console.log('archiver has been finalized and the output file descriptor has closed.')
  })

  // This event is fired when the data source is drained no matter what was the data source.
  // It is not part of this library but rather from the NodeJS Stream API.
  // @see: https://nodejs.org/api/stream.html#stream_event_end
  outStream.on('end', function () {
    console.log('Data has been drained')
  })

  // good practice to catch warnings (ie stat failures and other non-blocking errors)
  archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
      // log warning
    } else {
      // throw error
      throw err
    }
  })

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    throw err
  })

  // 把 archive pipe 到 outStream 上，使得打包好的文件写入硬盘
  archive.pipe(outStream)
  fileNames.forEach(name => {
    const file = path.join(fodler, name)
    // 读取具体的图片，放入压缩包
    archive.append(fs.createReadStream(file), { name })
  })
  archive.finalize()
  return archive
}
exports.zipFilesFromFolder = zipFilesFromFolder
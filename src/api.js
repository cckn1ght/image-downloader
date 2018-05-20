import requestlib from './requestlib'
const get = requestlib.get

// 获取图片的 api，传递参数 from，每次获取 from 后面的10张图片
const getImages = (from) => get('/api/images', {params: {from}})
  .then(res => {
    // 比较好的做法是在 get 方法里去根据 res 的 header 解成 json
    // 这里为了方便一些
    const data = JSON.parse(res)
    return data.images
  })
  .catch(err => {
    console.log(err)
    return err
  })

// 后端下载图片的 api。images 是一个图片名字的数组
const downloadImages = (images) =>
  get('/api/download', { responseType: 'blob', params: {images} })
    .then(data => {
      return data
    })
    .catch(err => {
      console.log(err)
      return err
    })

export { getImages, downloadImages };
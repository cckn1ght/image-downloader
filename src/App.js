import React, { Component } from 'react'
import './App.css'
import { getImages, downloadImages } from './api'
import { base64ToRaw, downFromBrowser } from './utils'
import JSZip from 'jszip'

class App extends Component {
  constructor(props) {
    super(props)
    // images 用来存储所有请求到的用于展示的图片，选择前端下载 zip 的话数据也是从这里拿
    // checkedImages 是用来存被选择的图像
    // from 是发请求图片 api 的参数。
    this.state = { images: {}, checkedImages: new Set(), from: 0 }
  }
  componentDidMount () {
    // 第一次请求
    this.moreImages()
  }
  moreImages = () => {
    getImages(this.state.from).then(images => {
      // 请求成功之后把原来的图片和现有的合并，并把 from + 10, 请求下10张图片
      this.setState(
        {
          images: {...this.state.images, ...images},
          from: this.state.from + 10
        }
      )
    })
  }
  // 处理勾选图像的逻辑
  checkImage = (event, imageName) => {
    const clicked = new Set(this.state.checkedImages)
    if (event.target.checked) {
      clicked.add(imageName)
    } else {
      clicked.delete(imageName)
    }
    this.setState({ checkedImages: clicked })
  }
  // 前端下载功能
  localDownload = () => {
    // 这里使用了第三方类库 JSZip
    const zip = new JSZip()
    const folder = zip.folder('images')
    this.state.checkedImages.forEach(name => {
      // 由于我们的图片是 base64 格式存储的，还原到原始的 bytes 之后用户才能查看
      folder.file(name, base64ToRaw(this.state.images[name]))
    })
    folder.generateAsync({ type: 'blob' })
      .then(downFromBrowser)
  }
  // 后端下载
  remoteDownload = () => {
    downloadImages(Array.from(this.state.checkedImages)).then(
      blob => downFromBrowser(blob)
    )
  }
  // 以 base64 string 的形式渲染图像
  renderImages = () => (
    Object.keys(this.state.images).map(name => (
      <div className="ImageBox" key={name}>
        <span>{name}</span>
        <img 
          alt={name}
          className='Image'
          src={`data:image/*;base64, ${this.state.images[name]}`}
        >
        </img>
        <input
          onChange={(event) => this.checkImage(event, name)}
          type='checkbox'
          id='subscribeNews'
          name='subscribe'
          value='newsletter'
        />
      </div>
    ))
  )
  render() {
    return (
      <div className='App' onScroll={this.handleScroll}>
        <header className='App-header'>
          <h1 className='App-title'>Choose images you'd like to download.</h1>
          <button onClick={this.localDownload} className="FrontButton">前端打包下载</button>
          <button onClick={this.remoteDownload} className="BackButton">后端打包下载</button>
        </header>
        <div className='imageBlock'>
          <div className="ImageContainer">
            {this.renderImages()}
          </div>
          <p>
            {/* 这里更好的逻辑是用户滚动到屏幕底部动态加载 */}
            <button onClick={this.moreImages}>more</button>
          </p>
        </div>
      </div>
    )
  }
}

export default App

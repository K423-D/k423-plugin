/**
 * 原项目 https://lab.magiconch.com/one-last-image/
 * 做了一点微小的改动
 */
import plugin from '../../../lib/plugins/plugin.js'
import { segment } from "oicq";
import { createCanvas, loadImage } from "canvas";
import imageSize from "image-size";
import axios from 'axios'
import btoa from 'btoa'
import fs from "fs";
let image = '';
const creatConvoluteAverage = (w) => new Array(w * w).fill(1 / (w * w))
const convoluteY = (pixels, weights, ctx) => {
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);

  const src = pixels.data;

  const w = pixels.width;
  const h = pixels.height;
  const output = ctx.createImageData(w, h);
  const dst = output.data;

  for (let sy = 0; sy < h; sy++) {
    for (let sx = 0; sx < w; sx++) {
      const dstOff = (sy * w + sx) * 4;
      let r = 0, g = 0, b = 0;

      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {

          const scy = Math.min(h - 1, Math.max(0, sy + cy - halfSide));
          const scx = Math.min(w - 1, Math.max(0, sx + cx - halfSide));

          const srcOff = (scy * w + scx) * 4;
          const wt = weights[cy * side + cx];

          r += src[srcOff] * wt;
          // g += src[srcOff + 1] * wt;
          // b += src[srcOff + 2] * wt;
        }
      }
      dst[dstOff] = r;
      dst[dstOff + 1] = r;
      dst[dstOff + 2] = r;
      dst[dstOff + 3] = 255;
    }
  }


  // for (let y=0; y<h; y++) {
  // 	for (let x=0; x<w; x++) {
  // 		const srcOff = (y*w+x)*4;
  // 		src[srcOff] = dst[srcOff];
  // 	}
  // }
  return output;
};
const Convolutes = {
  // '右倾': [
  // 	0, -1, 0,
  // 	-1, 2, 2,
  // 	0, -1, 0
  // ],
  // '左倾': [
  // 	0, -1, 0,
  // 	3, 2, -2,
  // 	0, -1, 0
  // ],
  // '极细':   creatConvoluteAverage(3),
  '精细': creatConvoluteAverage(5),
  '一般': creatConvoluteAverage(7),
  '稍粗': creatConvoluteAverage(9),
  '超粗': creatConvoluteAverage(11),
  '极粗': creatConvoluteAverage(13),
  // '12421': [
  // 	-3,2,-3,
  // 	 2,4, 2,
  // 	-3,2,-3,
  // ],
  // '9,-1,8': [
  // 	-1 ,-1 ,-1 ,
  // 	-1 , 9 ,-1 ,
  // 	-1 ,-1 ,-1 ,
  // ],
  // '25,-1,24':creatConvoluteCenterHigh(5,24),
  // '25,-1,25': creatConvoluteCenterHigh(5,25),
  // '25,-1,26': [
  // 	-1 , -1 , -1 , -1 , -1 ,
  // 	-1 , -1 , -1 , -1 , -1 ,
  // 	-1 , -1 , 26 , -1 , -1 ,
  // 	-1 , -1 , -1 , -1 , -1 ,
  // 	-1 , -1 , -1 , -1 , -1 ,
  // ],
  // '-1,0,16': [
  // 	-1 , -1 , -1 , -1 , -1 ,
  // 	-1 ,  0 ,  0 ,  0 , -1 ,
  // 	-1 ,  0 , 17 ,  0 , -1 ,
  // 	-1 ,  0 ,  0 ,  0 , -1 ,
  // 	-1 , -1 , -1 , -1 , -1 ,
  // ],
  '浮雕': [
    1, 1, 1,
    1, 1, -1,
    -1, -1, -1
  ]
}
const style = {
  zoom: 1,
  light: 0,
  shadeLimit: 108,
  shadeLight: 80,
  // s:80,
  // l:50,
  shade: true,
  kuma: true,
  hajimei: false,
  watermark: true,
  convoluteName: '一般',
  convolute1Diff: true,
  convoluteName2: null,
  Convolutes,
  // contrast: 30,
  // invertLight: false,
  // hue:false,
  // hueGroup: 255,
  // lightGroup: 1,
  lightCut: 128,
  darkCut: 118,
  denoise: true,
};

let width = 640;
let height = 480;
let scale = width / height;

let lastConfigString = null;

const canvas = createCanvas();
const ctx = canvas.getContext('2d');
const canvasShade = createCanvas();
const canvasShadeMin = createCanvas();
const canvasMin = createCanvas();
const pencilTextureCanvas = createCanvas();

const louvre = async ({ url, outputCanvas, config, callback }) => {
  if (!url || !config) return;

  const img = {
    src: url,
    naturalWidth: width,
    naturalHeight: height,
  }
  const res = await axios.get(url, { responseType: 'arraybuffer' })
  img.src = 'data:image/png;base64,' + btoa(new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), ''))
  img.naturalWidth = imageSize(res.data).width
  img.naturalHeight = imageSize(res.data).height

  const configString = [
    JSON.stringify(config),
    img.src,
  ].join('-');

  if (lastConfigString === configString) return;

  lastConfigString = configString;

  const oriWidth = img.naturalWidth;
  const oriHeight = img.naturalHeight;

  let oriScale = oriWidth / oriHeight;

  let _width = Math.round(oriWidth / config.zoom);
  let _height = Math.round(oriHeight / config.zoom);

  const maxWidth = 1920;
  if (_width > maxWidth) {
    _height = _height * maxWidth / _width
    _width = maxWidth
  }


  let cutLeft = 0;
  let cutTop = 0;

  let calcWidth = oriWidth;
  let calcHeight = oriHeight;

  if (config.cover) {

    if (oriScale > 1) {
      cutLeft = (oriScale - 1) * oriHeight / 2;
      cutLeft = Math.round(cutLeft);
      calcWidth = oriHeight;
      _width = _height;
    } else {
      cutTop = (1 - oriScale) * oriHeight / 2;
      cutTop = Math.round(cutTop);
      calcHeight = oriWidth;
      _height = _width;
    }
  }


  let setLeft = 0;
  let setTop = 0;

  let setWidth = _width;
  let setHeight = _height;


  canvas.width = _width;
  canvas.height = _height;


  await loadImage(img.src).then((image) => {
    ctx.drawImage(
      image,
      cutLeft, cutTop,
      calcWidth, calcHeight,

      setLeft, setTop,
      setWidth, setHeight
    );
  })

  let pixel = ctx.getImageData(0, 0, _width, _height);

  let pixelData = pixel.data;

  for (let i = 0; i < pixelData.length; i += 4) {
    const r = pixelData[i];
    const g = pixelData[i + 1];
    const b = pixelData[i + 2];

    let y = r * .299000 + g * .587000 + b * .114000;
    y = Math.floor(y);

    pixelData[i] = y;
    pixelData[i + 1] = y;
    pixelData[i + 2] = y;
  }
  let shadePixel;

  const {
    shadeLimit = 80,
    shadeLight = 40
  } = config;
  let pencilTexturePixel;
  if (config.shade) {
    // let watermarkImageEl;
    // let pencilTextureEl;

    const img1 = fs.readFileSync('./plugins/k423-plugin/resources/image/pencil-texture.jpg')
    // const img2 = fs.readFileSync('./config/one-last-image-logo2.png')

    // 载入纹理
    pencilTextureCanvas.width = _width;
    pencilTextureCanvas.height = _height;
    const pencilTextureCtx = pencilTextureCanvas.getContext('2d');
    const pencilSetWidthHeight = Math.max(_width, _height);
    await loadImage(img1).then((image) => {
      pencilTextureCtx.drawImage(
        image,
        0, 0,
        1200, 1200,
        0, 0,
        pencilSetWidthHeight, pencilSetWidthHeight
      );
    })
    pencilTexturePixel = pencilTextureCtx.getImageData(0, 0, _width, _height);


    // 处理暗面
    shadePixel = ctx.createImageData(_width, _height);

    for (let i = 0; i < pixelData.length; i += 4) {
      let y = pixelData[i];

      y = y > shadeLimit ? 0 : 255; //((255 - pencilTexturePixel.data[i]) + Math.random() * 40 - 20);

      shadePixel.data[i] = y;
      shadePixel.data[i + 1] = 128;
      shadePixel.data[i + 2] = 128;
      shadePixel.data[i + 3] = Math.floor(Math.random() * 255)//Math.ceil( y + Math.random() * 40 - 20);
    }

    const ctxShade = canvasShade.getContext('2d');
    const ctxShadeMin = canvasShadeMin.getContext('2d');

    canvasShade.width = _width;
    canvasShade.height = _height;


    ctxShade.putImageData(shadePixel, 0, 0);

    const shadeZoom = 4;
    canvasShadeMin.width = Math.floor(_width / shadeZoom);
    canvasShadeMin.height = Math.floor(_height / shadeZoom);

    ctxShadeMin.drawImage(
      canvasShade,
      0, 0,
      canvasShadeMin.width, canvasShadeMin.height
    );

    ctxShade.clearRect(0, 0, _width, _height)
    ctxShade.drawImage(
      canvasShadeMin,
      0, 0,
      _width, _height
    );
    shadePixel = ctxShade.getImageData(0, 0, _width, _height);

    for (let i = 0; i < shadePixel.data.length; i += 4) {
      let y = shadePixel.data[i];

      y = Math.round((255 - pencilTexturePixel.data[i]) / 255 * y / 255 * shadeLight); //((255 - pencilTexturePixel.data[i]) + Math.random() * 40 - 20);
      shadePixel.data[i] = y;
    }

  }
  const {
    light = 0,
  } = config;
  if (light) {


    for (let i = 0; i < pixelData.length; i += 4) {
      let y = pixelData[i];

      y = y + y * (light / 100);

      pixelData[i] = y;
      pixelData[i + 1] = y;
      pixelData[i + 2] = y;
    }

  }


  if (config.denoise) {
    pixel = convoluteY(
      pixel,
      [
        1 / 9, 1 / 9, 1 / 9,
        1 / 9, 1 / 9, 1 / 9,
        1 / 9, 1 / 9, 1 / 9
      ],
      ctx
    );
  }

  let pixel1 = config.convoluteName ? convoluteY(
    pixel,
    config.Convolutes[config.convoluteName],
    ctx
  ) : pixel;

  if (config.convolute1Diff) {
    let pixel2 = config.convoluteName2 ? convoluteY(
      pixel,
      config.Convolutes[config.convoluteName2],
      ctx
    ) : pixel;

    // console.log(/pixel2/,config.Convolutes[config.convoluteName2],pixel2);
    // pixelData
    for (let i = 0; i < pixel2.data.length; i += 4) {
      let r = 128 + pixel2.data[i] - pixel1.data[i];
      pixel2.data[i] = r;
      pixel2.data[i + 1] = r;
      pixel2.data[i + 2] = r;
      pixel2.data[i + 3] = 255;
    }
    pixel = pixel2;
  } else {
    // 不对比
    pixel = pixel1;
  }

  pixelData = pixel.data;

  if (config.lightCut || config.darkCut) {
    const scale = 255 / (255 - config.lightCut - config.darkCut);
    for (let i = 0; i < pixelData.length; i += 4) {
      let y = pixelData[i];

      y = (y - config.darkCut) * scale;

      y = Math.max(0, y);

      pixelData[i + 0] = y
      pixelData[i + 1] = y
      pixelData[i + 2] = y
      pixelData[i + 3] = 255
    }
  }

  if (config.kuma) {

    const hStart = 30;
    const hEnd = -184;

    const gradient = ctx.createLinearGradient(0, 0, _width, _height);

    gradient.addColorStop(0, '#fbba30');
    gradient.addColorStop(0.4, '#fc7235');
    gradient.addColorStop(.6, '#fc354e');
    gradient.addColorStop(.7, '#cf36df');
    gradient.addColorStop(.8, '#37b5d9');
    gradient.addColorStop(1, '#3eb6da');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, _width, _height);
    let gradientPixel = ctx.getImageData(0, 0, _width, _height);

    for (let i = 0; i < pixelData.length; i += 4) {
      let y = pixelData[i];
      let p = Math.floor(i / 4);

      let _h = Math.floor(p / _width);
      let _w = p % _width;

      pixelData[i + 0] = gradientPixel.data[i + 0];
      pixelData[i + 1] = gradientPixel.data[i + 1];
      pixelData[i + 2] = gradientPixel.data[i + 2];

      y = 255 - y;
      if (config.shade) {
        y = Math.max(
          y,
          shadePixel.data[i]
        );
      }
      pixelData[i + 3] = y
    }

  }

  ctx.putImageData(pixel, 0, 0);

  const ctxMin = canvasMin.getContext('2d');

  canvasMin.width = Math.floor(_width / 1.4);
  canvasMin.height = Math.floor(_height / 1.3);

  ctxMin.clearRect(0, 0, canvasMin.width, canvasMin.height)
  ctxMin.drawImage(
    canvas,
    0, 0,
    canvasMin.width, canvasMin.height
  );

  ctx.clearRect(0, 0, _width, _height)
  ctx.drawImage(
    canvasMin,
    0, 0,
    canvasMin.width, canvasMin.height,
    0, 0, _width, _height
  );
  // one-last-image-logo-color.png
  if (config.watermark) {
    // const watermarkImageEl = await loadImagePromise('one-last-image-logo2.png');

    let watermarkImageEl = {
      src: url,
      naturalWidth: width,
      naturalHeight: height,
    }
    const res = fs.readFileSync('./plugins/k423-plugin/resources/image/one-last-image-logo2.png')
    watermarkImageEl.src = 'data:image/png;base64,' + btoa(new Uint8Array(res).reduce((data, byte) => data + String.fromCharCode(byte), ''))
    watermarkImageEl.naturalWidth = imageSize(res).width
    watermarkImageEl.naturalHeight = imageSize(res).height

    const watermarkImageWidth = watermarkImageEl.naturalWidth;
    const watermarkImageHeight = watermarkImageEl.naturalHeight / 2;
    let setWidth = _width * 0.3;
    let setHeight = setWidth / watermarkImageWidth * watermarkImageHeight;

    if (_width / _height > 1.1) {
      setHeight = _height * 0.15;
      setWidth = setHeight / watermarkImageHeight * watermarkImageWidth;
    }

    let cutTop = 0;

    if (config.hajimei) {
      cutTop = watermarkImageHeight;
    }

    let setLeft = _width - setWidth - setHeight * 0.2;
    let setTop = _height - setHeight - setHeight * 0.16;
    await loadImage(watermarkImageEl.src).then((image) => {
      ctx.drawImage(
        image,
        0, cutTop,
        watermarkImageWidth, watermarkImageHeight,
        setLeft, setTop,
        setWidth, setHeight
      );
    })
  }

  image = canvas.toDataURL().replace('data:image/png;base64,', '')
  return
};

export class olk extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '图片卢浮宫化处理',
      /** 功能描述 */
      dsc: '把命令后的图片进行卢浮宫化并返回',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^#olk$",
          /** 执行方法 */
          fnc: 'oneLastKiss'
        }
      ]

    })
  }

  async oneLastKiss(e) {
    console.log(e.message);
    if (e.message.length == 1) {
      e.reply(['请带上一张图片哦'])
      return false
    }
    if (e.message.length > 2 || e.message[1].type !== 'image') {
      e.reply(['请发送正确格式的命令：【#olk+(一张图片)】'])
      return false
    }
    if (e.message.length == 2 && e.message[1].type === 'image') {
      image = ''
      await louvre({
        url: e.message[1].url,
        config: {
          ...style,
          Convolutes,
        }
      })
    }

    //最后回复消息
    let msg = [
      //@用户
      segment.at(e.user_id),
      //文本消息
      "\n图片生成成功~",
      //图片
      segment.image(`${image ? `base64://${image}` : e.message[1].url}`),
    ];

    //发送消息
    this.reply(msg);

    return true; //返回true 阻挡消息不再往下
  }
}
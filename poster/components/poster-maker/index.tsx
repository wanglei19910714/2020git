import React from 'react';
import html2canvas from 'html2canvas';
import EXIF from 'exif-js';
import './index.scss';
import { reject } from 'lodash';
import { Dragable, DeltaLocation } from '../dragable';
import { Resizable } from '../resizable';

interface PosterMakerProps {
  photoInfo:PhotoInfo;
  templateDataURL:string;
  /** 二维码信息 */
  qrcodeInfo:QRCodeInfo;
}

export interface QRCodeInfo {
  url:string;
  left?:string;
  top?:string;
  width?:string;
  height?:string;
}
export interface PhotoInfo {
  dataURL:string;
  naturalWidth:number;
  naturalHeight:number;
}

interface Location {
  left:number;
  top:number;
  width:number;
  height:number;
}
interface QRCodeLocation {
  left:string;
  top:string;
  width:string;
  height:string;
}

interface PosterMakerState {
  templateDataURL:string;
  photoInfo:PhotoInfo;
  qrcodeInfo:QRCodeInfo;
  photoLocation:Location;
  qrcodeLocation:QRCodeLocation;
  deg:number;
  codeImage:string;
}

const POSTER_BOX_ID = 'poster-box';
const POSTER_WIDTH = 442.0;
const POSTER_HEIGHT = 782.85;
export class PosterMaker extends React.PureComponent<PosterMakerProps, PosterMakerState> {
  state = {
    codeImage: '',
    photoInfo: { dataURL: '', naturalWidth: 0, naturalHeight: 0 },
    qrcodeInfo: { url: '', left: '', top: '', width: '', height: '' },
    photoLocation: { left: 0, top: 0, width: 0, height: 0 },
    deg: 0,
    qrcodeLocation: { left: '', top: '', width: '', height: '' },
    templateDataURL: '',
  }

  query:any = {}
  imageInput:HTMLInputElement | null;
  posterBox:HTMLDivElement | null;
  //* *照片宽高比 */
  radio:number = 1;

  componentDidUpdate(prevProps:PosterMakerProps, prevState:PosterMakerState) {
    if (prevState.photoInfo.dataURL !== this.props.photoInfo.dataURL) {
      this.initPhoto(this.props.photoInfo);
    }
    if (!prevState.qrcodeInfo && this.props.qrcodeInfo ||
      prevState.qrcodeInfo && prevState.qrcodeInfo.url !== this.props.qrcodeInfo.url) {
      this.initQrcode(this.props.qrcodeInfo);
    }
  }

  static getDerivedStateFromProps(nextProps:PosterMakerProps, prevState:PosterMakerState) {
    const { photoInfo, templateDataURL, qrcodeInfo } = nextProps;
    // 当传入的photoInfo发生变化的时候，更新state
    if (photoInfo.dataURL !== prevState.photoInfo.dataURL) {
      return { photoInfo };
    }
    if (templateDataURL !== prevState.templateDataURL) {
      return { templateDataURL };
    }
    if (qrcodeInfo !== prevState.qrcodeInfo) {
      return { qrcodeInfo };
    }
    // 否则，对于state不进行任何操作
    return null;
  }

  initPhoto = async(photo:PhotoInfo) => {
    this.radio = photo.naturalWidth / photo.naturalHeight * 1.00;
    const clientWidth = document.documentElement.clientWidth;
    const posterRadio = POSTER_WIDTH / POSTER_HEIGHT * 1.00;
    const posterWidth = (POSTER_WIDTH / 750) * clientWidth;
    const posterHeight = posterWidth / posterRadio;
    const setWidth = photo.naturalWidth;
    const setHeight = photo.naturalHeight;
    let setLeft = 0;
    let setTop = 0;

    let scale = 1.00;
    if (setWidth > setHeight) {
      scale = posterHeight / setHeight;
      setLeft = (posterWidth - photo.naturalWidth * scale) / 2.0;
    } else {
      scale = posterWidth / setWidth ;
      setTop = (posterHeight - photo.naturalHeight * scale) / 2.0;
    }
    this.setState({
      photoLocation: {
        width: setWidth * scale,
        height: setHeight * scale,
        left: setLeft,
        top: setTop,
      },
    }, () => {
      console.log('initPhotoPosition, photo location = ', JSON.stringify(this.state.photoLocation));
    });
  }

  initQrcode = (qrcodeInfo:QRCodeInfo) => {
    const { width, height, url, left, top } = qrcodeInfo;
    this.setState({
      codeImage: url,
      qrcodeLocation: {
        left: left || '', top: top || '', width: width || '', height: height || '',
      },
    });
  }

  handleDrag = (target:HTMLElement, delta:DeltaLocation) => {
    const { top, left, width, height } = this.state.photoLocation;
    this.setState({
      photoLocation: {
        left: left + delta.x,
        top: top + delta.y,
        width: width,
        height: height,
      },
    });
  }
  handleResize = (delta:number) => {
    const { top, left, width, height } = this.state.photoLocation;
    const nowWidth = width + delta;
    const nowHeight = nowWidth / this.radio;
    const nowLeft = left - (nowWidth - width) / 2;
    const nowTop = top - (nowHeight - height) / 2;
    this.setState({
      photoLocation: {
        width: nowWidth,
        height: nowHeight,
        left: nowLeft,
        top: nowTop,
      },
    });
  }

  render() {
    const { codeImage } = this.state;
    return (
      <Resizable
        onResize={this.handleResize}
        useDefaultResize={false}>
        <Dragable
          onDrag={this.handleDrag}
          useDefaultDrag={false}>
          <div
            ref={(box) => this.posterBox = box}
            styleName="poster-box"
            id={POSTER_BOX_ID}>
            <div styleName="photo-box">
              {this.state.photoInfo.dataURL && <img
                src={this.state.photoInfo.dataURL}
                style={{ ...this.state.photoLocation }}
                id="photo-image" />}
            </div>
            <div styleName="template-box">
              <img
                src={this.state.templateDataURL}
                id="preview-bg" />
            </div>
            <div
              styleName="qrcode-box"
              style={this.state.qrcodeLocation}>
              <img
                src={codeImage}
              />
            </div>
          </div>
        </Dragable>
      </Resizable>
    );
  }
}

export async function createPoster() {
  const box = document.querySelector(`#${POSTER_BOX_ID}`);
  if (!box || !(box instanceof HTMLDivElement)) {
    return '';
  }
  // 强制保持scroll到顶部，防止出现canvas位置偏移的问题
  window.scrollTo(0, 0);

  const posterBox = box as HTMLDivElement;

  const newImgWidth = posterBox.offsetWidth;
  const newImgHeight = posterBox.offsetHeight;
  const scale = window.devicePixelRatio;

  const canvas = await html2canvas(posterBox, {
    width: newImgWidth,
    height: newImgHeight,
    backgroundColor: 'transparent',
    logging: false,
    scale: scale,
    useCORS: true,
  });
  return canvas.toDataURL();
}

export async function imgUrl2Base64(url:string):Promise<string> {
  console.log('try to convert url to base64 : ', url);
  return new Promise((resolve) => {

    const image = new Image();
    image.setAttribute('crossOrigin', 'anonymous');
    image.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const ext = image.src.substring(image.src.lastIndexOf('.') + 1).toLowerCase();
        const dataURL = canvas.toDataURL(`image/${ext || 'png'}`);
        resolve(dataURL);
      }

    };
    image.onerror = function(ev) {
      console.log(ev);
      reject(ev.toString());
    };
    image.src = `${url}?a=${new Date().getTime()}`;

  });
}

export async function getPhotoInfo(imageInput:HTMLInputElement | null):Promise<PhotoInfo> {
  return new Promise((resolve, reject) => {
    const photoInfo:any = {
      dataURL: '',
      naturalWidth: 0,
      naturalHeight: 0,
      change: false,
    };
    if (!imageInput) {
      reject(photoInfo);
      return;
    };


    imageInput.addEventListener('change', function(e:Event) {
      if (photoInfo.change) {
        return;
      }
      photoInfo.change = true;
      if (!this.files || this.files.length === 0) {
        reject(photoInfo);
        return;
      }
      const ext = this.files[0].name.substring(this.files[0].name.lastIndexOf('.') + 1).toLowerCase();
      const extension = `image/${ext || 'png'}`;

      const fileReader = new FileReader();
      fileReader.readAsDataURL(this.files[0]);
      fileReader.addEventListener('load', function(e) {
        const img = new Image();
        img.onload = function() {
          console.log('preview image onload,');
          EXIF.getData(this, function() { // 获取图像的数据
            const tags = EXIF.getAllTags(this); // 获取图像的全部数据，值以对象的方式返回
            let { Orientation } = tags || {};
            Orientation = Orientation || 1;
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            if ([6, 8].includes(Orientation)) {
              canvas.width = img.height;
              canvas.height = img.width;
            }
            const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
            // FIXME:
            // 处理iPhone 13.4.0以上的版本，照片旋转后展示不正常的问题
            // 此处处理，强制保持不再进行旋转；
            if(Orientation !== 1){
              const ipad = window.navigator.userAgent.match(/(ipad).*\s([\d_]+)/i);
              const iphone = window.navigator.userAgent.match(/(iphone)\sos\s([\d_]+)/i);
              if (iphone || ipad) {
                let version = '';
                iphone && (version = iphone[2].replace(/_/g, '.'));
                ipad && (version = ipad[2].replace(/_/g, '.'));
                const versions = version.split('.');
                if (Number(versions[0]) > 13 || (Number(versions[0]) === 13 && Number(versions[1]) > 4)) {
                  Orientation = 1;
                }
              }
            }
            switch (Orientation) {
              case 3:
                ctx.transform(-1, 0, 0, -1, img.width, img.height);
                break;
              case 6:
                ctx.transform(0, 1, -1, 0, img.height, 0);
                break;
              case 8:
                ctx.transform(0, -1, 1, 0, 0, img.width);
                break;
              default:
                ctx.transform(1, 0, 0, 1, 0, 0);
            }
            ctx.drawImage(img, 0, 0, img.width, img.height);
            photoInfo.dataURL = canvas.toDataURL(extension);
            photoInfo.naturalWidth = canvas.width;
            photoInfo.naturalHeight = canvas.height;
            imageInput.value = '';
            resolve(photoInfo);
          });
        };
        img.src = this.result as string;
      });
    });
  });

}

export async function getPhotoFile(imageInput:HTMLInputElement):Promise<File> {
  return new Promise((resolve, reject) => {
    const photoInfo:any = { change: false };
    if (!imageInput) {
      reject(null);
      return;
    };
    imageInput.addEventListener('change', function(e:Event) {
      if (photoInfo.change) {
        return;
      }
      photoInfo.change = true;
      if (!this.files || this.files.length === 0) {
        reject(null);
        return;
      }
      resolve(this.files[0]);
    });
  });

}



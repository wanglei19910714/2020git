import React from 'react';
import cx from 'classnames';
import Swiper from 'swiper';
import QRCode from 'qrcode';
import { ILocalStorage, ILocalStorageKey } from 'src/utils/local-storage';
import { PosterItem } from '../../type';
import 'swiper/css/swiper.css';
import style from './index.scss';

interface PosterSwiperProps {
  posterList:PosterItem[];
  utmContent:string;
  changeBtntext:(index:number) => void;
}
export interface QRCodeInfo {
  url:string;
  left?:string;
  top?:string;
  width?:string;
  height?:string;
}
interface PosterSwiperState {
  qrcodeList:QRCodeInfo[];
}
const PAGE_WIDTH = 750;
const PAGE_HEIGHT = 1334;
export class PosterSwiper extends React.PureComponent<PosterSwiperProps, PosterSwiperState> {
  state = {
    qrcodeList: new Array<QRCodeInfo>(),
  }
  swiperObj:any = null;
  async componentDidMount() {
    await this.instanceQrcodeList();
    this.instanceSwiper();
  }
  instanceQrcodeList = async() => {
    const list:QRCodeInfo[] = [];
    const { posterList } = this.props;
    for (let i = 0; i < posterList.length; i++) {
      const item = posterList[i];
      const qrcodeInfo:QRCodeInfo = { url: '' };
      qrcodeInfo.url = await this.generateQRCode(item);
      qrcodeInfo.left = `${item.xcoordinate * 100}%`;
      qrcodeInfo.top = `${item.ycoordinate * 100}%`;
      qrcodeInfo.width = `${item.qrcodeLength * 100}%`;
      qrcodeInfo.height = `${item.qrcodeLength * 100 * PAGE_WIDTH / PAGE_HEIGHT}%`;
      list.push(qrcodeInfo);
    }

    this.setState({ qrcodeList: list });
  }
  generateQRCode = async(item:PosterItem) => {
    const utm_source = item.type === 1 ? 'normal' : 'gxh';
    const user_id = ILocalStorage.getItem(ILocalStorageKey.USER_ID);
    const url = `${item.qrcodeLink}?utm_term=poster&utm_source=${utm_source}&utm_content=${this.props.utmContent}&actID=${item.id}&shareID=${user_id}`;
    const base64Image = await QRCode.toDataURL(url);
    return base64Image;
  }
  instanceSwiper = () => {
    const { changeBtntext, posterList } = this.props;
    console.log();

    this.swiperObj = new Swiper('.swiper-container', {
      loop: true,
      speed: 100,

      slidesPerView: 'auto',
      centeredSlides: true,
      spaceBetween: 34,
      observer: true, // 修改swiper自己或子元素时，自动初始化swiper
      observeParents: true, // 修改swiper的父元素时，自动初始化swiper
      // 如果需要分页器
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      on: {
        slideChange: function() {
          const activeIndex = this.activeIndex % posterList.length;
          changeBtntext(activeIndex);
        },
      },
    });
  }

  // 结束时销毁swiper
  componentWillUnmount() {
    if (this.swiperObj.destroy) {
      this.swiperObj.destroy();
      this.swiperObj = null;
    }
  }
  getQrcodeStyle = (index:number):React.CSSProperties => {
    const { left, top, width, height } = this.state.qrcodeList[index];
    return { left, top, width, height, position: 'absolute', borderRadius: '0' };
  }
  render() {
    const { qrcodeList } = this.state;
    return (
      <div className={cx(style.wrapper)}>
        <div
          className="swiper-container"
        >
          <div className="swiper-wrapper">
            {this.props.posterList &&
              this.props.posterList.map((item:PosterItem, index:number) =>
                <div
                  className="swiper-slide"
                  key={index}>
                  {item.type === 2 ? <img src={item.indicationTemplateLink} /> : <img src={item.buildTemplateLink} />}
                  {qrcodeList && qrcodeList[index] && <img
                    src={qrcodeList[index].url}
                    style={this.getQrcodeStyle(this.props.posterList.indexOf(item))} />}
                </div>)}
          </div>
          <div className="swiper-pagination" />
        </div>
      </div>

    );
  }

}


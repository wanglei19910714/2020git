import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { ILocalStorage, ILocalStorageKey } from 'src/utils/local-storage';
import { getUrlParams } from 'src/utils';
import { uploadImgBase64 } from 'src/utils/uploadFile';
import html2canvas from 'html2canvas';
import * as weui from 'weui.js';
import { FontJump } from '../components/font-jump';
import { getPosterGroup } from '../../../api/codecamp';
import { PosterSwiper } from '../components/poster-swiper';
import { PosterHeader } from '../components/poster-header';
import { getPhotoInfo } from '../components/poster-maker';
import { PosterHoc, PosterHocProps } from '../components/poster-hoc';

import { ApiData } from '../type';
import './index.scss';

interface IndexProps extends RouteComponentProps, PosterHocProps{
}
interface IndexState {
  data:ApiData;
  btn_text:string;
  bubble_text:string;
  posterId:number;
  personalized:boolean;
  isModal:boolean;
  isShowBubble:boolean;
}

const MEKE_PAGE = '/poster/make';
const SHARE_PAGE = '/poster/share';
//* * 普通海报wrapper选择器 */
const POSTER_SELECTOR = 'swiper-slide-active';
//* * 当前active的海报的放大比例 */
const ACTIVE_SWIPER_SCALE = 1.1;
class Container extends React.PureComponent<IndexProps, IndexState> {

  state = {
    data: {} as ApiData,
    btn_text: '',
    bubble_text: '',
    isShowBubble: false,
    posterId: 0,
    personalized: false,
    isModal: false,
  }
  imageInput:HTMLInputElement | null;
  query:any = {};
  componentDidMount() {
    this.props.reportDataVisit();
    this.query = getUrlParams();
    this.getPosterGroup();


  }

  getPosterGroup = async() => {
    try {
      const { data } = await getPosterGroup(this.query.groupId);
      if (data.code === 200) {
        document.title = data.data.title;
        this.setState({ data: data.data, isShowBubble: data.data.showBubble }, () => {
          this.changeBtntext(0);
        });
      }
    }catch (error) {
      console.log(error);
    }
  }

  // 改变按钮的文字
  changeBtntext = (index:number) => {
    const type = this.state.data.posters[index].type;
    const posterId = this.state.data.posters[index].id;
    const { bubbleCopywriting, individuationCopywriting, ordinaryCopywriting } = this.state.data;
    const bubble_text = bubbleCopywriting;
    let btn_text;
    let personalized;

    if (type === 2) {
      btn_text = individuationCopywriting;
      personalized = true;
    } else {
      btn_text = ordinaryCopywriting;
      personalized = false;
    }
    this.setState({ btn_text, personalized, bubble_text, posterId });
  }

  getPhoto = async() => {
    const photoInfo = await getPhotoInfo(this.imageInput);
    if (!photoInfo || !photoInfo.dataURL) {
      weui.toast('请上传图片');
      return;
    }
    this.setState({ isModal: true });
    const res = await uploadImgBase64(photoInfo.dataURL);
    if (!res || !res.url) {
      weui.toast('上传图片失败');
      return;
    }
    photoInfo.dataURL = res.url as string;
    ILocalStorage.setItem(ILocalStorageKey.POSTER_MAKE_IMG, JSON.stringify(photoInfo));

    // 埋点上报上报数据
    this.props.reportData('个性化海报制作按钮点击');

    this.props.switchToPage(MEKE_PAGE, this.query);
  }

  generateNormalPoster = async() => {
    const box = document.querySelector(`.${POSTER_SELECTOR}`);
    if (!box || !(box instanceof HTMLDivElement)) {
      return '';
    }
    window.scrollTo(0, 0);
    const posterBox = box as HTMLDivElement;
    console.log(posterBox);

    const newImgWidth = posterBox.offsetWidth * ACTIVE_SWIPER_SCALE;
    const newImgHeight = posterBox.offsetHeight * ACTIVE_SWIPER_SCALE;
    const scale = window.devicePixelRatio;

    const canvas = await html2canvas(posterBox, {
      width: newImgWidth,
      height: newImgHeight,
      scale: scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: 'transparent',
    });
    return canvas.toDataURL();
  }

  /** 普通海报按钮 */
  normalPoster = async() => {
    this.setState({ isModal: true });
    const posterDataURL = await this.generateNormalPoster();

    console.log('poster created :', posterDataURL.length);
    if (posterDataURL.length === 0) {
      weui.toast('请上传图片');
      return;
    }
    const res = await uploadImgBase64(posterDataURL);
    console.log('poster uploaded :', res);
    if (!res || !res.url) {
      weui.toast('上传图片失败');
      return;
    }

    ILocalStorage.setItem(ILocalStorageKey.POSTER_COMPLETE_IMG, res.url);

    await this.props.createPosterRecord(this.state.posterId);

    this.props.reportData('普通海报制作按钮点击');

    this.props.switchToPage(SHARE_PAGE, this.query);
  }


  render() {
    const { data, btn_text, personalized, bubble_text, isModal, isShowBubble } = this.state;
    return (
      <div styleName="wrap">
        <div styleName="main">
          <PosterHeader />
          <div styleName="swiper">
            {data.posters && <PosterSwiper
              posterList={data.posters}
              utmContent={this.query.utm_content}
              changeBtntext={this.changeBtntext} />}
          </div>
        </div>

        {this.props.isLogin ? <div>
          {personalized
            ? <label styleName="personalized-btn">{btn_text}
              <input
                ref={(input) => this.imageInput = input}
                styleName="image-input"
                type="file"
                accept="image/*"
                style={{ visibility: 'hidden' }}
                onClick={this.getPhoto} />
              {isShowBubble && <div styleName="bubble">{bubble_text}</div>}
            </label>
            : <div
              styleName="normal_btn"
              onClick={this.normalPoster}>
              {btn_text}
            </div>
          }
        </div> : <div styleName="login_wrap">
          <div
            styleName="login_btn"
            onClick={this.props.switchAccount}>
            {btn_text}
          </div>
          {isShowBubble && personalized && <div styleName="bubble">{bubble_text}</div>}
        </div>}
        {isModal && <FontJump fonts="正在生成中请稍等" />}
      </div>
    );
  }
}

export const Poster = PosterHoc(Container);



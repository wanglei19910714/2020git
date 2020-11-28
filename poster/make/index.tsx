import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { ILocalStorage, ILocalStorageKey } from 'src/utils/local-storage';
import { getUrlParams } from 'src/utils';
import { uploadImgBase64 } from 'src/utils/uploadFile';
import QRCode from 'qrcode';
import * as weui from 'weui.js';
import { getPosterGroup } from '../../../api/codecamp';
import { PosterMaker, createPoster, getPhotoInfo, PhotoInfo } from '../components/poster-maker';
import { TemplateSwiper } from '../components/template-swiper/index';
import { PosterHeader } from '../components/poster-header';
import { ApiData, PosterItem } from '../type';
import { FontJump } from '../components/font-jump';
import { PosterHoc, PosterHocProps } from '../components/poster-hoc';
import { PosterModal } from '../components/poster-modal/index';
import './index.scss';

interface MakeProps extends RouteComponentProps, PosterHocProps { }
interface MakeState {
  data:ApiData;
  template:string;
  posterId:number;
  posterType:number;
  photoInfo:PhotoInfo;
  posterDataURL:string;
  qrcodeList:QRCodeInfo[];
  isTodayFirst:boolean;
  isModal:boolean;
  activeIndex:number;
}
interface QRCodeInfo {
  url:string;
  left?:string;
  top?:string;
  width?:string;
  height?:string;
}

const SHARE_PAGE = '/poster/share';
const PAGE_WIDTH = 750;
const PAGE_HEIGHT = 1334;
class Container extends React.PureComponent<MakeProps, MakeState> {
  state = {
    data: {} as ApiData,
    photoInfo: { dataURL: '', naturalWidth: 0, naturalHeight: 0 },
    qrcodeInfo: { url: '', left: 0, top: 0, width: 0, height: 0 },
    qrcodeList: new Array<QRCodeInfo>(),
    template: '',
    posterId: 0,
    posterType: 1,
    posterDataURL: '',
    isTodayFirst: false,
    isModal: false,
    activeIndex: 0,
  }
  query:any = {}
  imageInput:HTMLInputElement | null;
  async componentDidMount() {
    this.query = getUrlParams();
    this.getPosterGroup();
    this.isTodayFirst();
    await this.getDefaultPhoto();
  }

  /** 请求接口数据 */
  getPosterGroup = async() => {
    try {
      const { data } = await getPosterGroup(this.query.groupId);
      document.title = data.data.title;
      if (data.code === 200) {
        document.title = data.data.title;
        data.data.posters = data.data.posters.filter((item:PosterItem) => item.type === 2);

        this.setState({
          data: data.data,
          template: data.data.posters[0].buildTemplateLink,
          posterId: data.data.posters[0].id,
          posterType: data.data.posters[0].type,
        }, () => {this.instanceQrcodeList(); });
      }
    }catch (error) {
      console.log(error);
    }
  }

  /** 每天第一次弹起弹层 */
  isTodayFirst = () => {
    const date = new Date();
    const ymd_new = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const ymd_old = ILocalStorage.getItem(ILocalStorageKey.POSTER_MAKE_today_first);

    if (!ymd_old || (ymd_new !== ymd_old)) {
      ILocalStorage.setItem(ILocalStorageKey.POSTER_MAKE_today_first, ymd_new);
      this.setState({ isTodayFirst: true });
      return;
    }
  }

  getPhoto = async() => {
    const photoInfo = await getPhotoInfo(this.imageInput);
    this.setState({ photoInfo });
  }
  /** 从localstorage拿到上传照片 */
  getDefaultPhoto = async() => {
    if (!this.state.photoInfo.dataURL) {
      const photoInfoString = ILocalStorage.getItem(ILocalStorageKey.POSTER_MAKE_IMG);
      const photoInfo = JSON.parse(photoInfoString) as PhotoInfo;
      this.setState({ photoInfo: photoInfo });
      console.log('get photo from localstorage : ', photoInfoString);
    }
  }

  /** 生成海报 */
  createPhoto = async() => {
    this.setState({ isModal: true });
    const posterData = await createPoster();
    console.log('poster created :', posterData.length);

    const res = await uploadImgBase64(posterData);
    console.log('upload poster to Qiniu :', res);
    if (!res || !res.url) {
      weui.toast('上传图片失败');
      return;
    }
    ILocalStorage.setItem(ILocalStorageKey.POSTER_COMPLETE_IMG, res.url);
    // 创建用户分享记录
    this.props.createPosterRecord(this.state.posterId);
    // 埋点上报上报数据
    this.props.reportData('个性化海报生成按钮点击');
    /** 跳转到海报生成页面 */
    this.props.switchToPage(SHARE_PAGE, this.query);
  }

  instanceQrcodeList = async() => {
    const list:QRCodeInfo[] = [];
    console.log(this.state.data);
    const posterList = this.state.data.posters;
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
    const url = `${item.qrcodeLink}?utm_term=poster&utm_source=${utm_source}&utm_content=${this.query.utm_content}&actID=${item.id}&shareID=${user_id}`;
    const base64Image = await QRCode.toDataURL(url);
    return base64Image;
  }

  /** 改变示意性模版 */
  changeTemplate = (link:string, posterId:number, posterType:number, index:number) => {
    this.setState({ template: link, posterId, posterType, activeIndex: index });
  }

  /** 关闭弹层 */
  closeModal = () => {
    this.setState({ isTodayFirst: false });
  }

  render() {
    const { data, isTodayFirst, isModal } = this.state;
    return (
      <div styleName="poster-wrap">
        {isTodayFirst && <PosterModal closeModal={this.closeModal} />}
        <PosterHeader />

        <PosterMaker
          photoInfo={this.state.photoInfo}
          templateDataURL={this.state.template}
          qrcodeInfo={this.state.qrcodeList[this.state.activeIndex]}/>

        <div styleName="template-swiper">
          {data.posters && <TemplateSwiper
            changeTemplate={this.changeTemplate}
            posterList={data.posters} />}
        </div>

        <div styleName="btn">
          <label styleName="upload-btn">重新选择
            <input
              ref={(input) => this.imageInput = input}
              styleName="image-input"
              type="file"
              accept="image/*"
              style={{ visibility: 'hidden' }}
              onClick={this.getPhoto} />
          </label>

          <div
            styleName="composite-btn"
            onClick={this.createPhoto}>
            分享生成海报
          </div>
        </div>

        {isModal && <FontJump fonts="海报生成中请稍等" />}
      </div>
    );
  }
}
export const Make = PosterHoc(Container);

import React from 'react';
import cx from 'classnames';
import { RouteComponentProps } from 'react-router-dom';
import { ILocalStorage, ILocalStorageKey } from 'src/utils/local-storage';
import { getUrlParams } from 'src/utils';
import * as weui from 'weui.js';
import dsbridge from 'dsbridge';
import { isRunApp } from 'src/utils';
import { PosterHeader } from '../components/poster-header';
import { getPosterGroup } from '../../../api/codecamp';
import { InvitationWords } from '../components/invitation-words';
import { ApiData } from '../type';
import { handleCopy } from '../../../utils';
import { imgUrl2Base64 } from '../components/poster-maker';
import { PosterHoc, PosterHocProps } from '../components/poster-hoc';
import './index.scss';


interface IndexProps extends RouteComponentProps, PosterHocProps {}
interface IndexState {
  posterImg:string;
  data:ApiData;
  isWeb:boolean;
  isModal:boolean;
  isShowInvitationWords:boolean;
}

class Container extends React.PureComponent<IndexProps, IndexState> {
  state = {
    posterImg: '',
    data: {} as ApiData,
    isWeb: false,
    isModal: false,
    isShowInvitationWords: true,
  }

  query:any = {};
  componentDidMount(){
    this.query = getUrlParams();
    this.getPosterImg();
    this.getPosterGroup();
    !isRunApp() && this.setState({ isWeb: true });
  }

  getPosterGroup = async() => {
    try {
      const { data } = await getPosterGroup(this.query.groupId);
      if(data.code === 200){
        document.title = data.data.title;
        this.setState({ data: data.data });
      }
    }catch (error) {
      console.log(error);
    }

  }

  getPosterImg=() => {
    const posterImg = ILocalStorage.getItem(ILocalStorageKey.POSTER_COMPLETE_IMG);
    this.setState({ posterImg });
  }
  // 是否显示邀请语组件
  isShowInvitationWords =(flag = false) => {
    const isShowInvitationWords = !this.state.isShowInvitationWords;
    this.setState({ isShowInvitationWords });

    if(flag){
      // 埋点上报上报数据
      this.props.reportData('继续分享按钮点击');
    }
  }

  copyAndShare = async(words:string) => {
    try {
      const res = await handleCopy(words);
      if (!res) {
        throw new Error('复制失败');
      }
      weui.toast('复制成功！');
      this.share('带文案分享按钮点击');
    } catch (error) {
      console.log(error);
      weui.topTips('复制失败！');
    }
  };

  share = async(text:string) => {
    // 埋点上报上报数据
    this.props.reportData(text);

    if(this.state.isWeb){
      this.setState({ isShowInvitationWords: false, isModal: true });
      return;
    }

    const imgbase64 = await imgUrl2Base64(this.state.posterImg);
    dsbridge.call('share_wechat_timeline', {
      'image_base64': imgbase64,
    });
  }

  closeModal = () => {
    this.setState({ isModal: false });
  }

  render() {
    const { data, isShowInvitationWords, posterImg, isModal } = this.state;
    return (
      <div styleName="wrap">
        <div styleName="main">
          <PosterHeader />
          <div styleName="poster_img">
            <img src={posterImg} />
          </div>
        </div>
        <div
          styleName="share_btn"
          onClick={this.isShowInvitationWords.bind(this, true)}>继续分享我的海报</div>
        {data.invitations && isShowInvitationWords && <div styleName={cx({ invitation_words: true })} >
          <InvitationWords
            handleClose={this.isShowInvitationWords}
            handleCopyAndShare={this.copyAndShare}
            handleShare={this.share}
            wordsList={data.invitations}/>
        </div>}

        {isModal && <div styleName="modal">
          <div
            styleName="close"
            onClick={this.closeModal}>
            <img src={require('../assets/modal_close.png')} />
          </div>
          <img
            src={posterImg}
            styleName="poster_img"/>
          <p>长按图片保存分享到朋友圈</p>
        </div>}
      </div>
    );
  }
}
export const Share = PosterHoc(Container);


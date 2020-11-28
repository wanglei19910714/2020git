import React from 'react';
import './index.scss';
interface IProps {
  closeModal:() => void;
}
interface IState {}

export class PosterModal extends React.PureComponent<IProps, IState> {
  state = {}

  render() {
    return (
      <div styleName="poster-modal">
        <div styleName="tips_img">
          <img
            src={require('../../assets/tips_img.png')}
            alt=""/>
        </div>
        <div styleName="tips_text">
         调整照片大小并移动至合适的位置 展示宝贝的最佳风采吧
        </div>
        <div
          styleName="tips_btn"
          onClick={this.props.closeModal}>
          我知道了
        </div>
      </div>
    );
  }
}


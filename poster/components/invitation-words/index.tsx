import React from 'react';
import './index.scss';

interface IProps {
  handleClose:() => void;
  handleCopyAndShare:(words:string) => void;
  handleShare:(text:string) => void;
  wordsList:string[];
}
interface IState {
}

export class InvitationWords extends React.PureComponent<IProps, IState> {
    state = {
      words: '',
    }

    componentDidMount(){
      this.randomWords();
    }

    randomWords = () => {
      const index = Math.floor(Math.random() * (this.props.wordsList.length));
      this.setState({ words: this.props.wordsList[index] });
    }

    render() {
      const { words } = this.state;
      return (
        <div styleName="wrap">
          <div styleName="modal">
            <div styleName="title_bg">
              <img
                src={require('../../assets/title.png')}/>
            </div>
            <div
              styleName="btn_close"
              onClick={this.props.handleClose}>
              <img src={require('../../assets/btn_close.png')}/>
            </div>
            <div styleName="words">
              <div styleName="show_text">
                {words}
              </div>
              <div
                styleName="change_text"
                onClick={this.randomWords}>
                <img
                  src={require('../../assets/shape.png')}
                  onClick={() => false}/>
                <span>换一换</span>
              </div>
            </div>
            <div styleName="share_btn">
              <div
                styleName="share"
                onClick={this.props.handleShare.bind(null, '普通分享点击')}>直接分享</div>
              <div
                styleName="copy"
                onClick={this.props.handleCopyAndShare.bind(null, words)}>一键复制</div>
            </div>
          </div>
        </div>
      );
    }
}


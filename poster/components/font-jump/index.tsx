import React from 'react';
import './index.scss';
interface IProps {
   fonts:string;
}
interface IState {}

export class FontJump extends React.PureComponent<IProps, IState> {
  state = {}

  render() {
    return (
      <div styleName="wrap">
        {this.props.fonts.split('').map((item, index) => <span key={index}>{item}</span>)}
        <span>...</span>
      </div>
    );
  }
}


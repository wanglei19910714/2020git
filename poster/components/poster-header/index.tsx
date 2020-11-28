import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { getUserInfoApi } from 'src/api/codecamp';
import { saveUserId } from 'src/utils';
import { getCreditsAmount } from 'src/api/codecamp';
import { Base64 } from 'js-base64';
import { isRunApp, encryptPhone } from 'src/utils';
import './index.scss';
import { withRouter } from 'react-router';
import { PosterHoc, PosterHocProps } from '../poster-hoc';

interface IProps extends RouteComponentProps, PosterHocProps{
}

interface UserInfo{
  avatarUrl:string;
  userId:number;
}
interface IState {
  isLogin:boolean;
  isWeb:boolean;
  userInfo:UserInfo;
  phone:string;
}

class Container extends React.PureComponent<IProps, IState> {
  state = {
    isLogin: false,
    isWeb: false,
    phone: '',
    userInfo: {} as UserInfo,
  }
  componentDidMount(){
    !isRunApp() && this.setState({ isWeb: true });
    this.hadLogin();
  }
  hadLogin = async() => {
    const res = await getUserInfoApi();
    console.log(res.data.bind_phone);

    if (res.status !== 200) {
      throw new Error(res.data.error_code);
    }
    const userInfo = await this.getAmount();
    this.setState({ userInfo: userInfo as UserInfo, isLogin: true, phone: res.data.bind_phone as string });
  };

 getAmount = async() => {
   const res = await getCreditsAmount();
   if (res.status !== 200) {
     throw new Error(res.data.error_code);
   }
   saveUserId(res.data.userId.toString());
   const { avatarUrl, userId } = res.data;
   return { avatarUrl, userId };
 }

 render() {
   const { isLogin, userInfo, isWeb, phone } = this.state;
   return (
     <div styleName="wrap">
       {isWeb ? <div>
         {isLogin ? <div styleName="login">
           <img src={userInfo.avatarUrl}/>
           <span styleName="phone">{encryptPhone(phone)}</span>
           <span
             styleName="account"
             onClick={this.props.switchAccount}>切换账号</span>
         </div> : <div styleName="login">
           <img src={require('../../assets/img_avatar_notlogin.png')}/>
           <span
             styleName="account"
             onClick={this.props.switchAccount}>未登录</span>
         </div>}
       </div> : <div />}

       <div styleName="record" >邀请记录</div>
     </div>
   );
 }
}

export const PosterHeader = withRouter(PosterHoc(Container));

import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { getUrlParams, transferObjToUrlQuery } from 'src/utils';
import { getUserInfoApi } from 'src/api/codecamp';
import { Base64 } from 'js-base64';
import { IEventIdShadow } from 'src/types/burying-point';
import { reportPoster } from 'src/utils/burying-point';
import { createPosterRecord } from '../../../../api/codecamp';

export interface PosterHocProps{
  isLogin:boolean;
  switchAccount:() => void;
  reportData:(element:string) => void;
  reportDataVisit:() => void;
  createPosterRecord:(posterId:number) => void;
  switchToPage:(pagePath:string, queryObj:object) => void;
}
const ContainerHoc = (InnerComponent:React.ComponentClass<PosterHocProps> ) =>
  class Container extends React.PureComponent<RouteComponentProps> {
    state = {
      isLogin: false,
    }
    query:any = {};
    componentDidMount() {
      this.query = getUrlParams();
      this.isLogin();
    }

    /** 是否登录 */
    isLogin = async() => {
      const res = await getUserInfoApi();
      res.status === 200 && this.setState({ isLogin: true });
    }

    /** 跳转到登录页 */
    switchAccount = () => {
      const url = Base64.encode(`${location.pathname}${location.search}`);
      const loginBack = `loginBack=${url}`;
      this.props.history.push({
        pathname: '/children-day/login',
        search: loginBack,
      });
    };

    /** 创建用户分享记录 */
    createPosterRecord = async(posterId:number) => {
      const { groupId, utm_term, utm_source, utm_content } = this.query;
      const res = await createPosterRecord({
        posterGroupId: groupId,
        posterId: posterId,
        firstChannelParam: utm_term,
        secondChannelParam: utm_source,
        thirdChannelParam: utm_content,
      });
      console.log(res);
    }

    /** 埋点上报上报数据 （点击） */
    reportData = (element:string) => {
      reportPoster(IEventIdShadow.posterReportClick, {
        activity_id: this.query.groupId,
        element,
      });
    }

    /** 埋点上报上报数据 （点） */
    reportDataVisit = () => {
      reportPoster(IEventIdShadow.posterReportVisit, {
        activity_id: this.query.groupId,
      });
    }

    /** 页面跳转 并在url上携带参数 */
    switchToPage = (pagePath:string, queryObj:object = {}) => {
      this.props.history.push({
        pathname: pagePath,
        search: transferObjToUrlQuery(queryObj, ''),
      });
    }

    render() {
      const { isLogin } = this.state;
      return (
        <InnerComponent
          isLogin={isLogin}
          switchAccount={this.switchAccount}
          reportData={this.reportData}
          reportDataVisit={this.reportDataVisit}
          createPosterRecord={this.createPosterRecord}
          switchToPage={this.switchToPage}
          {...this.props}
        />
      );
    }
  };

export const PosterHoc = ContainerHoc;

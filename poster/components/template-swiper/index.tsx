import React from 'react';
import cx from 'classnames';
import Swiper from 'swiper';
import { PosterItem } from '../../type';
import style from './index.scss';
import 'swiper/css/swiper.css';

interface IProps {
  changeTemplate:(link:string, posterId:number, posterType:number, index:number) => void;
  posterList:PosterItem[];
}

interface IState {
}

export class TemplateSwiper extends React.PureComponent<IProps, IState> {
  state = {}
  componentDidMount() {
    this.instanceSwiper();
  }

  galleryTop:Swiper = {} as Swiper;
  galleryThumbs:Swiper = {} as Swiper;
  instanceSwiper = () => {

    this.galleryThumbs = new Swiper('.swiper-container', {
      slidesPerView: 'auto',
      freeMode: true,
      watchSlidesVisibility: true,
      watchSlidesProgress: true,
      on: {
        slideChange: function() {
          console.log(`slide change，activeIndex = ${this.activeIndex}`);
        },
      },
    });

    this.galleryTop = new Swiper('.gallery-top', {
      thumbs: {
        swiper: this.galleryThumbs,
        slideThumbActiveClass: 'swiper-slide-active',
        multipleActiveThumbs: false,
      },

    });
  }

  // 结束时销毁swiper
  componentWillUnmount() {
    if (this.galleryThumbs.destroy) {
      this.galleryThumbs.destroy();
      this.galleryThumbs = null;
    }
  }

  handleClick = (item:PosterItem, index:number) => {
    const { buildTemplateLink, id, type } = item;
    this.props.changeTemplate(buildTemplateLink, id, type, index);
  }
  render() {
    return (
      <div className={cx(style.wrapper)}>
        <div className="gallery-top" />
        <div
          className="swiper-container"
        >
          <div className="swiper-wrapper">
            {this.props.posterList.map((item, index) => <div
              key={index}
              className="swiper-slide"
              onClick={this.handleClick.bind(this, item, index)}>
              <img src={item.buildTemplateLink} />
            </div>)}
          </div>
          <div className="swiper-pagination" />
        </div>
      </div>
    );
  }
}

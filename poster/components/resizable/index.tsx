
import React from 'react';

interface ResizeProps {
  step?:number;
  useDefaultResize?:boolean;
  onResize?:(deltaDistance:number) => void;
}

interface ResizeState {

}

interface Location {
  x:number;
  y:number;
}

const STEP = 10;
export class Resizable extends React.PureComponent<ResizeProps, ResizeState> {
  constructor(props:ResizeProps) {
    super(props);
  }

  initTouch:Location = { x: 0, y: 0 };
  latestTouch:Location = { x: 0, y: 0 };
  currentElement:HTMLElement | null;
  resizableElement:HTMLElement;
  step:number;

  componentDidMount() {
    this.initPropsAndEvents();
  }

  //* * 初始化 步长 拖拽元素，事件注册 */
  initPropsAndEvents = () => {
    this.step = this.props.step || STEP;
    this.getResizableElement();
    if (!this.resizableElement) {
      return;
    }

    this.resizableElement.addEventListener('touchstart', (e) => this.getInitPosition(e), false);
    this.resizableElement.addEventListener('touchmove', (e) => this.getMovePosition(e), false);
    this.resizableElement.addEventListener('touchend', (e) => this.getLeavePosition(e), false);
  }
  //* * 获取可拖拽Element */
  getResizableElement = () => {
    if (!this.currentElement || !this.currentElement.firstChild) {
      console.error('can not find child dom element');
      return;
    }

    this.currentElement.childNodes.length > 1 && console.log('only the first child can be dragable ...');
    this.resizableElement = this.currentElement.firstChild as HTMLElement;
  }
  getInitPosition = (e:any) => {
    e.preventDefault();
    if (e.touches.length > 1) {
      this.initTouch.x = e.touches[0].clientX - e.touches[1].clientX;
      this.initTouch.y = e.touches[0].clientY - e.touches[1].clientY;
    }
  }
  getMovePosition = (e:any) => {
    e.preventDefault();
    if (e.touches.length > 1) {
      this.latestTouch.x = e.touches[0].clientX - e.touches[1].clientX;
      this.latestTouch.y = e.touches[0].clientY - e.touches[1].clientY;
      const { x: initX, y: initY } = this.initTouch;
      const { x: latestX, y: latestY } = this.latestTouch;
      const originDistance = Math.sqrt(initX * initX + initY * initY);
      const latestDistance = Math.sqrt(latestX * latestX + latestY * latestY);
      const delta = latestDistance - originDistance;
      if (Math.abs(delta) < this.step) {
        return;
      }
      if (this.props.useDefaultResize) {
        try {
          this.resizableElement.style.width += delta;
        } catch (error) {
          console.log(error);
        }
      }
      this.props.onResize && this.props.onResize(delta);

      this.initTouch.x = this.latestTouch.x;
      this.initTouch.y = this.latestTouch.y;
    }
  }
  getLeavePosition = (e:TouchEvent) => {
    if (e.touches.length === 1) {
      this.initTouch.x = e.touches[0].clientX;
      this.initTouch.y = e.touches[0].clientY;
    }
  }

  render() {
    return (
      <div
        className="resizable"
        ref={(dom) => this.currentElement = dom}>
        {this.props.children}
      </div>
    );
  }
}



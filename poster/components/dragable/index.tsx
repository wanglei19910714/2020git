
import React from 'react';

interface DragableProps {
  step?:number;
  useDefaultDrag?:boolean;
  onDrag?:(target:HTMLElement, delta:DeltaLocation) => void;
}

interface DragableState {

}

export interface DeltaLocation {
  x:number;
  y:number;
}

const STEP = 10;
export class Dragable extends React.PureComponent<DragableProps, DragableState> {
  constructor(props:DragableProps) {
    super(props);
  }

  initTouch:DeltaLocation = { x: 0, y: 0 };
  latestTouch:DeltaLocation = { x: 0, y: 0 };
  currentElement:HTMLElement | null;
  dragableElement:HTMLElement;
  step:number;

  componentDidMount() {
    this.initPropsAndEvents();
  }

  //* * 初始化 步长 拖拽元素，事件注册 */
  initPropsAndEvents = () => {
    this.step = this.props.step || STEP;
    this.getDragableElement();
    if (!this.dragableElement) {
      return;
    }

    this.dragableElement.addEventListener('touchstart', (e) => this.getInitPosition(e), false);
    this.dragableElement.addEventListener('touchmove', (e) => this.getMovePosition(e), false);
    this.dragableElement.addEventListener('touchend', (e) => this.getLeavePosition(e), false);
  }
  //* * 获取可拖拽Element */
  getDragableElement = () => {
    if (!this.currentElement || !this.currentElement.firstChild) {
      console.error('can not find child dom element');
      return;
    }

    this.currentElement.childNodes.length > 1 && console.log('only the first child can be dragable ...');
    this.dragableElement = this.currentElement.firstChild as HTMLElement;
  }
  getInitPosition = (e:any) => {
    e.preventDefault();
    this.initTouch.x = e.touches[0].clientX;
    this.initTouch.y = e.touches[0].clientY;
  }
  getMovePosition = (e:any) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.latestTouch.x = e.touches[0].clientX;
      this.latestTouch.y = e.touches[0].clientY;
      const dragable = Math.abs(this.latestTouch.x - this.initTouch.x) > this.step ||
        Math.abs(this.latestTouch.y - this.initTouch.y) > this.step;
      if (dragable) {
        const delta:DeltaLocation = {
          x: this.latestTouch.x - this.initTouch.x,
          y: this.latestTouch.y - this.initTouch.y,
        };
        if (this.props.useDefaultDrag) {
          this.dragableElement.style.left += delta.x;
          this.dragableElement.style.top += delta.y;
        }
        this.props.onDrag && this.props.onDrag(this.dragableElement, delta);

        // 元素移动后，重置initTouch
        this.initTouch.x = this.latestTouch.x;
        this.initTouch.y = this.latestTouch.y;
      }
    }
  }
  getLeavePosition = (e:any) => {
    if (e.touches.length === 1) {
      this.initTouch.x = e.touches[0].clientX;
      this.initTouch.y = e.touches[0].clientY;
    }
  }

  render() {
    return (
      <div
        className="dragable"
        ref={(dom) => this.currentElement = dom}>
        {this.props.children}
      </div>
    );
  }
}



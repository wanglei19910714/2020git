export interface PosterItem{
  id:number;
  name:string;
  type:number;
  posterNumber:number;
  qrcodeLink:string;
  indicationTemplateLink:string;
  buildTemplateLink:string;
  qrcodeLength:number;
}


export interface ApiData{
  id:number;
  name:string;
  title:string;
  individuationCopywriting:string;
  ordinaryCopywriting:string;
  showBubble:boolean;
  bubbleCopywriting:string;
  posters:PosterItem[];
  invitations:string[];
}



'use client';

import React from 'react';
import { Viewer } from 'mapillary-js';

interface ViewerComponentProps {
  accessToken: string;
  imageId: string;
  style?: React.CSSProperties;
}

interface RenderMapillaryProps {
  accessToken: string;
}

class ViewerComponent extends React.Component<ViewerComponentProps> {
  private containerRef: React.RefObject<HTMLDivElement | null>;
  private viewer: Viewer | null = null;

  constructor(props: ViewerComponentProps) {
    super(props);
    this.containerRef = React.createRef<HTMLDivElement>();
  }

  componentDidMount(): void {
    this.viewer = new Viewer({
      accessToken: this.props.accessToken,
      container: this.containerRef.current!,
      imageId: this.props.imageId,
    });
  }

  componentWillUnmount(): void {
    if (this.viewer) {
      this.viewer.remove();
    }
  }

  render(): React.ReactNode {
    return <div ref={this.containerRef} style={this.props.style} />;
  }
}

interface RenderMapillaryProps {
  accessToken: string;
  widthPercent: number;   // width as %
  heightPercent: number;  // height as %
  imageID?: string;
}

function RenderMapillary({ accessToken, widthPercent, heightPercent, imageID }: RenderMapillaryProps): React.ReactNode {
    return (
      <ViewerComponent
        accessToken={accessToken}
        imageId={imageID || '498763468214164'}
        style={{ 
          width: `${widthPercent}%`, 
          height: `${heightPercent}vh` 
        }}
      />
    );
}


export default RenderMapillary;
'use client';

import React from 'react';
import { Viewer } from 'mapillary-js';

interface ViewerComponentProps {
  accessToken: string;
  imageId: string;
  style?: React.CSSProperties;
  onError?: (error: unknown) => void;
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
    try {
      this.viewer = new Viewer({
        accessToken: this.props.accessToken,
        container: this.containerRef.current!,
        imageId: this.props.imageId,
      });

      (this.viewer as any)?.on?.('error', (event: unknown) => {
        this.props.onError?.(event);
      });
    } catch (error) {
      this.props.onError?.(error);
    }
  }

  componentDidUpdate(prevProps: ViewerComponentProps): void {
    if (this.viewer && prevProps.imageId !== this.props.imageId) {
      this.viewer
        .moveTo(this.props.imageId)
        .catch((error: unknown) => this.props.onError?.(error));
    }
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
  imageID: string;
  onImageError?: (error: unknown) => void;
}

function RenderMapillary({ accessToken, widthPercent, heightPercent, imageID, onImageError }: RenderMapillaryProps): React.ReactNode {
    console.log(imageID, typeof imageID);
    return (
      <ViewerComponent
        accessToken={accessToken}
        imageId={imageID}
        onError={onImageError}
        style={{ 
          width: `${widthPercent}%`, 
          height: `${heightPercent}vh` 
        }}
      />
    );
}


export default RenderMapillary;
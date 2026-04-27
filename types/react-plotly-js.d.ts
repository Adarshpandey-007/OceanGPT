declare module 'react-plotly.js' {
  import * as React from 'react';
  import { Layout, Data, Config } from 'plotly.js';
  export interface PlotParams {
    data: Partial<Data>[];
    layout?: Partial<Layout> & { frames?: any };
    config?: Partial<Config>;
    style?: React.CSSProperties;
    className?: string;
    onInitialized?: (figure: any, graphDiv: any) => void;
    onUpdate?: (figure: any, graphDiv: any) => void;
  }
  export default class Plot extends React.Component<PlotParams> {}
}

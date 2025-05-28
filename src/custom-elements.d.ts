declare namespace JSX {
  interface IntrinsicElements {
    'ruffle-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      autoplay?: boolean;
      controls?: boolean;
      src?: string;
      // Adicione outras propriedades se necessário
    };
  }
}
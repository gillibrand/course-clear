declare global {
  namespace JSX {
    interface IntrinsicElements {
      "course-clear": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        greeting?: string;
        open?: string;
      };
    }
  }
}

export {};

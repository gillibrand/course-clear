declare global {
  namespace JSX {
    interface IntrinsicElements {
      "course-clear": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        greeting?: string;
        open?: string;
        "close-on-esc"?: string;
        "close-on-outside"?: string;
      };
    }
  }
}

export {};

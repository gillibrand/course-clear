import { useState } from "react";
import "course-clear";

import { Details } from "./Details";

function App() {
  const [open, setOpen] = useState(true);

  const params = new URLSearchParams(document.location.hash.slice(1));
  const text = params.get("t") || undefined;

  function handleReplayClick(e: React.MouseEvent<HTMLDivElement>) {
    const replayButton = (e.target as HTMLDivElement).closest("button[data-cc-replay]");
    if (!replayButton) return;

    // Just toggle closed and open with a delay to replay
    setOpen(false);
    setTimeout(() => setOpen(true), 1000);
  }

  return (
    <div onClick={handleReplayClick}>
      <course-clear greeting={text} open={open ? "" : undefined} close-on-esc="">
        <Details />
      </course-clear>
    </div>
  );
}

export default App;

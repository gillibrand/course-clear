import { useState } from "react";
import "./App.css";
import { CourseClear } from "@lib/course-clear";
import { Details } from "./Details";

function App() {
  const [key, setKey] = useState(0);

  const params = new URLSearchParams(document.location.hash.slice(1));
  const text = params.get("t") || undefined;

  function handleReplayClick(e: React.MouseEvent<HTMLDivElement>) {
    const replayButton = (e.target as HTMLDivElement).closest("button[data-cc-replay]");
    if (!replayButton) return;

    // change key to force a rerender if the text is changed or not
    setKey((oldKey) => oldKey + 1);
  }

  return (
    <div onClick={handleReplayClick}>
      <CourseClear greeting={text} key={key}>
        <Details />
      </CourseClear>
    </div>
  );
}

export default App;

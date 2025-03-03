import "./App.css";
import { CourseClear } from "./course-clear";
// import "./course-clear.js";

function App() {
  const params = new URLSearchParams(document.location.search.slice(1));
  const text = params.get("t") || undefined;

  return (
    <>
      <CourseClear text={text} />
      {/* <course-clear /> */}
    </>
  );
}

export default App;

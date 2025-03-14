import "course-clear";
import { useEffect, useState } from "react";

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

  function didOpen(e: Event) {
    console.info("opened ", e.target);
  }

  function didClose(e: Event) {
    console.info("closed ", e.target);
  }

  useEffect(() => {
    document.addEventListener("opened", didOpen);
    document.addEventListener("closed", didClose);

    return () => {
      document.removeEventListener("opened", didOpen);
      document.removeEventListener("closed", didClose);
    };
  }, []);

  return (
    <div onClick={handleReplayClick}>
      <course-clear greeting={text} open={open ? "" : undefined} close-on-esc="" close-on-outside="">
        <Details />
      </course-clear>

      <p>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Et fuga at atque aspernatur. Quas, quam quod! Facilis,
        voluptate. Amet atque, corrupti tempore dolores temporibus doloremque voluptatum voluptate quae asperiores
        maxime in ducimus. Voluptate, asperiores voluptatibus reprehenderit placeat quae voluptatem libero nam omnis
        nobis, sequi assumenda fuga vero? Fugiat, ex. Assumenda accusamus aperiam aut mollitia ea veritatis
        necessitatibus ipsum corporis facilis veniam delectus, velit quibusdam animi labore distinctio consectetur, vel
        molestiae sunt? Cum, fuga doloremque in excepturi temporibus ipsa distinctio doloribus dolorem dolorum,
        molestias est? Quos impedit tempore perspiciatis maxime neque deserunt voluptate officia vel, tempora nihil
        saepe corrupti iste velit.
      </p>

      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde saepe, nemo ullam quidem nobis vel incidunt autem
        aliquid consequatur quaerat ab enim maiores assumenda nihil hic, laborum libero eius nam, repudiandae adipisci
        tenetur sint aperiam sapiente quo. Autem velit, excepturi, voluptatibus nihil officia a natus laborum quod
        libero et adipisci?
      </p>

      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Error, atque ducimus ut eveniet vel officiis deleniti
        beatae minima laudantium quae nostrum hic sapiente debitis commodi possimus eligendi impedit dolorum distinctio
        nesciunt sint eos. Fugiat, quidem ipsa necessitatibus dolorem sequi voluptatibus qui quam eum. Impedit
        voluptatibus quam corporis nostrum. Minima reprehenderit id cupiditate magnam. Voluptates aliquam esse illo vel
        voluptate ex dolorem iste eum, harum vitae reiciendis eaque illum modi aliquid nisi optio saepe vero in.
      </p>
    </div>
  );
}

export default App;

import "./Details.css";

function Details({ onClick }: { onClick?: () => void }) {
  return (
    <div className="Details">
      <div className="Details__sidebar">
        <button className="Details-star-button" onClick={onClick ? () => onClick() : undefined} data-cc-replay="true">
          <span>↺</span>
          <span>Replay</span>
        </button>
      </div>

      <div className="Details_main">
        <p>Hi, I'm Jay.</p>

        <p>
          This is demo of my video game-inspired <a href="#CourseClear">Course Clear</a> web component. Learn more about
          me on my projects site.
        </p>

        <div className="Details__buttons">
          <a className="Details-button" href="https://gillibrand.github.io/projects/">
            Go to <span style={{ whiteSpace: "nowrap" }}>My Projects →</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export { Details };

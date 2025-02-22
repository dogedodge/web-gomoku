// import { Link } from 'react-router-dom';
// import { AsyncButton } from '../../common/components/AsyncButton';
// import { CodeCopyField } from '../../common/components/CodeCopyField';
// import { PlayerBadge } from '../../common/components/PlayerBadge';
// import "./HomeScreen.module.scss";

const HomeScreen = () => {
  return (
    <div className="HomeScreen">
      <h1>Welcome to Web Gomoku</h1>
      <div className="ModeSwitch">
        <h2>Choose your gaming mode:</h2>
        {/* <AsyncButton
          type="button"
          onClick={async () => {
            // Handle offline game start logic
          }}
        >
          Play Offline
        </AsyncButton>
        <AsyncButton
          type="button"
          onClick={async () => {
            // Handle online game start logic
          }}
        >
          Play Online
        </AsyncButton> */}
      </div>
      {/* <div className="CodeCopyField">
        <CodeCopyField code="JOIN_CODE_HERE" />
      </div>
      <div className="PlayerBadge">
        <PlayerBadge playerName="Player 1" />
      </div> */}
    </div>
  );
};

export default HomeScreen;

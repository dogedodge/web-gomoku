// import "./App.css";
// import { GameBoard } from "./components/GameBoard";
import { Provider } from "react-redux";
import { store } from "./app/store";
// import { Popup } from "./components/Popup";

// function App() {
//   // const [count, setCount] = useState(0)

//   return (
//     <>
//       <Provider store={store}>
//         <GameBoard size={400} gridStrokeWidth={2}></GameBoard>
//         <Popup></Popup>
//       </Provider>
//     </>
//   );
// }

// export default App;

// src/App.tsx
import AppRouter from "./routes/AppRouter";
import { BrowserRouter } from "react-router-dom";

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="App">
          <AppRouter />
        </div>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

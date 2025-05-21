import React from "react";
import { Chessboard } from "react-chessboard";
import "./App.css";

function App() {
  return (
    <div className="App">
      <div className="board-wrapper">
        <Chessboard />
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from "react";
import { Chess, Square, Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import "./App.css";

const chess = new Chess();

function App() {
  const [game, setGame] = useState<Chess>(chess);
  const [turn, setTurn] = useState<string>(game.turn());
  const [activeSquare, setActiveSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [visibleIndex, setVisibleIndex] = useState<number>(-1); // -1 = noch kein Zug

  useEffect(() => {
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        alert("Schachmatt! " + (game.turn() === "w" ? "Schwarz" : "Weiß") + " gewinnt.");
      } else if (game.isDraw()) {
        alert("Unentschieden!");
      }
    }
    setTurn(game.turn());
  }, [game]);

	function handleUndo() {
		if (historyStack.length > 0 && visibleIndex >= 0) {
			const newRedoStack = [game.fen(), ...redoStack];
			const previousFen = historyStack[historyStack.length - 1];
			setHistoryStack(historyStack.slice(0, -1));
			setRedoStack(newRedoStack);
			setGame(new Chess(previousFen));
			setActiveSquare(null);
			setLegalMoves([]);
			setVisibleIndex(visibleIndex - 1);
		}
	}
	function handleRedo() {
		if (redoStack.length > 0 && visibleIndex < moveHistory.length - 1) {
			const nextFen = redoStack[0];
			setRedoStack(redoStack.slice(1));
			setHistoryStack([...historyStack, game.fen()]);
			setGame(new Chess(nextFen));
			setActiveSquare(null);
			setLegalMoves([]);
			setVisibleIndex(visibleIndex + 1);
		}
	}
	function handleReset() {
		setGame(new Chess());
		setHistoryStack([]);
		setRedoStack([]);
		setMoveHistory([]);
		setVisibleIndex(-1);
		setActiveSquare(null);
		setLegalMoves([]);
	}



  function safeGameMutate(modify: (game: Chess) => void) {
    const updatedGame = new Chess(game.fen());
    try {
      modify(updatedGame);
      setGame(updatedGame);
    } catch (e) {
      console.error("Ungültiger Zug:", e);
      alert("Ungültiger Zug!");
    }
  }

  function onDrop(sourceSquare: Square, targetSquare: Square): boolean {
	let moveMade = false;
	const prevFen = game.fen();

	safeGameMutate((game: Chess) => {
		const move = game.move({
			from: sourceSquare,
			to: targetSquare,
			promotion: "q",
		});
		if (move) {
			moveMade = true;
			setActiveSquare(null);
			setLegalMoves([]);

			// 🧠 Truncate, falls vorher Undo gemacht wurde
			const newHistory = moveHistory.slice(0, visibleIndex + 1);
			const updatedHistory = [...newHistory, move.san];
			setMoveHistory(updatedHistory);
			setVisibleIndex(updatedHistory.length - 1); // letzter Eintrag sichtbar

			setHistoryStack([...historyStack, prevFen]);
			setRedoStack([]);
		} else {
			throw new Error("Illegaler Zug oder nicht am Zug");
		}
	});

	return moveMade;
  }



  function onSquareClick(square: Square) {
	  const piece = game.get(square);
	  if (square === activeSquare) {
		setActiveSquare(null);
		setLegalMoves([]);
	  } else if (piece && piece.color === game.turn()) {
		const moves = game.moves({ square, verbose: true }) as Move[];
		const destinations = moves.map((move) => move.to);
		setActiveSquare(square);
		setLegalMoves(destinations);
	  } else if (legalMoves.includes(square) && activeSquare) {
		onDrop(activeSquare, square);
	  } else {
		setActiveSquare(null);
		setLegalMoves([]);
	  }
	}


  function getSquareStyles() {
    const styles: { [square in Square]?: React.CSSProperties } = {};
    legalMoves.forEach((sq) => {
      styles[sq] = {
        backgroundColor: "rgba(255, 255, 0, 0.4)",
      };
    });
    if (activeSquare) {
      styles[activeSquare] = {
        backgroundColor: "rgba(0, 255, 0, 0.4)",
      };
    }
    return styles;
  }

  return (
    <div className="App">
      <h1>RotaChess</h1>
      <p>Zug: {turn === "w" ? "⚪" : "⚫"}</p>
      <div className="chessboard-wrapper">
		<Chessboard 
			position={game.fen()}
			onPieceDrop={onDrop}
			onSquareClick={onSquareClick}
			customSquareStyles={getSquareStyles()}
		/>
		</div>
		<div className="move-history">
			<h3>Zug-Historie</h3>
			<ol>
			  {moveHistory.map((move, index) => {
				const isActive = index === visibleIndex;
				const isEven = index % 2 === 0;
				const bgClass = isEven ? "white-bg" : "black-bg";

				return (
				  <li key={index}>
					<span className={`move-span ${bgClass} ${isActive ? "highlight" : ""}`}>
					  {move}
					</span>
				  </li>
				);
			  })}
			</ol>
			
			<div className="buttons">
				<button onClick={handleUndo}>↩</button>
				<button onClick={handleRedo}>↪</button>
				<button onClick={handleReset}>⟳</button>
			</div>
		</div>
	</div>
  );
}

export default App;

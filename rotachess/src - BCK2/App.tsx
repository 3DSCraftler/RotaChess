// src/App.tsx
import React, { useState, useEffect } from "react";
import { Chess, Square, Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import MoveHistory from "./components/MoveHistory";
import ControlButtons from "./components/ControlButtons";
import "./styles/App.css";

const initialGame = new Chess();

function App() {
	const [game, setGame] = useState<Chess>(initialGame);
	const [turn, setTurn] = useState<"w" | "b">(game.turn());
	const [activeSquare, setActiveSquare] = useState<Square | null>(null);
	const [legalMoves, setLegalMoves] = useState<Square[]>([]);
	const [moveHistory, setMoveHistory] = useState<string[]>([]);
	const [historyStack, setHistoryStack] = useState<string[]>([]);
	const [redoStack, setRedoStack] = useState<string[]>([]);
	const [visibleIndex, setVisibleIndex] = useState<number>(-1);
	const [orientation, setOrientation] = useState<"white" | "black">("white");

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
	
	
	const rotateBoard = () => {
		alert("TODO");
	};
	/*
	const rotateBoard = () => {
		const rotatedFen = rotateFen(game.fen());
		const newGame = new Chess(rotatedFen);

		setGame(newGame);
		setOrientation(prev => (prev === "white" ? "black" : "white"));
		setTurn(newGame.turn());
		setMoveHistory(newGame.history());
		setVisibleIndex(newGame.history().length - 1);
		setActiveSquare(null);
		setLegalMoves([]);
		setHistoryStack([]);
		setRedoStack([]);
	};
	
	const rotateFen = (fen: string): string => {
		const [position, turn, , enPassant, halfmove, fullmove] = fen.split(" ");

		const rows = position.split("/");
		const rotatedRows = rows.reverse().map(row => {
			let newRow = "";
			for (const char of row) {
				if (/[1-8]/.test(char)) {
					newRow += char;
				} else {
					newRow += char === char.toLowerCase()
						? char.toUpperCase()
						: char.toLowerCase();
				}
			}
			return newRow.split("").reverse().join("");
		});

		const rotateSquare = (square: string): string => {
			if (square === "-") return "-";
			const file = square[0];
			const rank = square[1];
			const rotatedFile = String.fromCharCode('h'.charCodeAt(0) - (file.charCodeAt(0) - 'a'.charCodeAt(0)));
			const rotatedRank = (9 - parseInt(rank)).toString();
			return rotatedFile + rotatedRank;
		};

		const newTurn = turn === "w" ? "b" : "w";
		const newEnPassant = rotateSquare(enPassant);
		const newCastling = "-";

		return `${rotatedRows.join("/")} ${newTurn} ${newCastling} ${newEnPassant} ${halfmove} ${fullmove}`;
	};

	*/
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

		safeGameMutate((g) => {
			const move = g.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
			if (move) {
				moveMade = true;
				const newHistory = moveHistory.slice(0, visibleIndex + 1);
				const updatedHistory = [...newHistory, move.san];
				setMoveHistory(updatedHistory);
				setVisibleIndex(updatedHistory.length - 1);
				setHistoryStack([...historyStack, prevFen]);
				setRedoStack([]);
				setActiveSquare(null);
				setLegalMoves([]);
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
			setActiveSquare(square);
			setLegalMoves(moves.map(m => m.to));
		} else if (legalMoves.includes(square) && activeSquare) {
			onDrop(activeSquare, square);
		} else {
			setActiveSquare(null);
			setLegalMoves([]);
		}
	}

	function getSquareStyles() {
		const styles: { [square in Square]?: React.CSSProperties } = {};
		legalMoves.forEach(sq => {
			styles[sq] = { backgroundColor: "rgba(255, 255, 0, 0.4)" };
		});
		if (activeSquare) {
			styles[activeSquare] = { backgroundColor: "rgba(0, 255, 0, 0.4)" };
		}
		return styles;
	}

	function handleUndo() {
		if (historyStack.length > 0 && visibleIndex >= 0) {
			const previousFen = historyStack[historyStack.length - 1];
			setRedoStack([game.fen(), ...redoStack]);
			setHistoryStack(historyStack.slice(0, -1));
			setGame(new Chess(previousFen));
			setMoveHistory(moveHistory.slice(0, -1));
			setVisibleIndex(visibleIndex - 1);
			setActiveSquare(null);
			setLegalMoves([]);
		}
	}

	function handleRedo() {
		if (redoStack.length > 0) {
			const nextFen = redoStack[0];
			setHistoryStack([...historyStack, game.fen()]);
			setRedoStack(redoStack.slice(1));
			const newGame = new Chess(nextFen);
			setGame(newGame);

			const newMove = newGame.history().at(-1);
			if (newMove) {
				setMoveHistory([...moveHistory, newMove]);
				setVisibleIndex(visibleIndex + 1);
			}

			setActiveSquare(null);
			setLegalMoves([]);
		}
	}

	function handleReset() {
		const newGame = new Chess();
		setGame(newGame);
		setHistoryStack([]);
		setRedoStack([]);
		setMoveHistory([]);
		setVisibleIndex(-1);
		setActiveSquare(null);
		setLegalMoves([]);
		setOrientation("white");
		setTurn("w");
	}

	return (
		<div className="App">
			<h1>RotaChess</h1>
			<h5>Chess. But with rotations ¯\_(ツ)_/¯</h5>
			<p>Waiting for: {turn === "w" ? "⚪" : "⚫"}</p>
			<div className="chessboard-wrapper">
				<Chessboard
					position={game.fen()}
					onPieceDrop={onDrop}
					onSquareClick={onSquareClick}
					customSquareStyles={getSquareStyles()}
					boardOrientation={orientation}
				/>
			</div>
			<div className="move-history">
				<MoveHistory moveHistory={moveHistory} visibleIndex={visibleIndex} />
				<ControlButtons
					onUndo={handleUndo}
					onRedo={handleRedo}
					onReset={handleReset}
					/* onRotate={rotateBoard} */
				/>
			</div>
			<button className="dev-button1" onClick={rotateBoard}>
				↻ Rotate Board + Switch Sides
			</button>
		</div>
	);
}

export default App;

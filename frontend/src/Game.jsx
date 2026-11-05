import { useState, useEffect, useMemo } from "react"
import './Game.css'
import { API_URL } from "./constants"
import LetterGrid from "./LetterGrid"
import { letterStyle, LetterStatus } from "./util"

const GameStatus = Object.freeze({
    IN_PROGRESS: 0,
    WON: 1,
    LOST: 2,
    INVALID: 3,
})

function buildBoard(wordLength, gameState) {
    const previousGuess = gameState?.guesses ?? []
    const remainingLength = Math.max(wordLength + 1 - previousGuess.length, 0)
    const emptyGuesses = Array.from({ length: remainingLength }, () =>
        Array.from({ length: wordLength }, () => ({ letter: "", status: LetterStatus.NOT_IN_WORD })))
    return [...previousGuess, ...emptyGuesses]
}

export default function Game({ gameId, wordLength, gameState }) {
    const [guesses, setGuesses] = useState(() => buildBoard(wordLength, gameState))
    const [cursor, setCursor] = useState(() => ({ row: gameState?.guesses.length ?? 0, col: 0 }))
    const [shake, setShake] = useState(false)
    const [gameStatus, setGameStatus] = useState(() => gameState?.status ?? GameStatus.IN_PROGRESS)
    const [answer, setAnswer] = useState(() => gameState?.answer ?? '')

    const endMessage =
        gameStatus === GameStatus.WON
            ? "Congrats, you won!"
            : gameStatus === GameStatus.LOST
                ? `Sorry, you lost. The correct word was ${answer}`
                : "";


    useEffect(() => {
        const onKeyDown = (event) => {
            if (gameStatus !== GameStatus.IN_PROGRESS) {
                return;
            }
            if (event.ctrlKey || event.metaKey || event.altKey) return
            if (/^[a-zA-Z]$/.test(event.key)) {
                const newGuesses = [...guesses]
                newGuesses[cursor.row][cursor.col].letter = event.key.toUpperCase()
                setGuesses(newGuesses)
                if (cursor.col < guesses[0].length - 1) {
                    setCursor({ row: cursor.row, col: cursor.col + 1 })
                }
            }
            else if (event.key === "Backspace") {
                const newCol = guesses[cursor.row][cursor.col].letter !== "" ? cursor.col : cursor.col - 1;
                if (newCol < 0) return;
                const newGuesses = [...guesses];
                newGuesses[cursor.row][newCol].letter = "";
                setGuesses(newGuesses);
                setCursor({ row: cursor.row, col: newCol });

            }
            else if (event.key === "Enter") {
                const guess = guesses[cursor.row].map((letter) => letter.letter).join('')
                if (guess.length < wordLength) {
                    setShake(true);
                    return;
                }
                if (gameStatus === GameStatus.IN_PROGRESS) {
                    fetch(`${API_URL}/guess`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            "game_id": gameId,
                            guess
                        })
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            const result = data.result
                            if (result.status === GameStatus.INVALID) {
                                setShake(true)
                                return
                            }
                            const newGuesses = [...guesses]
                            newGuesses[cursor.row].map((guess, idx) => {
                                const { status } = result.guesses[cursor.row][idx]
                                guess.status = status
                            })
                            setGuesses(newGuesses)
                            setGameStatus(result.status)
                            setAnswer(result.answer)
                            setCursor({ row: cursor.row + 1, col: 0 })
                        })


                }
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [guesses, cursor, gameStatus, gameId, wordLength])

    const gridStatuses = useMemo(() => {
        const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
        const ORDER = {
            [LetterStatus.CORRECT]: 3,
            [LetterStatus.IN_WORD]: 2,
            [LetterStatus.NOT_IN_WORD]: 1,
        }
        const best = {}
        for (const row of guesses.slice(0, cursor.row)) {
            for (const { letter, status } of row) {
                if (letter) {
                    if ((ORDER[status] ?? 0) > (ORDER[best[letter]] ?? 0)) {
                        best[letter] = status
                    }
                }

            }
        }
        return letters.map((_, index) => {
            const char = String.fromCharCode(65 + index)
            return best[char] ?? LetterStatus.UNDEFINED
        })
    }, [cursor.row, guesses])


    return <div>
        {endMessage ? <div>{endMessage}</div> : null}
        {
            guesses.map((guess, guessIndex) =>
                <div key={guessIndex} className="column">
                    <div className={`row ${shake && cursor.row === guessIndex ? 'shake' : ''}`}
                        onAnimationEnd={() => setShake(false)}
                    >
                        {guess.map((letter, letterIndex) =>
                            <div
                                key={letterIndex}
                                className={`letter row ${guessIndex < cursor.row ? letterStyle(letter.status) : ''}`}
                            >
                                {letter.letter}
                            </div>
                        )}
                    </div>
                </div>
            )
        }
        <LetterGrid statuses={gridStatuses}></LetterGrid>
    </div >
}
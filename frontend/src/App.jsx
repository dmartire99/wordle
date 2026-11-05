import { useState, useEffect } from 'react'
import './App.css'
import Game from './Game'
import { API_URL } from './constants'


function App() {
  const [wordLength, setLength] = useState(5)
  const [gameId, setGameId] = useState(() => new URLSearchParams(window.location.search).get("game_id"))
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(() => !!gameId)

  useEffect(() => {
    if (gameId) {
      fetch(`${API_URL}/fetch-game?game_id=${gameId}`)
        .then(r => { if (!r.ok) throw new Error("not found"); return r.json() })
        .then(state => { setGameState(state); setLength(state.wordLength) })
        .catch(() => setGameId(null))
        .finally(() => setLoading(false))
    }
  }, [gameId])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (gameId) {
      url.searchParams.set("game_id", gameId)
    } else {
      url.searchParams.delete("game_id")
    }
    window.history.replaceState(null, "", url)
  }, [gameId])

  const lengthChange = (event) => {
    setLength(Number(event.target.value))
  }

  const startGame = () => {
    fetch(`${API_URL}/start-game`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "word_length": wordLength })
    })
      .then((response) => response.json())
      .then((data) => {
        setGameId(data.game_id)
      })
  }

  const goHome = () => {

    setGameId(null)
    setGameState(null)
  }

  return (
    <>
      <h1>Wordle</h1>
      {
        !gameId ? <div className="card">
          <button onClick={startGame}>START GAME</button>
          <select value={wordLength} onChange={lengthChange}>
            {
              [5, 6, 7, 8].map(val =>
                <option key={val} value={val}>{val}</option>
              )
            }
          </select>
        </div>
          : gameId && !loading && <Game key={gameId} gameId={gameId} wordLength={wordLength} gameState={gameState}></Game>
      }
      {gameId && <button onClick={goHome}>GO HOME</button>}
    </>
  )
}

export default App

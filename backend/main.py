import random
import uuid

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from game import Game

app = FastAPI()

games = {}  # Could use Redis to have a more permanent store for game state in case server ever goes down

word_list = None
with open("./wordlist.txt", "r") as f:
    word_list = [word.strip().upper() for word in f]


class InitGame(BaseModel):
    word_length: int


class Guess(BaseModel):
    game_id: str
    guess: str


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/start-game")
def start_game(initGame: InitGame):
    word_length = initGame.word_length
    if word_length < 5 or word_length > 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="invalid word length"
        )
    game_id = str(uuid.uuid4())
    word = random.choice([word for word in word_list if len(word) == word_length])
    games[game_id] = Game(word, word_list)
    return {"game_id": game_id}


@app.post("/guess")
def make_guess(guess: Guess):
    if guess.game_id not in games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="game not found"
        )
    game = games[guess.game_id]
    res = game.check_word(guess.guess)
    return {"result": res}


@app.get("/fetch-game")
def fetch_game(game_id: str):
    if game_id not in games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="game not found"
        )
    game = games[game_id]
    return game.get_state()


@app.get("/health")
def health_check():
    return {"status": "healthy"}

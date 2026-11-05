from collections import defaultdict
from enum import Enum


class GameStatus(Enum):
    IN_PROGRESS = 0
    WON = 1
    LOST = 2
    INVALID = 3


class Game:
    def __init__(self, word, words):
        self._word = word
        self._words = words
        self._guesses = []
        self._status = GameStatus.IN_PROGRESS

    def check_word(self, guess):
        guess = guess.upper().strip()

        if self._status == GameStatus.IN_PROGRESS:
            if guess not in self._words:
                return {**self.get_state(), "status": GameStatus.INVALID}

            n = len(self._word)
            statuses = [0] * n
            letter_count = defaultdict(int)

            # Check green letters on first pass
            for i in range(n):
                if guess[i] == self._word[i]:
                    statuses[i] = 1
                else:
                    letter_count[self._word[i]] += 1

            # Check others on second pass
            for i in range(n):
                if statuses[i] == 0 and letter_count[guess[i]] > 0:
                    statuses[i] = 2
                    letter_count[guess[i]] -= 1

            self._guesses.append(
                [{"letter": guess[i], "status": statuses[i]} for i in range(n)]
            )

            if all(s == 1 for s in statuses):
                self._status = GameStatus.WON
            elif len(self._guesses) > n:
                self._status = GameStatus.LOST

        return self.get_state()

    def get_state(self):
        answer = (
            self._word
            if self._status == GameStatus.WON or self._status == GameStatus.LOST
            else ""
        )
        return {
            "status": self._status,
            "guesses": self._guesses,
            "answer": answer,
            "wordLength": len(self._word),
        }

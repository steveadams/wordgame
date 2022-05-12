package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type Game struct {
	id      string
	word    string
	guesses []string
	current string
}

type GameState struct {
	Id               string `json:"id"`
	Current          string `json:"current"`
	Word             string `json:"word"`
	GuessesRemaining int    `json:"guesses_remaining"`
}

const guessLimit = 6

var words []string

func init() {
	var err error

	words, err = loadWords("words.txt")

	if err != nil {
		log.Fatal(err)
	}
}

func newHandler(c *gin.Context) {
	game, err := initializeGame()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err})
	}

	c.JSON(http.StatusOK, toGameState(game))
}

func initializeGame() (*Game, error) {
	id, err := generateIdentifier()

	if err != nil {
		return nil, fmt.Errorf("initializeGame: failed to generate an identifier: %w", err)
	}

	word := words[rand.Intn(len(words))]
	guesses := []string{}
	current := strings.Repeat("_", len(word))

	return &Game{id, word, guesses, current}, nil
}

func toGameState(game *Game) GameState {
	return GameState{Current: game.current, GuessesRemaining: guessLimit - len(game.guesses), Id: game.id, Word: game.word}
}

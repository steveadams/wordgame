package main

import (
	"log"
	"math/rand"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type Guesses map[rune]bool

type GameSession struct {
	Id               string `json:"id"`
	GuessesRemaining int    `json:"guesses_remaining"`
	RevealedLetters  []rune `json:"current"`
	// TODO: Do not export this – used for testing
	Word string `json:"word"`
}

const guessLimit = 6

var (
	words        []string
	gameSessions map[string]GameSession
)

// Load all words and prepare a map to store game sessions in
func init() {
	var err error
	words, err = loadWords("words.txt")

	if err != nil {
		log.Fatal(err)
	}

	gameSessions = make(map[string]GameSession)
}

func newHandler(c *gin.Context) {
	game, err := initializeGame()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err})
	}

	c.JSON(http.StatusOK, game)
}

func initializeGame() (*GameSession, error) {
	id, err := generateIdentifier()

	if err != nil {
		return nil, err
	}

	word := words[rand.Intn(len(words))]
	current := []rune(strings.Repeat("_", len(word)))

	game := GameSession{
		Id:               id,
		Word:             word,
		GuessesRemaining: guessLimit,
		RevealedLetters:  current}

	// Store this game's state
	gameSessions[id] = game

	return &game, nil
}

func updateRevealedLetters(word string, current []rune, guess rune) []rune {
	for index, element := range word {
		if element == guess {
			current[index] = element
		}
	}

	return current
}

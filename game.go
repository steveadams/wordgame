package main

import (
	"errors"
	"fmt"
	"io"
	"log"
	"math/rand"
	"strings"
	"sync"
	"time"
	"unicode"
)

type GameCache = map[string]GameState

type GameState struct {
	id               string
	word             []rune
	current          []rune
	guessesRemaining int
	lastTouched      time.Time
}

type GameResponse struct {
	Id               string `json:"id" binding:"required"`
	GuessesRemaining int    `json:"guesses_remaining" binding:"required"`
	Current          string `json:"current" binding:"required"`
}

type GameErrorResponse struct {
	Error string `json:"error"`
}

type GuessRequest struct {
	Id    string `json:"id" binding:"required"`
	Guess string `json:"guess" binding:"required"`
}

const (
	gameCacheTTL = time.Second * 5
	guessLimit   = 6
)

var (
	words         []string
	gameCache     = GameCache{}
	cacheMux      = sync.RWMutex{}
	ErrNotFound   = errors.New("the game couldn't be found")
	ErrBadRequest = errors.New("the request is invalid")
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

func startGameRoutine(wordsReader io.Reader) {
	var err error
	words, err = loadWords(&wordsReader)

	if err != nil {
		log.Fatal(err)
	}

	go cleanCache()
}

// Validate a guess before returning its character as a rune
func parseGuess(guess GuessRequest) (*rune, error) {
	if len(guess.Id) == 0 {
		return nil, fmt.Errorf("id is missing: %w", ErrBadRequest)
	}

	guessString := guess.Guess

	if len(guessString) != 1 {
		return nil, fmt.Errorf("guess can only be 1 (one) character: %w", ErrBadRequest)
	}

	guessedChar := []rune(guessString)[0]

	// Normalize to uppercase to avoid lowercase guesses being wrong
	parsedGuess := unicode.ToUpper(guessedChar)

	return &parsedGuess, nil
}

func initializeGame() (GameState, error) {
	id, err := generateIdentifier()

	if err != nil {
		return GameState{}, err
	}

	word := words[rand.Intn(len(words))]

	game := GameState{
		id:               id,
		word:             []rune(word),
		current:          []rune(strings.Repeat("_", len(word))),
		guessesRemaining: guessLimit,
		lastTouched:      time.Now(),
	}

	// Store this game's state
	saveGame(game)

	return game, nil
}

func loadGame(id string) (GameState, error) {
	cacheMux.Lock()

	if game, ok := gameCache[id]; ok {
		cacheMux.Unlock()
		return game, nil
	} else {
		cacheMux.Unlock()
		return GameState{}, fmt.Errorf("no game with the id '%s': %w", id, ErrNotFound)
	}
}

func takeTurn(guess GuessRequest) (GameState, error) {
	guessRune, err := parseGuess(guess)

	if err != nil {
		return GameState{}, err
	}

	game, err := loadGame(guess.Id)

	if err != nil {
		return game, err
	}

	correct := false

	for i, letter := range game.word {
		if letter == *guessRune {
			game.current[i] = letter
			correct = true
		}
	}

	if !correct {
		game.guessesRemaining -= 1
	}

	return game, nil
}

// Check for and remove stale games every 15m
func cleanCache() {
	for {
		time.Sleep(time.Minute * 15)

		for _, game := range gameCache {
			now := time.Now()
			expiry := now.Add(-gameCacheTTL)

			if game.lastTouched.Before(expiry) {
				endGame(game)
			}
		}
	}
}

/*
Save the game, or end it if:
	- guesses are exhausted
	- the word is guessed correctly
*/
func saveOrEndGame(game GameState) {
	if game.guessesRemaining == 0 || string(game.word) == string(game.current) {
		endGame(game)
	} else {
		saveGame(game)
	}
}

func saveGame(game GameState) {
	cacheMux.Lock()
	defer cacheMux.Unlock()

	game.lastTouched = time.Now()
	gameCache[game.id] = game
}

func endGame(game GameState) {
	cacheMux.Lock()
	defer cacheMux.Unlock()

	delete(gameCache, game.id)
}

func makeGameResponse(game GameState) GameResponse {
	return GameResponse{
		Id:               game.id,
		Current:          string(game.current),
		GuessesRemaining: game.guessesRemaining,
	}
}

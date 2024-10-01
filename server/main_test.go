package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

var router *gin.Engine

func init() {
	gin.SetMode(gin.ReleaseMode)
	router = setupRouter()

	startGameRoutine(strings.NewReader("TEST\n"))
}

func TestNewRoute(t *testing.T) {
	t.Parallel()

	var game GameResponse
	body, status := getNewResponse(router)
	json.Unmarshal(body, &game)

	assert.Equal(t, http.StatusOK, status)
}

type InvalidGuessCase struct {
	name       string
	guess      GuessRequest
	wantStatus int
}

func TestInvalidGuesses(t *testing.T) {
	guesses := []InvalidGuessCase{
		{name: "Bad Request: Missing Id", guess: GuessRequest{Guess: "Z"}, wantStatus: 400},
		{name: "Not Found: Unknown Id", guess: GuessRequest{Id: "123", Guess: "Z"}, wantStatus: 404},
	}

	for _, guess := range guesses {
		guess := guess
		t.Run(guess.name, func(t *testing.T) {
			t.Parallel()

			body, status := getGuessResponse(guess.guess, router)
			var gameError GameErrorResponse
			json.Unmarshal(body, &gameError)
			assert.Equal(t, guess.wantStatus, status)
		})
	}
}

type GuessFlowCase struct {
	guess GuessRequest
	want  string
}

func TestGuessFlow(t *testing.T) {
	body, _ := getNewResponse(router)

	var game GameResponse
	json.Unmarshal(body, &game)

	guesses := []GuessFlowCase{
		{guess: GuessRequest{Id: game.Id, Guess: "E"}, want: "_E__"},
		{guess: GuessRequest{Id: game.Id, Guess: "T"}, want: "TE_T"},
		{guess: GuessRequest{Id: game.Id, Guess: "M"}, want: "TE_T"},
		{guess: GuessRequest{Id: game.Id, Guess: "S"}, want: "TEST"},
	}

	for _, guess := range guesses {
		t.Run(fmt.Sprintf("guess '%s' yields '%s'", guess.guess.Guess, guess.want), func(t *testing.T) {
			var gameResponse GameResponse

			body, _ = getGuessResponse(guess.guess, router)
			json.Unmarshal(body, &gameResponse)
			assert.Equal(t, guess.want, gameResponse.Current)
		})
	}
}

func TestExhaustedGuesses(t *testing.T) {
	body, _ := getNewResponse(router)

	var game GameResponse
	json.Unmarshal(body, &game)

	guess := GuessRequest{Id: game.Id, Guess: "z"}

	var (
		gameError GameErrorResponse
		response  GameResponse
	)

	for i := 1; i <= guessLimit+1; i++ {
		if i <= guessLimit {
			body, _ = getGuessResponse(guess, router)
			json.Unmarshal(body, &response)
			assert.Equal(t, guessLimit-i, response.GuessesRemaining)
		} else {
			body, status := getGuessResponse(guess, router)
			json.Unmarshal(body, &gameError)
			assert.Equal(t, http.StatusNotFound, status)
		}
	}
}

func getNewResponse(router *gin.Engine) ([]byte, int) {
	recorder := httptest.NewRecorder()
	request, _ := http.NewRequest("POST", "/new", nil)
	router.ServeHTTP(recorder, request)

	return recorder.Body.Bytes(), recorder.Code
}

func getGuessResponse(guess GuessRequest, router *gin.Engine) ([]byte, int) {
	recorder := httptest.NewRecorder()
	guessBytes, _ := json.Marshal(guess)
	request, _ := http.NewRequest("POST", "/guess", bytes.NewBuffer(guessBytes))
	router.ServeHTTP(recorder, request)

	return recorder.Body.Bytes(), recorder.Code
}

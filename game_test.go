package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewRoute(t *testing.T) {
	router := setupRouter()

	recorder := httptest.NewRecorder()
	request, _ := http.NewRequest("POST", "/new", nil)

	router.ServeHTTP(recorder, request)

	var game GameSession
	json.Unmarshal(recorder.Body.Bytes(), &game)

	assert.Equal(t, 200, recorder.Code)
	assert.Equal(t, guessLimit, game.GuessesRemaining)
}

func TestUpdateCurrent(t *testing.T) {
	word := "COFFEE"

	assert.Equal(t, []rune("C_FF__"), updateRevealedLetters(word, []rune{'_', '_', 'F', 'F', '_', '_'}, 'C'))
	assert.Equal(t, []rune("COFFEE"), updateRevealedLetters(word, []rune{'_', 'O', 'F', 'F', 'E', 'E'}, 'C'))

	assert.Equal(t, []rune("______"), updateRevealedLetters(word, []rune{'_', '_', '_', '_', '_', '_'}, 'Z'))
}

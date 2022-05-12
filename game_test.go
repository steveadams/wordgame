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

	var game GameState
	json.Unmarshal(recorder.Body.Bytes(), &game)

	assert.Equal(t, 200, recorder.Code)
	assert.Equal(t, game.GuessesRemaining, guessLimit)
}

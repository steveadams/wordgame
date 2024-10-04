package main

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func setupRouter() *gin.Engine {
	router := gin.New()

	router.Use(cors.New(cors.Config{
		// AllowOrigins:    []string{"*"},
		AllowMethods:    []string{"PUT"},
		AllowHeaders:    []string{"Origin", "Content-Type"},
		ExposeHeaders:   []string{"Content-Length"},
		AllowAllOrigins: true,
		// AllowOriginFunc: func(origin string) bool {
		// 	return origin == "https://github.com"
		// },
	}))

	router.POST("/new", newHandler)
	router.POST("/guess", guessHandler)

	return router
}

func newHandler(c *gin.Context) {
	game, err := initializeGame()
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			GameErrorResponse{Error: err.Error()},
		)

		return
	}

	c.JSON(http.StatusOK, GameResponse{
		Id:               game.id,
		Current:          string(game.current),
		GuessesRemaining: game.guessesRemaining,
	})
}

func guessHandler(c *gin.Context) {
	var guess GuessRequest
	if err := c.ShouldBindJSON(&guess); err != nil {
		c.JSON(
			http.StatusBadRequest,
			GameErrorResponse{Error: fmt.Sprintf("the request couldn't be decoded: %s", err.Error())},
		)

		return
	}

	game, err := takeTurn(guess)
	if err != nil {
		c.JSON(
			getTurnErrorCode(err),
			GameErrorResponse{Error: err.Error()},
		)

		return
	}

	saveOrEndGame(game)

	c.JSON(http.StatusOK, makeGameResponse(game))
}

func getTurnErrorCode(err error) int {
	code := http.StatusInternalServerError

	if errors.Is(err, ErrNotFound) {
		code = http.StatusNotFound
	} else if errors.Is(err, ErrBadRequest) {
		code = http.StatusBadRequest
	}

	return code
}

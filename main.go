package main

import (
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	serverAddress = "localhost:1337"
)

func main() {
	router := gin.Default()
	rand.Seed(time.Now().UnixNano())

	words, err := loadWords("words.txt")
	if err != nil {
		log.Fatal(err)
	}

	// TODO use words in your implementation
	_ = words

	router.POST("/new", stub)
	router.POST("/guess", stub)

	router.Run(serverAddress)
}

func stub(c *gin.Context) {
	c.String(http.StatusNotImplemented, http.StatusText(http.StatusNotImplemented))
}

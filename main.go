package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const (
	serverAddress = "localhost:1337"
)

func setupRouter() *gin.Engine {
	router := gin.Default()

	router.POST("/new", newHandler)
	router.POST("/guess", stub)

	return router
}

func main() {
	router := setupRouter()

	router.Run(serverAddress)
}

func stub(c *gin.Context) {
	c.String(http.StatusNotImplemented, http.StatusText(http.StatusNotImplemented))
}

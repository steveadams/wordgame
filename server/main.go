package main

import (
	"log"
	"os"
)

const (
	wordsPath     = "words.txt"
	serverAddress = "0.0.0.0:1337"
)

func main() {
	reader, err := os.Open(wordsPath)
	if err != nil {
		log.Fatalf("failed to open words file: %s", err.Error())
	}
	defer reader.Close()

	startGameRoutine(reader)
	setupRouter().Run(serverAddress)
}

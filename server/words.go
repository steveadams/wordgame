package main

import (
	"bufio"
	"io"
	"regexp"
	"strings"

	"github.com/pkg/errors"
)

// Thanks to https://github.com/dwyl/english-words for the word list.

var wordsRegexp = regexp.MustCompile("^[A-Z]+$")

// loadWords loads the word dictionary from the provided file path.
func loadWords(f *io.Reader) ([]string, error) {
	words := []string{}
	scanner := bufio.NewScanner(*f)

	for scanner.Scan() {
		// Normalize and filter words.
		word := strings.ToUpper(strings.TrimSpace(scanner.Text()))
		if wordsRegexp.MatchString(word) {
			words = append(words, word)
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, errors.Wrap(err, "scan words")
	}

	return words, nil
}

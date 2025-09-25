package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type Item struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

var items = []Item{
	{ID: 1, Name: "Apple"},
	{ID: 2, Name: "Banana"},
}

func getItems(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func main() {
	http.HandleFunc("/api/items", getItems)
	log.Println("Server running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}

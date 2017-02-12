package main

import (
    "os"
    "fmt"
)

func main() {
  for _,element := range os.Args {
    fmt.Println(element);
  }
  os.Exit(1);
}
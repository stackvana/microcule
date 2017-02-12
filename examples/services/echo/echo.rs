use std::env;

// This is the main function
fn main() {
    // The statements here will be executed when the compiled binary is called
    // Prints each argument on a separate line
    for argument in env::args() {
        println!("{}", argument);
    }
}
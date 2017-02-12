#include<stdio.h>

int  // Specifies that type of variable the function returns.
     // main() must return an integer
main ( int argc, char **argv ) {
  // code
  printf("Hello argv!\n");
  printf( "argc len = %d\n", argc );
  for ( int i = 0; i < argc; ++i ) {
    printf( "argv[ %d ] = %s\n", i, argv[ i ] );
  }

  return 0; // Indicates that everything went well.
}
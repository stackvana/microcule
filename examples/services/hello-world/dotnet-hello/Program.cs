using System;

namespace dotnet_hello
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello World from .NET Core!!!");

            foreach (var arg in args)
            {
                Console.WriteLine("param: {0}", arg);
            }

        }
    }
}

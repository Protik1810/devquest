# Curriculum sources

Reference books the user provided (2026-10-14), used as **topic checklists**: each language's course is
compared chapter by chapter with its book to find missing topics. Lessons are written from scratch;
nothing is copied from the books. Chapter titles below are for planning only.

## Status of the comparison

| Language | Book | Compared | Result |
|---|---|---|---|
| Python | Learning Python (4th ed.) | yes | Course covered all chapters. Added: bitwise operators in practice, fractions and complex numbers, reference counting and garbage collection, frozenset, in-place operators and `__radd__`, callable objects and bound methods, `__del__`, relative imports, exploring and reloading modules. |
| JavaScript | Eloquent JavaScript (4th ed.) | yes | All chapters covered (74 lessons). Added from the comparison: forms and client-side storage, drawing with canvas and SVG, Symbols, Unicode code points and graphemes, layout and requestAnimationFrame, event propagation, and a "build a tiny programming language" capstone (the book's Egg project idea, with an original design). |
| TypeScript | Programming TypeScript (Cherny, 2019) | yes | All chapters covered (36 lessons), updated to TypeScript 5/6 features the book predates (`satisfies`, `const` type parameters, `NoInfer`, template literal types, standard decorators, `verbatimModuleSyntax`, Node's type stripping). Added from the comparison: typing generators, iterables and `call`/`bind`/`apply`; definite assignment assertions and the companion object pattern; typed worker message protocols; module versus script mode, namespaces, CommonJS interop and triple-slash directives; project layout, source maps, project references and publishing typed packages to npm. |
| SQL, Java, C, C++, C#, Go, Kotlin, Rust, Swift, Dart, PHP, Ruby, R, Bash, PowerShell, Lua, Solidity | see below | when that course is built | One language at a time, in the agreed order. |

Books without PDF bookmarks (The Rust Programming Language, The Swift Programming Language, the Kotlin reference, C: The Complete Reference) will have their contents pages read when their courses are built. *Programming C#* (2nd ed.) could not be opened on this computer: it may be a OneDrive online-only file ("Always keep on this device" fixes that).

## Python: Learning_Python

Chapter 1. A Python Q&A Session, Chapter 2. How Python Runs Programs, Chapter 3. How You Run Programs, Chapter 4. Introducing Python Object Types, Chapter 5. Numeric Types, Chapter 6. The Dynamic Typing Interlude, Chapter 7. Strings, Chapter 8. Lists and Dictionaries, Chapter 9. Tuples, Files, and Everything Else, Chapter 10. Introducing Python Statements, Chapter 11. Assignments, Expressions, and Prints, Chapter 12. if Tests and Syntax Rules, Chapter 13. while and for Loops, Chapter 14. Iterations and Comprehensions, Part 1, Chapter 15. The Documentation Interlude, Chapter 16. Function Basics, Chapter 17. Scopes, Chapter 18. Arguments, Chapter 19. Advanced Function Topics, Chapter 20. Iterations and Comprehensions, Part 2, Chapter 21. Modules: The Big Picture, Chapter 22. Module Coding Basics, Chapter 23. Module Packages, Chapter 24. Advanced Module Topics, Chapter 25. OOP: The Big Picture, Chapter 26. Class Coding Basics, Chapter 27. A More Realistic Example, Chapter 28. Class Coding Details, Chapter 29. Operator Overloading, Chapter 30. Designing with Classes, Chapter 31. Advanced Class Topics, Chapter 32. Exception Basics, Chapter 33. Exception Coding Details, Chapter 34. Exception Objects, Chapter 35. Designing with Exceptions, Chapter 36. Unicode and Byte Strings, Chapter 37. Managed Attributes, Chapter 38. Decorators, Chapter 39. Metaclasses

## JavaScript: Eloquent_JavaScript_small

Introduction, Values, Types, and Operators, Program Structure, Functions, Data Structures: Objects and Arrays, Higher-Order Functions, The Secret Life of Objects, Project: A Robot, Bugs and Errors, Regular Expressions, Modules, Asynchronous Programming, Project: A Programming Language, JavaScript and the Browser, The Document Object Model, Handling Events, Project: A Platform Game, Drawing on Canvas, HTTP and Forms, Project: A Pixel Art Editor, Node.js, Project: Skill-Sharing Website, Exercise Hints

## TypeScript: Programming TypeScript - Boris Cherny - O’Reilly (2019)

1. Introduction, 2. TypeScript: A 10_000 Foot View, 3. All About Types, 4. Functions, 5. Classes and Interfaces, 6. Advanced Types, 7. Handling Errors, 8. Asynchronous Programming, Concurrency, and Parallelism, 9. Frontend and Backend Frameworks, 10. Namespaces.Modules, 11. Interoperating with JavaScript, 12. Building and Running TypeScript, 13. Conclusion

## SQL: sql-the-complete-reference-third-edition-sep-2009

1 Introduction, 2 A Quick Tour of SQL, 3 SQL in Perspective, 4 Relational Databases, 5 SQL Basics, 6 Simple Queries, 7 Multitable Queries (Joins), 8 Summary Queries, 9 Subqueries and Query Expressions, 10 Database Updates, 11 Data Integrity, 12 Transaction Processing, 13 Creating a Database, 14 View, 15 SQL Security, 16 The System Catalog, 17 Embedded SQL, 18 Dynamic SQL*, 19 SQL APIs, 20 Database Processing and Stored Procedural SQL, 21 SQL and Data Warehousing, 22 SQL and Application Servers, 23 SQL Networking and Distributed Databases, 24 SQL and Objects, 25 SQL and XML, 26 Specialty Databases, 27 The Future of SQL

## Java: Java-The-Complete-Reference-7th-Edition-DwzRG-3

1 The History and Evolution of Java, 2 An Overview of Java, 3 Data Types, Variables, and Arrays, 4 Operators, 5 Control Statements, 6 Introducing Classes, 7 A Closer Look at Methods and Classes, 8 Inheritance, 9 Packages and Interfaces, 10 Exception Handling, 11 Multithreaded Programming, 12 Enumerations, Autoboxing, and Annotations (Metadata), 13 I/O, Applets, and Other Topics, 14 Generics, 15 String Handling, 16 Exploring java.lang, 17 java.util Part 1: The Collections Framework, 18 java.util Part 2: More Utility Classes, 19 Input/Output: Exploring java.io, 20 Networking, 21 The Applet Class, 22 Event Handling, 23 Introducing the AWT: Working with Windows, Graphics, and Text, 24 Using AWT Controls, Layout Managers, and Menus, 25 Images, 26 The Concurrency Utilities, 27 NIO, Regular Expressions, and Other Packages, 28 Java Beans, 29 Introducing Swing, 30 Exploring Swing, 31 Servlets, 32 Financial Applets and Servlets, 33 Creating a Download Manager in Java

## C++: C++ The Complete Reference, 4th Edition.pdf ( PDFDrive.com )

1 An Overview of C, 2 Expressions, 3 Statements, 4 Arrays and Null-Terminated Strings, 5 Pointers, 6 Functions, 7 Structures, Unions, Enumerations, and User-Defined Types, 8 C-Style Console I/O, 9 File I/O, 10 The Preprocessor and Comments, 11 An Overview of C++, 12 Classes and Objects, 13 Arrays, Pointers, References, and the Dynamic Allocation Operators, 14 Function Overloading, Copy Constructors, and Default Arguments, 15 Operator Overloading, 16 Inheritance, 17 Virtual Functions and Polymorphism, 18 Templates, 19 Exception Handling, 20 The C++ I/O System Basics, 21 C++ File I/O, 22 Run-Time Type ID and the Casting Operators, 23 Namespaces, Conversion Functions, and Other Advanced Topics, 24 Introducing the Standard Template Library, 25 The C-Based I/O Functions, 26 The String and Character Functions, 27 The Mathematical Functions, 28 Time, Date, and Localization Functions, 29 The Dynamic Allocation Functions, 30 Utility Functions, 31 The Wide-Character Functions, 32 The Standard C++ I/O Classes, 33 The STL Container Classes, 34 The STL Algorithms, 35 STL Iterators, Allocators, and Function Objects, 36 The String Class, 37 The Numeric Classes, 38 Exception Handling and Miscellaneous Classes, 39 Integrating New Classes: A Custom String Class, 40 Parsing Expressions

## Ruby: Ruby language

Getting Started, Ruby.new, Classes, Objects, and Variables, Containers, Blocks, and Iterators, Standard Types, More about Methods, Expressions, Exceptions, Catch, and Throw, Modules, Basic Input and Output, Threads and Processes, Unit Testing, When Trouble Strikes, Ruby and Its World, Interactive Ruby Shell, Documenting Ruby, Package Management with RubyGems, Ruby and the Web, Ruby Tk, Ruby and Microsoft Windows, Extending Ruby, The Ruby Language, Predefined Variables, Boolean Expressions, if and unless Expressions, case Expressions, Loop Constructs, Duck Typing, Classes and Objects, Locking Ruby in the Safe, Reflection, ObjectSpace, and Distributed Ruby, Built-in Classes and Modules, Array, Bignum, Binding, Class, Comparable, Continuation, Dir, Enumerable, Errno, Exception, FalseClass, File, File::Stat, FileTest, Fixnum, Float, GC, Hash, Integer, IO, Kernel, Marshal, MatchData, Math, Method, Module, NilClass, Numeric, Object, ObjectSpace, Proc, Process, Process::GID, Process::Status, Process::Sys, Process::UID, Range, Regexp, Signal, String, Struct, Struct::Tms, Symbol, Thread, ThreadGroup, Time, TrueClass, UnboundMethod

## PHP: Programming-PHP-PDFDrive-

1. Introduction to PHP, 2. Language Basics, 3. Functions, 4. Strings, 5. Arrays, 6. Objects, 7. Web Techniques, 8. Databases, 9. Graphics, 10. PDF, 11. XML, 12. Security, 13. Application Techniques, 14. PHP on Disparate Platforms, 15. Web Services, 16. Debugging PHP, 17. Dates and Times

## R: The_Book_of_R

Chapter 1: Getting Started, Chapter 2: Numerics, Arithmetic, Assignment, and Vectors, Chapter 3: Matrices and Arrays, Chapter 4: Non-Numeric Values, Chapter 5: Lists and Data Frames, Chapter 6: Special Values, Classes, and Coercion, Chapter 7: Basic Plotting, Chapter 8: Reading and Writing Files, Chapter 9: Calling Functions, Chapter 10: Conditions and Loops, Chapter 11: Writing Functions, Chapter 12: Exceptions, Timings, and Visibility, Chapter 13: Elementary Statistics, Chapter 14: Basic Data Visualization, Chapter 15: Probability, Chapter 16: Common Probability Distributions, Chapter 17: Sampling Distributions and Confidence, Chapter 18: Hypothesis Testing, Chapter 19: Analysis of Variance, Chapter 20: Simple Linear Regression, Chapter 21: Multiple Linear Regression, Chapter 22: Linear Model Selection and Diagnostics, Chapter 23: Advanced Plot Customization, Chapter 24: Going Further with the Grammar of Graphics, Chapter 25: Defining Colors and Plotting in Higher Dimensions, Chapter 26: Interactive 3D Plots

## Bash: Learning the bash Shell, 3rd Edition

1. bash Basics, 2. Command-Line Editing, 3. Customizing Your Environment, 4. Basic Shell Programming, 5. Flow Control, 6. Command-Line Options and Typed Variables, 7. Input/Output and Command-Line Processing, 8. Process Handling, 9. Debugging Shell Programs, 10. bash Administration, 11. Shell Scripting, 12. bash for Your System

## PowerShell: Windows PowerShell in Action, Third Edition

Chapter 1. Welcome to PowerShell, Chapter 2. Working with types, Chapter 3. Operators and expressions, Chapter 4. Advanced operators and variables, Chapter 5. Flow control in scripts, Chapter 6. PowerShell functions, Chapter 7. Advanced functions and scripts, Chapter 8. Using and authoring modules, Chapter 9. Module manifests and metadata, Chapter 10. Metaprogramming with scriptblocks and dynamic code, Chapter 11. PowerShell remoting, Chapter 12. PowerShell workflows, Chapter 13. PowerShell Jobs, Chapter 14. Errors and exceptions, Chapter 15. Debugging, Chapter 16. Working with providers, files, and CIM, Chapter 17. Working with .NET and events, Chapter 18. Desired State Configuration, Chapter 19. Classes in PowerShell, Chapter 20. The PowerShell and runspace APIs

## Solidity: docs-soliditylang-org-en-latest

Introduction to Smart Contracts, Solidity by Example, Installing the Solidity Compiler, Layout of a Solidity Source File, Structure of a Contract, Types, Units and Globally Available Variables, Expressions and Control Structures, Contracts, Inline Assembly, Cheatsheet, Language Grammar, Using the Compiler, Analysing the Compiler Output, Solidity IR-based Codegen Changes, Layout of State Variables in Storage and Transient Storage, Layout in Memory, Layout of Call Data, Cleaning Up Variables, Source Mappings, The Optimizer, Contract Metadata, Contract ABI Specification, Security Considerations, List of Known Bugs, Frequently Reported Non-Bugs, Solidity v0.5.0 Breaking Changes, Solidity v0.6.0 Breaking Changes, Solidity v0.7.0 Breaking Changes, Solidity v0.8.0 Breaking Changes, NatSpec Format, SMTChecker and Formal Verification, Yul, Import Path Resolution, Style Guide, Common Patterns, Resources, Contributing, Language Influences, Solidity Brand Guide

## Dart: Dart Language

1.1 Motivation, 1.2 Design Principles, 1.3 Constraints, 1.4 Overview, 1.5 Book Structure, 1.6 Related Work and Influences, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, R, S, T, U, V, W, Y, Z

## Web (HTML5): HTML5 Cookbook (1449396798)

Chapter 1. Fundamental Syntax & Semantics, Chapter 2. Progressive Markup & Techniques, Chapter 3. Forms, Chapter 4. Native Audio, Chapter 5. Native Video, Chapter 6. Microdata and Custom Data, Chapter 7. Accessibility, Chapter 8. GeoLocation, Chapter 9. Canvas, Chapter 10. Advanced HTML5 JavaScript

## Go: The.Go.Programming.Language

Tutorial, Program Structure, Basic Data Types, Composite Types, Functions, Methods, Interfaces, Goroutines and Channels, Concurrency with Shared Variables, Packages and the Go Tool, Testing, Reflection, Low-Level Programming

## Lua: Programming_in_Lua_4th_Edition

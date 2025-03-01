# wpress-extract2

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/wpress-extract2.svg)](https://www.npmjs.com/package/wpress-extract2)

A simple command-line interface (CLI) tool for extracting `.wpress` archive files generated by the [All-in-One WP Migration](https://servmask.com/products/all-in-one-wp-migration) WordPress plugin.

**This is an improved version of the original `wpress-extract` project, which can be found at [https://github.com/ofhouse/wpress-extract](https://github.com/ofhouse/wpress-extract).**

## Improvements Over Original `wpress-extract`

Here's a summary of the key improvements made in `wpress-extract2` and their impact:

| Improvement                          | Description                                                                                                                                                                                                | Impact                                                                                                                               |
| :----------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **Enhanced Error Handling**           | Added more robust error handling throughout the extraction process, including specific error handling for file writing operations and stream errors.                                                 | Improved stability and reliability. Users get more informative error messages, making it easier to diagnose and resolve issues. |
| **Optimized Buffer Management**        | Replaced per-call buffer allocation in `readHeader` with a single reusable buffer.                                                                                                                         | Reduced memory allocation overhead, leading to slightly better performance, especially when extracting archives with many files.   |
| **Stream-Based File Writing**         | Refactored `readBlockToFile` to use streams for writing output files instead of reading entire files into memory.                                                                                         | Significantly reduced memory usage when extracting large files, preventing potential out-of-memory errors.                          |
| **Optimized Directory Creation**       | Implemented caching for created directories in `readBlockToFile` to avoid redundant `ensureDir` calls.                                                                                                      | Minor performance improvement, especially for archives with many files in the same directory structure.                             |
| **Simplified `readFromBuffer`**       | Optimized `readFromBuffer` function to reduce unnecessary buffer slicing operations.                                                                                                                    | Minor performance improvement when reading data from the archive.                                                                |
| **Improved CLI and Progress Bar**   | Enhanced the CLI with better output formatting, more informative error messages, cursor hiding during progress, and improved behavior of the progress bar.                                                     | Improved user experience with a more polished and responsive command-line interface.                                                 |
| **Updated Dependencies**              | Updated project dependencies (`cli-progress`, `fs-extra`, `yargs`) to their latest versions.                                                                                                                | Benefits from bug fixes, performance improvements, and potential security patches in the updated dependencies.                       |
| **Code Style and Maintainability** | Improved code readability and maintainability through consistent naming, better comments, use of constants, and function decomposition. Code formatting with `prettier` and linting with `eslint` | Makes it easier for developers to understand, contribute to, and maintain the codebase.                                          |

## Features

-   Extracts files and directories from `.wpress` archives.
-   Provides progress updates during extraction.
-   Handles large files efficiently using streams.
-   Option to override an existing output directory.
-   User friendly CLI interface

## Installation

**Now available on npm\!** Install it globally using:

```bash
npm install -g wpress-extract2
````

Or, install it locally in your project:

```bash
npm install wpress-extract2 --save-dev
```

## Usage

```bash
wpress-extract2 <input.wpress> [options]
```

**Arguments:**

  - `<input.wpress>`: **(Required)** Path to the `.wpress` archive file you want to extract.

**Options:**

  - `-o, --out <directory>`: Specify the output directory where the contents of the archive will be extracted. If not specified, a directory with the same name as the input file (without the `.wpress` extension) will be created in the same directory as the input file.
  - `-f, --force`: Override the output directory if it already exists. **Use with caution\!**
  - `-h, --help`: Display help information.

**Examples:**

  - Extract `backup.wpress` to a new directory named `backup`:

<!-- end list -->

```bash
wpress-extract2 backup.wpress
```

  - Extract `my-site.wpress` to a specific directory `/path/to/output`:

<!-- end list -->

```bash
wpress-extract2 my-site.wpress -o /path/to/output
```

  - Extract `data.wpress` to an existing directory `my-data` and override its contents:

<!-- end list -->

```bash
wpress-extract2 data.wpress -o my-data -f
```

## Progress Display

The tool displays a progress bar during the extraction process:

```
Extracting content to: relative/path/to/output/
Progress: [==============================] 100%
```

## Error Handling

If any errors occur during the extraction process, the tool will display an error message and stop the progress bar. For example:

```
Progress: [====================>-------------] 58%
Error: Output dir is not empty. Clear it first or use the --force option to override it.
```

## Contributing

Contributions are welcome\! Please feel free to submit issues or pull requests to the repository: [https://github.com/ProgrammerNomad/wpress-extract2](https://www.google.com/url?sa=E&source=gmail&q=https://github.com/ProgrammerNomad/wpress-extract2)

## Contributors

  - [https://github.com/ofhouse](https://github.com/ofhouse) (Original Author)
  - [https://github.com/ProgrammerNomad](https://github.com/ProgrammerNomad) (Maintainer of this improved version)

## License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/url?sa=E&source=gmail&q=https://github.com/ProgrammerNomad/wpress-extract2/blob/main/LICENSE) file for details.

## Notes

  - This tool is not affiliated with or endorsed by ServMask (the creators of All-in-One WP Migration).
  - It is recommended to back up any existing data before using the `-f` (force) option.

## Development

### Getting Started

1.  Clone the repository:

<!-- end list -->

```bash
git clone [https://github.com/ProgrammerNomad/wpress-extract2](https://github.com/ProgrammerNomad/wpress-extract2)
```

2.  Install dependencies:

<!-- end list -->

```bash
npm install
```

### Scripts

  - `npm start`: Run the CLI tool with the provided arguments.
  - `npm run lint`: Run ESLint to check for code style issues.
  - `npm run format`: Run Prettier to automatically format the code.
  - `npm test`: Run tests (currently, there are no tests specified).

### Building from Source

If you want to build the executable from the source:

1.  Make sure you have Node.js and npm installed.
2.  Clone this repository.
3.  Install dependencies: `npm install`
4.  Run the CLI directly using Node.js: `node cli.js <input.wpress> [options]`
const fse = require('fs-extra');
const fs = require('fs');
const path = require('path');

// Constants for header structure
const HEADER_SIZE = 4377;
const NAME_END = 255;
const SIZE_END = 269;
const MTIME_END = 281;
const CHUNK_SIZE = 512;

// Empty header for EOF check
const HEADER_CHUNK_EOF = Buffer.alloc(HEADER_SIZE);

// Reusable buffer for header reads
const headerChunk = Buffer.alloc(HEADER_SIZE);

// Cache for created directories
const createdDirs = new Set();

function isDirEmpty(dirname) {
  return fs.promises.readdir(dirname).then((files) => files.length === 0);
}

function readFromBuffer(buffer, start, end) {
  const nullIndex = buffer.indexOf(0x00, start);
  const endSlice = nullIndex === -1 || nullIndex > end ? end : nullIndex;
  return buffer.toString('utf8', start, endSlice);
}

async function readHeader(fd) {
  const { bytesRead } = await fd.read(headerChunk, 0, HEADER_SIZE, null);

  // Check if we actually read the full header size before comparing
  if (bytesRead !== HEADER_SIZE) {
    return null; // Reached end of file or an unexpected error
  }

  if (Buffer.compare(headerChunk, HEADER_CHUNK_EOF) === 0) {
    return null; // Reached end of file
  }

  const name = readFromBuffer(headerChunk, 0, NAME_END);
  const size = parseInt(readFromBuffer(headerChunk, NAME_END, SIZE_END), 10);
  const mTime = readFromBuffer(headerChunk, SIZE_END, MTIME_END);
  const prefix = readFromBuffer(headerChunk, MTIME_END, HEADER_SIZE);

  return { name, size, mTime, prefix };
}

async function readBlockToFile(fd, header, outputDir) {
  const outputFilePath = path.join(outputDir, header.prefix, header.name);
  const outputDirPath = path.dirname(outputFilePath);

  // Optimize directory creation
  if (!createdDirs.has(outputDirPath)) {
    await fse.ensureDir(outputDirPath);
    createdDirs.add(outputDirPath);
  }

  let fileOffset = fd.bytesRead;
  const inputFile = fd;
  const outputStream = fs.createWriteStream(outputFilePath);
  
  try {
    let remainingBytes = header.size;

    while (remainingBytes > 0) {
      const bytesToRead = Math.min(remainingBytes, CHUNK_SIZE);
      const { bytesRead, buffer } = await inputFile.read(
        Buffer.alloc(bytesToRead),
        0,
        bytesToRead,
        fileOffset
      );

      if (bytesRead === 0) {
        // EOF
        break;
      }

      outputStream.write(buffer.subarray(0, bytesRead));
      fileOffset += bytesRead;
      remainingBytes -= bytesRead;
    }
  } catch (error) {
    console.error(`Error while writing to file ${outputFilePath}:`, error);
    throw error;
  } finally {
    outputStream.end();
  }
}

async function ensureOutputDir(outputDir, override) {
  if (override) {
    await fse.emptyDir(outputDir);
  } else {
    if (fs.existsSync(outputDir) && !(await isDirEmpty(outputDir))) {
      throw new Error(
        `Output dir is not empty. Clear it first or use the --force option to override it.`
      );
    }
  }
}

async function wpExtract({
  inputFile: inputFilePath,
  outputDir,
  onStart,
  onUpdate,
  onFinish,
  override,
}) {
  if (!fs.existsSync(inputFilePath)) {
    throw new Error(`Input file at location "${inputFilePath}" could not be found.`);
  }

  await ensureOutputDir(outputDir, override);

  const inputFileStat = fs.statSync(inputFilePath);
  const inputFile = await fs.promises.open(inputFilePath, 'r');

  onStart(inputFileStat.size);

  let offset = 0;
  let countFiles = 0;
  try {
    while (true) {
      const header = await readHeader(inputFile);
      if (!header) {
        break;
      }

      await readBlockToFile(inputFile, header, outputDir);
      offset += HEADER_SIZE + header.size; // Update offset
      countFiles++;

      inputFile.bytesRead = offset; // Update file handle's read position

      onUpdate(offset);
    }
  } catch (error) {
    console.error('Error during extraction:', error);
    throw error;
  } finally {
    // Close the file in the finally block to ensure it's closed even if errors occur
    await inputFile.close();
    // Clear the set of created directories when extraction is finished or an error occurs
    createdDirs.clear();
  }

  onFinish(countFiles);
}

module.exports = wpExtract;
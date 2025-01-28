const fse = require('fs-extra');
const fs = require('fs');
const path = require('path');

const HEADER_SIZE = 4377; // length of the header
const HEADER_CHUNK_EOF = Buffer.alloc(HEADER_SIZE); // Empty header used for check if we reached the end

// Cache for created directories
const createdDirs = new Set();

function isDirEmpty(dirname) {
    return fs.promises.readdir(dirname).then((files) => {
        return files.length === 0;
    });
}

function readFromBuffer(buffer, start, end) {
    const _buffer = buffer.slice(start, end);
    // Trim off the empty bytes
    return _buffer.slice(0, _buffer.indexOf(0x00)).toString();
}

async function readHeader(fd) {
    const headerChunk = Buffer.alloc(HEADER_SIZE);
    const { bytesRead } = await fd.read(headerChunk, 0, HEADER_SIZE, null);
  
    // Check if we actually read the full header size before comparing
    if (bytesRead !== HEADER_SIZE) {
      return null; // Reached end of file or an unexpected error
    }
  
    if (Buffer.compare(headerChunk, HEADER_CHUNK_EOF) === 0) {
      return null; // Reached end of file
    }
  
    const name = readFromBuffer(headerChunk, 0, 255);
    const size = parseInt(readFromBuffer(headerChunk, 255, 269), 10);
    const mTime = readFromBuffer(headerChunk, 269, 281);
    const prefix = readFromBuffer(headerChunk, 281, HEADER_SIZE);
  
    return {
      name,
      size,
      mTime,
      prefix,
    };
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
    const CHUNK_SIZE = 512;
    
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

module.exports = async function wpExtract({
    inputFile: _inputFile,
    outputDir,
    onStart,
    onUpdate,
    onFinish,
    override,
}) {
    if (!fs.existsSync(_inputFile)) {
        throw new Error(
            `Input file at location "${_inputFile}" could not be found.`
        );
    }

    if (override) {
        // Ensure the output dir exists and is empty
        fse.emptyDirSync(outputDir);
    } else {
        if (fs.existsSync(outputDir) && !(await isDirEmpty(outputDir))) {
            throw new Error(
                `Output dir is not empty. Clear it first or use the --force option to override it.`
            );
        }
    }

    const inputFileStat = fs.statSync(_inputFile);
    const inputFile = await fs.promises.open(_inputFile, 'r');

    // Trigger onStart callback
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
    };
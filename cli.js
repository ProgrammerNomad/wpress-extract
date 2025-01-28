#!/usr/bin/env node

const path = require('path');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const cliProgress = require('cli-progress');

const wpExtract = require('./lib/wpress-extract');

async function main({ inputFile, outputDir, override }) {
    const progressBar = new cliProgress.SingleBar(
        {
            format: 'Progress: {bar} | {percentage}%',
            hideCursor: true,
        },
        cliProgress.Presets.shades_classic
    );

    const onStart = (totalSize) => {
        console.log(
            `Extracting content to: ${path.relative(process.cwd(), outputDir)}/`
        );

        progressBar.start(totalSize, 0);
    };

    const onUpdate = (value) => {
        progressBar.update(value);
    };

    let totalFiles = 0;
    const onFinish = (_totalFiles) => {
        totalFiles = _totalFiles;
        progressBar.update(progressBar.getTotal());
        progressBar.stop();
        console.log();
        console.log(`Successfully extracted ${totalFiles} files.`);
    };

    try {
        await wpExtract({
            inputFile,
            outputDir,
            onStart,
            onUpdate,
            onFinish,
            override,
        });
    } catch (error) {
        progressBar.stop();
        console.error('\nError: ', error.message);
    }
}

yargs(hideBin(process.argv))
    .scriptName('wpress-extract2')
    .command(
        '$0 <input>',
        'Extract a .wpress archive',
        (_yargs) => {
            _yargs
                .positional('input', {
                    describe: 'Path to the .wpress archive you want to extract',
                    type: 'string',
                    coerce: path.resolve,
                })
                .option('o', {
                    alias: 'out',
                    describe: 'Directory where the content should be extracted to',
                    type: 'string',
                    coerce: path.resolve,
                })
                .option('f', {
                    alias: 'force',
                    describe: 'Override existing directory',
                    type: 'boolean',
                    default: false,
                })
                .demandOption('input', 'Please provide the input .wpress archive path');
        },
        (argv) => {
            const { input: inputFile, out: outputDir, force: override } = argv;
            return main({
                inputFile,
                outputDir:
                    outputDir ||
                    path.join(
                        path.dirname(inputFile),
                        path.basename(inputFile, path.extname(inputFile))
                    ),
                override,
            });
        }
    )
    .usage('Usage: $0 <input> [options]')
    .example(
        '$0 backup.wpress -o extracted',
        'Extract backup.wpress to the "extracted" directory'
    )
    .help('h')
    .alias('h', 'help')
    .epilog('Copyright (c) 2024 - ProgrammerNomad')
    .argv;
#!/usr/bin/env node

'use strict';

const browserSync = require('browser-sync');
const express = require('express');
const path = require('path');
const server = require('./lib/server.js');
const loader = require('./lib/loader.js');

const readOrError = file => {
    try {
        return loader.loadSpec(file, { resolve: true });
    }
    catch (error) {
        if (error.name == 'OpenError') {
            console.error('Could not open file: ' + error.message);
        }
        else if (error.name == 'ReadError') {
            console.error('Could not read YAML/JSON from file: ' + error.message);
        }
        else {
            console.error(error);
        }
        process.exit(1);
    }
}

const command = async (file, cmd) => {
    const app = express();
    const port = cmd.port;
    const bundleDir = path.dirname(require.resolve('redoc'));
    const html = server.loadHTML(file);
    const spec = await readOrError(file);

    app.use('/assets/redoc', express.static(bundleDir));
    app.get('/spec.json', (req, res) => {
        res.send(JSON.stringify(spec));
    });
    app.get('/', (req, res) => {
        res.send(html);
    });

    if (cmd.watch) {
        app.listen(port + 1, function () {
            const bs = browserSync.create();
            bs.init({
                files: [file],
                proxy: `http://localhost:${port+1}`,
                port,
                logLevel: 'silent',
                open: false
            }, function() {
                console.log(`API Reference Doc server running on http://localhost:${port}!`);
            });
        })
        .on('error', function(e) {
            console.error('failed to start server: ' + e.message);
            process.exit(1);
        });
    }
    else {
        app.listen(port, function () {
            console.log(`API Reference Doc server running on http://localhost:${port}!`);
        })
        .on('error', function(e) {
            console.error('failed to start server: ' + e.message);
            process.exit(1);
        });
    }
}

module.exports = { command };

#!/usr/bin/env node

var fs = require('fs-extra');
fs.copySync('.\\scripts\\arquivos_copiar', '.\\platforms\\android');

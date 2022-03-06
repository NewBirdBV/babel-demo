import * as babylon from "babylon";
import * as t from 'babel-types';

import generate from 'babel-generator';

import traverse from 'babel-traverse';

const fs = require('fs');
const path = require('path');
const async = require('async');
const events = require('events');

const code = `function square(n) {
  return n * n;
}`;


const ast = babylon.parse(code);

traverse(ast, {
    enter(path) {
        if (t.isIdentifier(path.node, { name: "n" })) {
            path.node.name = "x";
        }
    }
});

const output = generate(ast, {}, code);

const promisefy = function(method) {
    return function (...args) {
        return new Promise((res, rej) => {
            method.apply(null, args.concat(
                function (err, ...callbackArgs) {
                    if (err) rej(err);
                    res(callbackArgs);
                }
            ))
        });
    }
};


const mkdir = promisefy(fs.mkdir);
const writeFile = promisefy(fs.writeFile);

mkdir(path.resolve(process.cwd(), 'build'), { recursive: true })
    .then(res => {
        return writeFile(path.resolve(process.cwd(), res[0] || './build', 'b.js'), output.code)
    })
    .then(res => {
        console.log('done');
    });

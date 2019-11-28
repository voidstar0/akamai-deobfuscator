import * as parser from "@babel/parser";
import * as t from '@babel/types';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import beautify from 'js-beautify';
import { get } from 'axios';
import { writeFile, existsSync, mkdirSync } from 'fs';

async function fetchAkamaiScript(url) {
    const res = await get(url);
    const data = res.data;
    if(data.startsWith('var _ac')) {
        return res.data;
    }
    throw new Error('_ac variable not found. Is this an Akamai script?');
}

function deobfuscate(source) {
    const ast = parser.parse(source);
    let acArray = [];

    traverse(ast, {
        VariableDeclaration(path) {
            // Find the variable with the identifier name "_ac". 
            // This holds all of the function & property names
            // so that it can be used as a lookup table.
            const functionNameMap = path.node.declarations.find(d => d.id.name === "_ac");

            if(functionNameMap) {
                // copy all of the values into a copy of the array
                // so we can retrieve the proper function names later on
                acArray = functionNameMap.init.elements.map(n => n.value);

                // remove the _ac variable from the code because it's
                // useless once we recover all of the names.
                path.replaceWith(t.noop());
            }

        },
        MemberExpression(path) {
            // If we find a MemberExpression who's object's name equals with _ac
            // replace it with the value retrieved from the _ac array.
            // e.g.
            // change document[_ac[183]] to document["activeElement"]
            if(path.node.object.name === "_ac") {
                path.replaceWith(t.stringLiteral(acArray[path.node.property.value]));
            }
        }
    })

    // Do one more pass through the AST
    // This changes all of the StringLiterals into Identifiers.
    // This helps us recover the dot operator for function calls
    // and property access instead of array lookup.
    // e.g.
    // document["activeElement"] to document.activeElement
    traverse(ast, {
        MemberExpression(path) {
            if(path.node.property.type === 'StringLiteral') {
                path.replaceWith(t.memberExpression(path.node.object, t.identifier(path.node.property.value), false));
            }
        }
    })

    // Generate the new code given our modifications to the AST
    // and beautify it to recover any indentation that may have
    // been lost.
    let deobfCode = generate(ast, {}, source).code;
    deobfCode = beautify(deobfCode, {indent_size: 2, space_in_empty_paren: true});
    writeCodeToFile(deobfCode);
}

function writeCodeToFile(code) {
    // Create out dir if doesn't exist
    if(!existsSync(__dirname + '/out')) {
        mkdirSync(__dirname + '/out');
    }

    writeFile(__dirname + '/out/output.js', code, (err) => {
        if(err) {
            console.log('Error writing file', err);
        } else {
            console.log('Wrote file to /out/output.js');
        }
    });
}

// Fetch the Akamai URL from the arguments
// or use Eastbay's Akamai script as a default.
fetchAkamaiScript(process.argv[2] || 'https://www.eastbay.com/public/5a8af853a168c3d4ef5e9a6fca7bb')
    .then(src => deobfuscate(src))
    .catch(e => console.log(e));
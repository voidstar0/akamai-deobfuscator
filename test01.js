import * as parser from "@babel/parser";
import * as t from '@babel/types';
import generate from '@babel/generator';
import beautify from 'js-beautify';
import traverse from '@babel/traverse';
import {readFile} from 'fs/promises';

async function _main() {
    let data = await readFile('./test01_data.js');
    let source = data.toString('utf8');
    const ast = parser.parse(source);
    traverse(ast, {
        // return 1, 2, 3
        SequenceExpression(path) {
            if (path.parent && !t.isReturnStatement(path.parent)) {
                return;
            }
            let size = path.node.expressions.length;
            path.parentPath.replaceWithMultiple(path.node.expressions.map(
                (e, i) => {
                    let ne = t.expressionStatement(e);
                    if (i + 1 === size) {
                        ne = t.returnStatement(e);
                    }
                    return ne;
                }
            ));
        },
        // return void (bmak.mr = "undef");
        UnaryExpression(path) {
            if (path.parent && !t.isReturnStatement(path.parent)) {
                return;
            }
            if (path.node.operator !== 'void') {
                return;
            }
            if (!t.isAssignmentExpression(path.node.argument)) {
                return;
            }
            path.parentPath.replaceWithMultiple([
                path.node.argument,
                t.returnStatement()
            ]);
        }
    });

    let newSource = generate(ast, {}, source).code;
    newSource = beautify(newSource, {
        indent_size         : 2,
        space_in_empty_paren: true
    });
    console.log(newSource);
}

_main().catch(e => console.log(e));

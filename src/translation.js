/*
 *
 *   Message Translation and Bundling
 *
 */

const babylon = require('babylon');
import generate from 'babel-generator';
import traverse from 'babel-traverse';

import ast from './ast';
const freeVariables = require('./free-variables');
import validation from './validation';


const Translation = {
    translatedRendererFor(markerNode, translatedMessage, originalMessage) {
        try {
            let unprintedTranslation;
            let freeVars = [];
            if (ast.isElement(markerNode)) {
                const translated = babylon.parse(`<span>${translatedMessage}</span>`, {plugins: ['jsx']});
                freeVars = freeVariables.freeVariablesInMessage(markerNode);
                const reconstituted = Translation.reconstitute(markerNode, translated);
                unprintedTranslation = generate(reconstituted, undefined, translatedMessage).code;
            } else {
                unprintedTranslation = JSON.stringify(translatedMessage) + ';';
            }
            return Translation.renderer(freeVars, unprintedTranslation, markerNode);
        } catch(exc) {
            return Translation.errorRenderer(originalMessage, exc)
        }
    },

    reconstitute(original, translated) {
        traverse(original, {
            noScope: true,
            JSXElement({node}) {
                ast.convertNamespacedNameToIdAttribute(node);
            }
        });
        const sanitized = validation.sanitizedAttributesOf(original);
        traverse(translated, {
            JSXElement({node}) {
                ast.convertNamespacedNameToIdAttribute(node);
                const id = ast.idOrComponentName(node);
                if (sanitized[id]) {
                    sanitized[id].forEach(a => {
                        node.openingElement.attributes.push(a);
                    })
                }
                ast.removeIdAttribute(node);
            },
        });

        return translated;
    },

    renderer(freeVariables, translation, originalNode) {
        return (
`function(${freeVariables.join(', ')}) { return ${translation} }`
        );
    },

    errorRenderer(message, exception) {
        return (
`function() {
    return <span class="error">Error for translation of ${message}:
<pre>
${exception}
${exception.stack}
</pre></span>;
}`
        );
    },
};

export default Translation;

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = freeVariablesInMessage;

var _ast = require('./ast');

var _generation = require('./generation');

var _generation2 = _interopRequireDefault(_generation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var add = function add(set, key) {
    return set[key] = true;
};
var del = function del(set, key) {
    return delete set[key];
};

function freeVariablesInMessage(node) {
    if (!(0, _ast.isElement)(node)) {
        return [];
    }
    var variables = {};
    freeVariablesInChildren(node.children, variables);
    del(variables, 'this');
    return Object.keys(variables);
}

function freeVariablesInChildren(children, variables) {
    children.forEach(function (child) {
        switch (child.type) {
            case 'JSXElement':
                freeVariablesInElement(child, variables);
                break;

            case 'JSXExpressionContainer':
                freeVariablesInExpression(child.expression, variables);
                break;
        }
    });
}

function freeVariablesInElement(element, variables) {
    freeVariablesInElementName(element.openingElement.name, variables);
    freeVariablesInAttributes(element.openingElement.attributes, variables);
    freeVariablesInChildren(element.children, variables);
}

function freeVariablesInElementName(name, variables) {
    if (name.type === 'JSXIdentifier') {
        if (name.name.toLowerCase() !== name.name) {
            add(variables, name.name);
        }
    } else if (name.type === 'JSXMemberExpression') {
        // FIXME
        add(variables, (0, _generation2.default)(name).split('.')[0]);
    } else if (name.type === 'JSXNamespacedName') {
        if (name.namespace.name.toLowerCase() !== name.namespace.name) {
            add(variables, name.namespace.name);
        }
    }
}

function freeVariablesInAttributes(attributes, variables) {
    attributes.forEach(function (a) {
        return freeVariablesInAttribute(a, variables);
    });
}

function freeVariablesInAttribute(attribute, variables) {
    if (attribute.value && attribute.value.type === 'JSXExpressionContainer') {
        freeVariablesInExpression(attribute.value.expression, variables);
    }
    if (attribute.type === 'JSXSpreadAttribute') {
        freeVariablesInExpression(attribute.argument, variables);
    }
}

function freeVariablesInObjectExpression(expression, variables) {
    expression.properties.forEach(function (property) {
        if (property.type === 'SpreadProperty') {
            freeVariablesInExpression(property.argument, variables);
        } else {
            freeVariablesInExpression(property.value, variables);
            if (property.computed) {
                freeVariablesInExpression(property.key, variables);
            }
        }
    });
}

function freeVariablesInExpression(expression, variables) {
    switch (expression.type) {
        case 'Identifier':
            add(variables, expression.name);
            break;

        case 'MemberExpression':
            add(variables, (0, _generation2.default)(expression).split('.')[0]);
            break;

        case 'CallExpression':
            freeVariablesInExpression(expression.callee, variables);
            break;

        case 'BinaryExpression':
            freeVariablesInExpression(expression.left, variables);
            freeVariablesInExpression(expression.right, variables);
            break;

        case 'ObjectExpression':
            freeVariablesInObjectExpression(expression, variables);
            break;

        case 'Literal':
        case 'StringLiteral':
        case 'NumericLiteral':
        case 'BooleanLiteral':
        case 'JSXEmptyExpression':
            // noop
            break;

        default:
            console.log(expression);
    }
}


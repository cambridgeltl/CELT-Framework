// Jest doesn't implement Metro's require.context(). In tests only, rewrite
//   require.context(dir, recursive, regex)
// into
//   global.__requireContext(__dirname, dir, recursive, regex)
// which test/require-context.js implements with fs.
module.exports = function requireContextPlugin({ types: t }) {
  return {
    visitor: {
      CallExpression(path) {
        const callee = path.get('callee');
        if (
          callee.isMemberExpression() &&
          t.isIdentifier(callee.node.object, { name: 'require' }) &&
          t.isIdentifier(callee.node.property, { name: 'context' })
        ) {
          path.replaceWith(
            t.callExpression(
              t.memberExpression(t.identifier('global'), t.identifier('__requireContext')),
              [t.identifier('__dirname'), ...path.node.arguments]
            )
          );
        }
      },
    },
  };
};

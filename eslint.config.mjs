// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      // eslint ignore globs here
      'memory-bank/**',
    ],
  },
  {
    rules: {
      // overrides
      'no-console': 'off',
      'no-cond-assign': 'off',
      'unused-imports/no-unused-vars': 'off',
      'node/prefer-global/buffer': 'off',
      'node/prefer-global/process': 'off',
      'regexp/no-unused-capturing-group': 'off',
      'regexp/no-useless-quantifier': 'off',
      'regexp/no-super-linear-backtracking': 'off',
    },
  },
)

const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  ...compilerOptions,
  baseUrl: '.',
  paths: {
    '@/*': ['src/*'],
    '@/types/*': ['src/types/*'],
    '@/services/*': ['src/services/*'],
    '@/controllers/*': ['src/controllers/*'],
    '@/middleware/*': ['src/middleware/*'],
    '@/utils/*': ['src/utils/*'],
    '@/config/*': ['src/config/*'],
  },
}; 
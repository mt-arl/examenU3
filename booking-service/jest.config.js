module.exports = {
    testEnvironment: 'node',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/app.js',
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
    ],
    testMatch: [
        '**/__tests__/**/*.test.js',
    ],
    setupFilesAfterEnv: [],
    verbose: true,
};

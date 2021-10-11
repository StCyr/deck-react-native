module.exports = {
    "settings": {
        "react": {
          "version": "detect",
        },
    },
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    "parserOptions": {
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 13
    },
    "plugins": [
        "react"
    ],
    "rules": {
        "react/prop-types": 0
    }
};

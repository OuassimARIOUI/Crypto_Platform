/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/app/**/*.{js,jsx}",
        "./src/components/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#0bda57",
                "background-dark": "#0A0E23",
            },
        },
    },
    plugins: [],
};

const config = {
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: "var(--background)",
				foreground: "var(--foreground)",
			},
      keyframes: {
				fadeIn: {
					from: { opacity: 0 },
					to: { opacity: 1 },
				},
        fadeInUp: {
          from: {
            // transform: "translateY(100%)",
            scale: "0",
            opacity: "0"
          },
          to: {
            // transform: "translateY(0%)",
            scale: "1",
            opacity: "1",
          }
        }
			},
      animation: {
				"fade": 'fadeIn .5s ease-in',
        "fadeInUp": ".6s fadeInUp "
			},
		},
		},
};

module.exports = config;

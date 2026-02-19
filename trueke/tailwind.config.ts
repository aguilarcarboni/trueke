/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
  	container: {
  		center: 'true',
  		padding: '2rem',
  		screens: {}
  	},
  	extend: {
  		rotate: {
  			'30': '30deg',
  			'60': '60deg',
  			'90': '90deg',
  			'120': '120deg'
  		},
  		colors: {
  			background: '#FFFFFF',
  			foreground: '#062D47',
  			primary: {
  				light: '#fac49e',
  				DEFAULT: '#f26c0d',
  				dark: '#d46010'
  			},
  			secondary: {
				light: '#5996C0',
				DEFAULT: '#2571A5',
				dark: '#062D47'
			},
  			muted: {
  				DEFAULT: '#F1F5F9'
  			},
  			subtitle: {
  				DEFAULT: '#646C77'
  			},
			success: {
			DEFAULT: '#22C55E',
			},
			error: {
  				DEFAULT: '#FA3232',
  			},
  			'color-1': 'hsl(var(--color-1))',
  			'color-2': 'hsl(var(--color-2))',
  			'color-3': 'hsl(var(--color-3))',
  			'color-4': 'hsl(var(--color-4))',
  			'color-5': 'hsl(var(--color-5))'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'rotate-x-90': {
  				from: {
  					transform: 'rotateX(0deg)'
  				},
  				to: {
  					transform: 'rotateX(90deg)'
  				}
  			},
  			rainbow: {
  				'0%': {
  					'background-position': '0%'
  				},
  				'100%': {
  					'background-position': '200%'
  				}
  			},
  			fadeIn: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'shimmer-slide': {
  				to: {
  					transform: 'translate(calc(100cqw - 100%), 0)'
  				}
  			},
  			'spin-around': {
  				'0%': {
  					transform: 'translateZ(0) rotate(0)'
  				},
  				'15%, 35%': {
  					transform: 'translateZ(0) rotate(90deg)'
  				},
  				'65%, 85%': {
  					transform: 'translateZ(0) rotate(270deg)'
  				},
  				'100%': {
  					transform: 'translateZ(0) rotate(360deg)'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'rotate-x-90': 'rotate-x-90 0.1s linear',
  			rainbow: 'rainbow var(--speed, 2s) infinite linear',
  			'fade-in': 'fadeIn 0.5s ease-out forwards',
  			'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
  			'spin-around': 'spin-around calc(var(--speed) * 2) infinite linear'
  		}
  	}
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}

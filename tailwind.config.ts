import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Premium Gradient Colors
        gradient: {
          primary: 'linear-gradient(135deg, #0066CC 0%, #0052A3 100%)',
          accent: 'linear-gradient(135deg, #00D4FF 0%, #0099FF 100%)',
          success: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
          warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          danger: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          glass: 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
          'dark-glass': 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
        },
        // Primary Colors - Professional Blue
        primary: {
          50: '#F0F7FF',
          100: '#E0EFFE',
          200: '#C7E0FD',
          300: '#A4C8FC',
          400: '#76A5FA',
          500: '#0066CC',
          600: '#0052A3',
          700: '#003D99',
          800: '#002E70',
          900: '#001F47',
          light: '#E6F0FF',
          DEFAULT: '#0066CC',
          dark: '#003D99',
        },
        // Success Colors - Green
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBFBDC',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#145231',
          light: '#DCFCE7',
          DEFAULT: '#22C55E',
          dark: '#15803D',
        },
        // Warning Colors - Amber
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          light: '#FEF3C7',
          DEFAULT: '#F59E0B',
          dark: '#B45309',
        },
        // Danger Colors - Red
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          light: '#FEE2E2',
          DEFAULT: '#EF4444',
          dark: '#991B1B',
        },
        // Neutral/Grayscale
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          150: '#F0F0F0',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Semantic Colors
        info: '#3B82F6',
        'low-stock': '#F59E0B',
        'out-of-stock': '#EF4444',
        'in-stock': '#22C55E',
        // Brand colors
        brand: {
          primary: '#0066CC',
          accent: '#00D4FF',
          dark: '#001F47',
        },
      },
      backgroundColor: {
        glass: 'rgba(255, 255, 255, 0.1)',
        'glass-dark': 'rgba(30, 41, 59, 0.1)',
        'glass-light': 'rgba(255, 255, 255, 0.15)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      spacing: {
        // Spacing Scale
        0: '0',
        1: '0.25rem',  // 4px
        2: '0.5rem',   // 8px
        3: '0.75rem',  // 12px
        4: '1rem',     // 16px
        5: '1.25rem',  // 20px
        6: '1.5rem',   // 24px
        7: '1.75rem',  // 28px
        8: '2rem',     // 32px
        10: '2.5rem',  // 40px
        12: '3rem',    // 48px
        14: '3.5rem',  // 56px
        16: '4rem',    // 64px
        20: '5rem',    // 80px
        24: '6rem',    // 96px
        28: '7rem',    // 112px
        32: '8rem',    // 128px
      },
      fontSize: {
        // Typography Scale
        xs: ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],       // 12px
        sm: ['0.875rem', { lineHeight: '1.43', fontWeight: '400' }],     // 14px
        base: ['1rem', { lineHeight: '1.5', fontWeight: '400' }],        // 16px
        lg: ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],      // 18px (H3)
        xl: ['1.25rem', { lineHeight: '1.4', fontWeight: '700' }],       // 20px
        '2xl': ['1.5rem', { lineHeight: '1.33', fontWeight: '700' }],    // 24px (H2)
        '3xl': ['1.875rem', { lineHeight: '1.2', fontWeight: '700' }],   // 30px
        '4xl': ['2rem', { lineHeight: '1.25', fontWeight: '700' }],      // 32px (H1)
        '5xl': ['3rem', { lineHeight: '1.2', fontWeight: '800' }],       // 48px
      },
      fontWeight: {
        // Font Weights
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      lineHeight: {
        // Line Heights
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
      },
      boxShadow: {
        // Premium Shadow Scale
        none: 'none',
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        // Premium effects
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.25)',
        'glass-lg': '0 15px 35px 0 rgba(31, 38, 135, 0.4)',
        'glow': '0 0 20px rgba(0, 102, 204, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 102, 204, 0.4)',
        'glow-accent': '0 0 20px rgba(0, 212, 255, 0.3)',
      },
      borderRadius: {
        // Border Radius
        none: '0',
        xs: '0.25rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      screens: {
        // Responsive Breakpoints
        xs: '320px',   // Extra small mobile
        sm: '640px',   // Small mobile
        md: '768px',   // Tablet
        lg: '1024px',  // Desktop
        xl: '1280px',  // Large desktop
        '2xl': '1536px', // Extra large desktop
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-elastic': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
      animation: {
        // Premium animations
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-in',
        'slide-in-up': 'slideInUp 0.4s ease-out',
        'slide-in-down': 'slideInDown 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        // Premium keyframes
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 102, 204, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 102, 204, 0.5)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      filter: {
        'blur-sm': 'blur(4px)',
        'blur-md': 'blur(8px)',
        'blur-lg': 'blur(12px)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;

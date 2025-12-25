/**
 * FRAMER MOTION ANIMATION CONFIGURATIONS
 * 
 * Purposeful animations that enhance UX without being distracting
 * All animations respect prefers-reduced-motion
 */

// Check if user prefers reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Page transition animations
 */
export const pageVariants = {
    initial: {
        opacity: 0,
        y: prefersReducedMotion ? 0 : 20
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: prefersReducedMotion ? 0.01 : 0.4,
            ease: 'easeOut'
        }
    },
    exit: {
        opacity: 0,
        y: prefersReducedMotion ? 0 : -20,
        transition: {
            duration: prefersReducedMotion ? 0.01 : 0.3,
            ease: 'easeIn'
        }
    }
};

/**
 * Stagger children animation
 */
export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: prefersReducedMotion ? 0 : 0.1,
            delayChildren: prefersReducedMotion ? 0 : 0.1
        }
    }
};

export const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: prefersReducedMotion ? 0.01 : 0.3,
            ease: 'easeOut'
        }
    }
};

/**
 * Balance avatar animations
 * Creditors glow, debtors pulse, neutral stays calm
 */
export const balanceAvatarVariants = {
    creditor: {
        boxShadow: prefersReducedMotion
            ? '0 0 0 0 rgba(34, 197, 94, 0)'
            : [
                '0 0 0 0 rgba(34, 197, 94, 0.4)',
                '0 0 20px 5px rgba(34, 197, 94, 0.6)',
                '0 0 0 0 rgba(34, 197, 94, 0.4)'
            ],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    },
    debtor: {
        scale: prefersReducedMotion ? 1 : [1, 1.05, 1],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    },
    neutral: {
        scale: 1,
        boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)'
    }
};

/**
 * Breathing animation for calm UI elements
 */
export const breathingVariants = {
    animate: {
        scale: prefersReducedMotion ? 1 : [1, 1.02, 1],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    }
};

/**
 * Expense entry animation
 * Amount field expands smoothly
 */
export const expenseInputVariants = {
    initial: {
        scale: 1
    },
    focus: {
        scale: prefersReducedMotion ? 1 : 1.05,
        transition: {
            duration: 0.2,
            ease: 'easeOut'
        }
    }
};

/**
 * Split animation
 * Visual "split" effect when expense is created
 */
export const splitAnimationVariants = {
    initial: {
        opacity: 0,
        scale: 0.8
    },
    animate: {
        opacity: [0, 1, 1, 0],
        scale: [0.8, 1.2, 1.2, 1.5],
        transition: {
            duration: prefersReducedMotion ? 0.01 : 1.2,
            times: [0, 0.3, 0.7, 1],
            ease: 'easeOut'
        }
    }
};

/**
 * Settlement arrow animation
 * Animated arrows between users
 */
export const settlementArrowVariants = {
    initial: {
        pathLength: 0,
        opacity: 0
    },
    animate: {
        pathLength: 1,
        opacity: 1,
        transition: {
            pathLength: {
                duration: prefersReducedMotion ? 0.01 : 1,
                ease: 'easeInOut'
            },
            opacity: {
                duration: prefersReducedMotion ? 0.01 : 0.3
            }
        }
    }
};

/**
 * Money flow animation
 * ₹ symbols flowing along paths
 */
export const moneyFlowVariants = {
    initial: {
        x: 0,
        opacity: 0
    },
    animate: {
        x: prefersReducedMotion ? 0 : 100,
        opacity: prefersReducedMotion ? 1 : [0, 1, 1, 0],
        transition: {
            duration: prefersReducedMotion ? 0.01 : 2,
            repeat: Infinity,
            ease: 'linear'
        }
    }
};

/**
 * Success celebration animation
 * "All Settled" animation
 */
export const celebrationVariants = {
    initial: {
        scale: 0,
        rotate: -180
    },
    animate: {
        scale: [0, 1.2, 1],
        rotate: 0,
        transition: {
            duration: prefersReducedMotion ? 0.01 : 0.6,
            ease: 'easeOut'
        }
    }
};

/**
 * Card hover animation
 */
export const cardHoverVariants = {
    initial: {
        y: 0,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    },
    hover: {
        y: prefersReducedMotion ? 0 : -4,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        transition: {
            duration: 0.2,
            ease: 'easeOut'
        }
    }
};

/**
 * Modal animation
 */
export const modalVariants = {
    hidden: {
        opacity: 0,
        scale: prefersReducedMotion ? 1 : 0.95,
        y: 20
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: prefersReducedMotion ? 0.01 : 0.3,
            ease: 'easeOut'
        }
    },
    exit: {
        opacity: 0,
        scale: prefersReducedMotion ? 1 : 0.95,
        y: 20,
        transition: {
            duration: prefersReducedMotion ? 0.01 : 0.2,
            ease: 'easeIn'
        }
    }
};

/**
 * Backdrop animation
 */
export const backdropVariants = {
    hidden: {
        opacity: 0
    },
    visible: {
        opacity: 1,
        transition: {
            duration: prefersReducedMotion ? 0.01 : 0.3
        }
    },
    exit: {
        opacity: 0,
        transition: {
            duration: prefersReducedMotion ? 0.01 : 0.2
        }
    }
};

/**
 * List item animation
 */
export const listItemVariants = {
    hidden: {
        opacity: 0,
        x: prefersReducedMotion ? 0 : -20
    },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: prefersReducedMotion ? 0 : i * 0.05,
            duration: prefersReducedMotion ? 0.01 : 0.3,
            ease: 'easeOut'
        }
    })
};

/**
 * Number counter animation
 * Smooth number transitions for balances
 */
export const numberCounterTransition = {
    duration: prefersReducedMotion ? 0.01 : 0.8,
    ease: 'easeOut'
};

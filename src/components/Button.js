import { forwardRef } from 'react';
import styles from './Button.module.css';

/** Shared pill button. variant: "primary" (rose gold, shimmering) or "ghost" (quiet outline). */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      {...rest}
    >
      <span className={styles.label}>{children}</span>
    </button>
  );
});

export default Button;

import React from 'react';
import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  donateButton: {
    backgroundColor: '#0077be', // Water Warrior Blue
    color: '#FFFFFF',
    fontWeight: 'bold',
    padding: theme.spacing(1.5, 4),
    fontSize: '1rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    '&:hover': {
      backgroundColor: '#005a94', // Darker shade on hover
      transform: 'scale(1.02)',
      transition: 'all 0.2s ease-in-out',
    },
    '&:focus': {
      outline: '2px solid #0077be',
      outlineOffset: '2px',
    },
  },
}));

/**
 * Water Warrior Donate Button Component
 * 
 * Links to Anedot donation page with $500 hard limit enforcement.
 * 
 * @param {Object} props - Component props
 * @param {string} props.href - Anedot donation page URL (defaults to campaign URL)
 * @param {string} props.variant - MUI Button variant (defaults to 'contained')
 * @param {string} props.size - MUI Button size (defaults to 'large')
 * @param {boolean} props.fullWidth - Make button full width (defaults to false)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Donate button component
 */
const DonateButton = ({ 
  href = 'https://secure.anedot.com/davis-jones-for-mayor/donate',
  variant = 'contained',
  size = 'large',
  fullWidth = false,
  className = '',
  ...rest
}) => {
  const classes = useStyles();

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${classes.donateButton} ${className}`}
      {...rest}
    >
      JOIN THE WATER WARRIORS
    </Button>
  );
};

export default DonateButton;

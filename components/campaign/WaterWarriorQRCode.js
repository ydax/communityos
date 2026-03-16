import React from 'react';
import { Box, Typography, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  qrContainer: {
    padding: theme.spacing(3),
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    border: '3px solid #0077be',
    borderRadius: theme.spacing(1),
    maxWidth: '400px',
    margin: '0 auto',
  },
  qrPlaceholder: {
    width: '250px',
    height: '250px',
    margin: '0 auto',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed #0077be',
    borderRadius: theme.spacing(0.5),
  },
  title: {
    fontWeight: 'bold',
    color: '#0077be',
    marginBottom: theme.spacing(2),
  },
  mascot: {
    fontSize: '4rem',
    marginBottom: theme.spacing(2),
  },
  instructions: {
    marginTop: theme.spacing(2),
    color: '#333',
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  disclosure: {
    marginTop: theme.spacing(2),
    fontSize: '0.75rem',
    color: '#666',
    fontStyle: 'italic',
  },
}));

/**
 * Water Warrior QR Code Component
 * 
 * For use in "Coffee Coalition" meetings and printed materials.
 * Displays QR code linking to Anedot donation page.
 * 
 * @param {Object} props - Component props
 * @param {string} props.donateUrl - Anedot URL to encode in QR (defaults to campaign URL)
 * @param {string} props.qrCodeImageUrl - URL to pre-generated QR code image (optional)
 * @param {boolean} props.showInstructions - Display scan instructions (defaults to true)
 * @returns {JSX.Element} QR code display component
 */
const WaterWarriorQRCode = ({
  donateUrl = 'https://secure.anedot.com/davis-jones-for-mayor/donate',
  qrCodeImageUrl,
  showInstructions = true,
}) => {
  const classes = useStyles();

  return (
    <Paper elevation={3} className={classes.qrContainer}>
      <div className={classes.mascot}>💧🛡️</div>
      
      <Typography variant="h5" className={classes.title}>
        JOIN THE WATER WARRIORS
      </Typography>

      <Box className={classes.qrPlaceholder}>
        {qrCodeImageUrl ? (
          <img 
            src={qrCodeImageUrl} 
            alt="Water Warrior QR Code" 
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <Typography variant="body2" color="textSecondary">
            QR Code Here
            <br />
            Generate at: qr-code-generator.com
            <br />
            Link: {donateUrl}
          </Typography>
        )}
      </Box>

      {showInstructions && (
        <Typography variant="body2" className={classes.instructions}>
          <strong>Scan to Donate</strong>
          <br />
          "I don't take PAC money. I have a $500 limit because I work for the River, 
          not the developers. If you want to help us keep the magic flowing, 
          scan this code. It takes 30 seconds to join the tribe."
        </Typography>
      )}

      <Typography variant="caption" className={classes.disclosure}>
        Pol. Adv. Pd. for by Davis Jones Campaign
      </Typography>
    </Paper>
  );
};

export default WaterWarriorQRCode;

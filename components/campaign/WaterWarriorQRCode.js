import React from 'react';

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
  return (
    <div className="bg-white border-[3px] border-[#0077be] rounded-lg p-6 max-w-[400px] mx-auto text-center shadow-medium">
      <div className="text-6xl mb-4">💧🛡️</div>

      <h2 className="text-xl font-bold text-[#0077be] mb-4">
        JOIN THE WATER WARRIORS
      </h2>

      <div className="w-[250px] h-[250px] mx-auto bg-[#f0f0f0] flex items-center justify-center border-2 border-dashed border-[#0077be] rounded">
        {qrCodeImageUrl ? (
          <img
            src={qrCodeImageUrl}
            alt="Water Warrior QR Code"
            className="w-full h-full"
          />
        ) : (
          <p className="text-sm text-gray-500 leading-relaxed px-4">
            QR Code Here
            <br />
            Generate at: qr-code-generator.com
            <br />
            Link: {donateUrl}
          </p>
        )}
      </div>

      {showInstructions && (
        <p className="mt-4 text-[#333] text-sm leading-relaxed">
          <strong>Scan to Donate</strong>
          <br />
          &ldquo;I don&apos;t take PAC money. I have a $500 limit because I work for the River,
          not the developers. If you want to help us keep the magic flowing,
          scan this code. It takes 30 seconds to join the tribe.&rdquo;
        </p>
      )}

      <p className="mt-4 text-xs text-[#666] italic">
        Pol. Adv. Pd. for by Davis Jones Campaign
      </p>
    </div>
  );
};

export default WaterWarriorQRCode;

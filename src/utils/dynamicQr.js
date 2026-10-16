const crypto = require("crypto");

const QR_INTERVAL_SECONDS = 20;

const getQrSecret = () => {
  const secret = process.env.QR_SECRET_KEY;

  if (!secret) {
    throw new Error("QR_SECRET_KEY is not configured.");
  }

  return secret;
};

// Generate a token for a specific session and time window.
const generateQrToken = (sessionId, windowNumber) => {
  const secret = getQrSecret();

  return crypto
    .createHmac("sha256", secret)
    .update(`${sessionId}:${windowNumber}`)
    .digest("hex");
};

// Generate the payload that the faculty dashboard will encode
// into its QR code.
const generateDynamicQrPayload = (
  sessionId,
  now = Date.now()
) => {
  const windowNumber = Math.floor(
    now / (QR_INTERVAL_SECONDS * 1000)
  );

  const qrToken = generateQrToken(
    sessionId,
    windowNumber
  );

  return {
    sessionId: sessionId.toString(),
    window: windowNumber,
    qrToken,
    expiresAt: (windowNumber + 1) * QR_INTERVAL_SECONDS * 1000,
  };
};

// Validate the scanned QR payload.
const validateDynamicQrPayload = ({
  sessionId,
  window,
  qrToken,
  now = Date.now(),
}) => {
  if (
    !sessionId ||
    !Number.isSafeInteger(window) ||
    typeof qrToken !== "string" ||
    !/^[a-f0-9]{64}$/i.test(qrToken)
  ) {
    return false;
  }

  const currentWindow = Math.floor(
    now / (QR_INTERVAL_SECONDS * 1000)
  );

  // Reject tokens from previous or future time windows.
  if (window !== currentWindow) {
    return false;
  }

  const expectedToken = generateQrToken(
    sessionId,
    window
  );

  const receivedBuffer = Buffer.from(qrToken, "hex");
  const expectedBuffer = Buffer.from(expectedToken, "hex");

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
};

module.exports = {
  QR_INTERVAL_SECONDS,
  generateDynamicQrPayload,
  validateDynamicQrPayload,
};
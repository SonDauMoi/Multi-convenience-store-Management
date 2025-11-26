import paypal from "@paypal/checkout-server-sdk";

const requiredEnv = ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"];

const validateEnv = () => {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing PayPal configuration values: ${missing.join(
        ", "
      )}. Update your environment variables.`
    );
  }
};

const createEnvironment = () => {
  validateEnv();
  const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (mode === "live") {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
};

let paypalClientInstance = null;

export const getPaypalClient = () => {
  if (!paypalClientInstance) {
    paypalClientInstance = new paypal.core.PayPalHttpClient(
      createEnvironment()
    );
  }
  return paypalClientInstance;
};

export const getPaypalCurrency = () =>
  (process.env.PAYPAL_CURRENCY || "USD").toUpperCase();

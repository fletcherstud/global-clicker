import ReactGA from 'react-ga4';

// Initialize GA4 with your measurement ID
export const initGA = (measurementId) => {
  ReactGA.initialize(measurementId);
};

// Track page views
export const trackPageView = (path) => {
  ReactGA.send({ hitType: "pageview", page: path });
};

// Track button clicks
export const trackButtonClick = (buttonName, category = "Button Click", additionalParams = {}) => {
  console.log("Tracking button click:", buttonName, category, additionalParams);
  ReactGA.event({
    category: category,
    action: "click",
    label: buttonName,
    ...additionalParams
  });
};

// Track custom events
export const trackEvent = (category, action, label = null, value = null) => {
  ReactGA.event({
    category,
    action,
    label,
    value
  });
}; 
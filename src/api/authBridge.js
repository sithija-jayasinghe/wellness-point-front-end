let logoutCallback = () => {};
let navigateCallback = () => {};

export const registerLogout = (callback) => {
    logoutCallback = callback;
};

export const registerNavigate = (callback) => {
    navigateCallback = callback;
};

export const triggerLogout = () => {
    if (logoutCallback) logoutCallback();
};

export const triggerNavigate = (path) => {
    if (navigateCallback) navigateCallback(path);
};

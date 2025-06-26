const openDashboardButton = document.getElementById("open-dashboard");
const enableAIApplyButton = document.getElementById("enable-AI-Apply");
const closeBtn = document.getElementById("close-btn");

function closePopup(noDelay = false) {
  if (noDelay) {
    window.close();
    return;
  }
  setTimeout(() => {
    window.close();
  }, 1000);
}

function openDashboard() {
  chrome.runtime.sendMessage({ message: "OPEN_INTERNAL" });
  closePopup();
}

function enableAIApply() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs?.[0];
    if (tab) {
      chrome.runtime.sendMessage({ message: "ENABLE_AI_APPLY_BUTTON", tab });
    }
    closePopup();
  });
}

openDashboardButton.addEventListener("click", openDashboard);
enableAIApplyButton.addEventListener("click", enableAIApply);
closeBtn.addEventListener("click", () => closePopup(true));

window.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage(
    { message: "IS_EXTENSION_INSTALLED" },
    (response) => {
      if (!response?.extensionInstalled) {
        enableAIApplyButton.classList.add("disabled");
        enableAIApplyButton.removeEventListener("click", enableAIApply);
        document.getElementById("open-dashboard-text").innerText =
          "Sign up & Sync LinkedIn with Weekday";
        const svg = document.getElementById("dashboard-icon");
        svg.innerHTML = `
<path d="M11.4584 13.7303C13.0104 13.7303 14.2684 12.4723 14.2684 10.9203C14.2684 9.36843 13.0104 8.11035 11.4584 8.11035C9.90651 8.11035 8.64844 9.36843 8.64844 10.9203C8.64844 12.4723 9.90651 13.7303 11.4584 13.7303Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16.6495 20.2007C16.6495 17.8707 14.3295 15.9707 11.4595 15.9707C8.58953 15.9707 6.26953 17.8607 6.26953 20.2007" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M21 12.5C21 17.75 16.75 22 11.5 22C6.25 22 2 17.75 2 12.5C2 7.25 6.25 3 11.5 3C12.81 3 14.06 3.25999 15.2 3.73999C15.07 4.13999 15 4.56 15 5C15 5.75 15.21 6.46 15.58 7.06C15.78 7.4 16.04 7.70997 16.34 7.96997C17.04 8.60997 17.97 9 19 9C19.44 9 19.86 8.92998 20.25 8.78998C20.73 9.92998 21 11.19 21 12.5Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M23 5C23 5.32 22.96 5.62999 22.88 5.92999C22.79 6.32999 22.63 6.72 22.42 7.06C21.94 7.87 21.17 8.49998 20.25 8.78998C19.86 8.92998 19.44 9 19 9C17.97 9 17.04 8.60997 16.34 7.96997C16.04 7.70997 15.78 7.4 15.58 7.06C15.21 6.46 15 5.75 15 5C15 4.56 15.07 4.13999 15.2 3.73999C15.39 3.15999 15.71 2.64002 16.13 2.21002C16.86 1.46002 17.88 1 19 1C20.18 1 21.25 1.51002 21.97 2.33002C22.61 3.04002 23 3.98 23 5Z" stroke="#292D32" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M20.4917 4.97949H17.5117" stroke="#292D32" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M19 3.51953V6.50952" stroke="#292D32" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
`;
      }
    }
  );
});

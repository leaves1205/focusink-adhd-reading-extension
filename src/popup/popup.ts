const statusElement =
  document.querySelector<HTMLParagraphElement>("#status");

if (!statusElement) {
  throw new Error("FocusInk status element was not found.");
}

statusElement.textContent = "Extension loaded successfully.";